'use server';

import { db } from '@/lib/db';
import { listings, NewListing, ListingStatus } from '@/lib/db/schema/listings';
import { categories } from '@/lib/db/schema/categories';
import { photos } from '@/lib/db/schema/photos';
import { listingPhotos } from '@/lib/db/schema/listing_photos';
import { orderItems } from '@/lib/db/schema/order_items';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, inArray, asc, desc, sql, and, not } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { users } from '@/lib/db/schema/users';
import { count } from 'drizzle-orm';
import { checkUserSuspension } from '@/lib/auth';

// Validation schema for listing creation
const listingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  price: z.number().positive('Price must be greater than 0'),
  description: z.string().max(500).optional(),
  longDescription: z
    .string()
    .max(2000, 'Detailed description cannot exceed 2000 characters')
    .optional(),
  categoryId: z.number().optional().nullable(),
  status: z.enum(['Active', 'Archived', 'Draft']),
  sellerId: z.number(),
});

// Validation schema for photo uploads
const photoSchema = z.object({
  image: z.string().min(1, 'Image data is required'),
});

export interface ListingFormData {
  title: string;
  price: number;
  description?: string;
  longDescription?: string;
  categoryId?: number | null;
  status: ListingStatus;
  sellerId: number;
}

export interface SellerInfo {
  id: number;
  username: string;
  profileImage?: string | null;
  activeListingsCount: number;
  archivedListingsCount: number;
  bio?: string | null;
}

export interface ListingWithPhotos {
  id: number;
  title: string;
  price: string;
  description: string | null;
  longDescription: string | null;
  categoryId: number | null;
  categoryName?: string | null;
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;
  seller?: SellerInfo;
  photos: string[]; // Base64 encoded images
}

export interface ShortListing {
  id: number;
  title: string;
  price: string;
  category: string | null;
  categoryId: number | null;
  photo: string | null; // Single thumbnail photo Base64 encoded
  createdAt: Date;
  sellerId: number;
}

// Helper function to generate Levenshtein distance SQL for a column
function getLevenshteinSql(column: PgColumn, searchTerm: string, maxDistance: number) {
  return sql`(
    SELECT MIN(levenshtein(
      lower(substring(${column} from i for ${sql.raw(searchTerm.length.toString())})),
      lower(substring(${searchTerm}, 1, 255))
    ))
    FROM generate_series(1, GREATEST(1, length(${column}) - ${sql.raw(searchTerm.length.toString())} + 1)) as i
  ) <= ${maxDistance}`;
}

/**
 * Recursively collect all descendant category IDs for a given category.
 */
async function getDescendantCategoryIds(categoryId: number): Promise<number[]> {
  const allCategories = await db.select().from(categories);
  const map = new Map<number, number[]>();
  for (const cat of allCategories)
    if (cat.parentId) (map.get(cat.parentId) ?? map.set(cat.parentId, []).get(cat.parentId)!).push(cat.id);
  const result: number[] = [categoryId];
  function collect(id: number) {
    const children = map.get(id) ?? [];
    for (const childId of children) {
      result.push(childId);
      collect(childId);
    }
  }
  collect(categoryId);
  return result;
}

export async function createListing(
  formData: ListingFormData,
  photoData: string[] = []
): Promise<{ success: boolean; listingId?: number; error?: string }> {
  try {
    // Check if user is suspended
    await checkUserSuspension(formData.sellerId);
    
    // Validate form data
    const validatedData = listingSchema.parse(formData);

    // Prepare listing data for database
    const listingData: NewListing = {
      title: validatedData.title,
      price: validatedData.price.toString(),
      description: validatedData.description ?? null,
      longDescription: validatedData.longDescription ?? null,
      categoryId: validatedData.categoryId ?? null,
      status: validatedData.status,
      sellerId: validatedData.sellerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert listing and get ID
    const [newListing] = await db.insert(listings).values(listingData).returning();

    // Upload photos if any
    if (photoData.length > 0) {
      for (const imageData of photoData) {
        try {
          // Validate photo data
          photoSchema.parse({ image: imageData });

          // Insert photo
          const [photoRecord] = await db
            .insert(photos)
            .values({
              image: imageData,
            })
            .returning();

          // Link photo to listing
          await db.insert(listingPhotos).values({
            listingId: newListing.id,
            photoId: photoRecord.id,
          });
        } catch (photoError) {
          console.error('Error uploading photo:', photoError);
          // Continue with other photos even if one fails
        }
      }
    }

    // Revalidate the listings page
    revalidatePath('/listings');

    return {
      success: true,
      listingId: newListing.id,
    };
  } catch (error) {
    console.error('Error creating listing:', error);

    if (error instanceof z.ZodError) {
      // Return first validation error message
      return {
        success: false,
        error: error.errors[0].message,
      };
    } else if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: false,
      error: 'Failed to create listing',
    };
  }
}

export async function getListingById(id: number): Promise<ListingWithPhotos | null> {
  try {
    // Get listing by id
    const [listing] = await db.select().from(listings).where(eq(listings.id, id));

    if (!listing) {
      return null;
    }

    // Get linked photos
    const photoData: string[] = [];
    try {
      const photoRecords = await db
        .select({ photoId: listingPhotos.photoId })
        .from(listingPhotos)
        .where(eq(listingPhotos.listingId, id));

      if (photoRecords.length > 0) {
        const photoIds = photoRecords.map(record => record.photoId);
        const photoResults = await db.select().from(photos).where(inArray(photos.id, photoIds));
        photoData.push(...photoResults.map(photo => photo.image));
      }
    } catch (photoError) {
      console.error(`Error fetching photos for listing ${id}, proceeding without them:`, photoError);
      // photoData will remain empty, allowing the function to return listing details
    }

    // Get category name if there\'s a categoryId
    let categoryName = null;
    if (listing.categoryId !== null) {
      const [catRow] = await db
        .select({ name: categories.name })
        .from(categories)
        .where(eq(categories.id, listing.categoryId))
        .limit(1);
      categoryName = catRow?.name ?? null;
    }

    // Fetch seller info using sellerId
    let seller: SellerInfo | undefined = undefined;
    if (listing.sellerId) {
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          profileImageId: users.profileImageId,
          bio: users.bio,
        })
        .from(users)
        .where(eq(users.id, listing.sellerId))
        .limit(1);

      if (user) {
        // Get profile image if exists
        let profileImage: string | null = null;
        if (user.profileImageId) {
          const [photoRecord] = await db
            .select()
            .from(photos)
            .where(eq(photos.id, user.profileImageId));

          if (photoRecord) {
            profileImage = photoRecord.image;
          }
        }

        // Get count of active listings for this seller
        const [activeCountResult] = await db
          .select({ count: count() })
          .from(listings)
          .where(and(eq(listings.sellerId, user.id), eq(listings.status, 'Active')));

        // Get count of archived listings for this seller
        const [archivedCountResult] = await db
          .select({ count: count() })
          .from(listings)
          .where(and(eq(listings.sellerId, user.id), eq(listings.status, 'Archived')));

        seller = {
          id: user.id,
          username: user.username,
          profileImage,
          bio: user.bio ?? null,
          activeListingsCount: Number(activeCountResult?.count) || 0,
          archivedListingsCount: Number(archivedCountResult?.count) || 0,
        };
      }
    }

    return {
      ...listing,
      categoryName,
      seller, // seller can be undefined
      photos: photoData,
    };
  } catch (error) {
    console.error('Error fetching listing by ID:', error); // More specific error message
    return null;
  }
}

export async function getListingStatusById(id: number): Promise<boolean> {
  try {
    const [orderItem] = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.listingId, id))
      .limit(1);
    return !!orderItem;
  } catch (error) {
    console.error('Error fetching listing status:', error);
    return false;
  }
}

export async function getAllListings(options?: {
  page?: number;
  pageSize?: number;
  sortBy?: 'price' | 'date';
  sortOrder?: 'asc' | 'desc';
  searchTerm?: string;
  categoryId?: number | null;
}): Promise<{ listings: ShortListing[]; totalCount: number }> {
  try {
    /* --------------------------- build WHERE clauses -------------------------- */
    const conditions: ReturnType<typeof sql>[] = [];

    // fuzzy search on title & longDescription
    if (options?.searchTerm) {
      conditions.push(
        sql`(
          ${getLevenshteinSql(listings.title, options.searchTerm, 3)}
          OR
          ${getLevenshteinSql(listings.longDescription, options.searchTerm, 5)}
        )`
      );
    }

    // exact category filter (cascade)
    if (options?.categoryId !== undefined && options.categoryId !== null) {
      const ids = await getDescendantCategoryIds(options.categoryId);
      conditions.push(inArray(listings.categoryId, ids));
    }

    conditions.push(not(eq(listings.status, 'Sold')));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    /* ------------------------------ total count ------------------------------ */
    const countQuery = db.select({ value: count() }).from(listings);

    if (whereClause) {
      countQuery.where(whereClause);
    }

    const [countResult] = await countQuery.execute();
    const totalCount = countResult?.value ?? 0;

    /* ---------------------------- main list query ---------------------------- */
    const query = db.select().from(listings);
    if (whereClause) {
      query.where(whereClause);
    }

    // sorting
    if (options?.sortBy) {
      const sortCol = options.sortBy === 'price' ? listings.price : listings.createdAt;
      query.orderBy(options.sortOrder === 'desc' ? desc(sortCol) : asc(sortCol));
    } else if (options?.searchTerm) {
      // rank by closest Levenshtein distance
      query.orderBy(
        asc(
          sql`LEAST(
            ${getLevenshteinSql(listings.title, options.searchTerm, 3)},
            ${getLevenshteinSql(listings.longDescription, options.searchTerm, 5)}
          )`
        )
      );
    }

    // pagination
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    query.limit(pageSize).offset((page - 1) * pageSize);

    const listingsData = await query.execute();

    /* ------------------------- enrich with photos & cats ---------------------- */
    const shortListings: ShortListing[] = [];

    for (const listing of listingsData) {
      // first photo thumbnail
      const [photoLink] = await db
        .select({ photoId: listingPhotos.photoId })
        .from(listingPhotos)
        .where(eq(listingPhotos.listingId, listing.id))
        .limit(1);

      let photo: string | null = null;
      if (photoLink) {
        const [photoRow] = await db
          .select()
          .from(photos)
          .where(eq(photos.id, photoLink.photoId))
          .limit(1);
        photo = photoRow?.image ?? null;
      }

      // category name
      let category: string | null = null;
      if (listing.categoryId !== null) {
        const [catRow] = await db
          .select({ name: categories.name })
          .from(categories)
          .where(eq(categories.id, listing.categoryId))
          .limit(1);
        category = catRow?.name ?? null;
      }

      shortListings.push({
        id: listing.id,
        title: listing.title,
        price: listing.price,
        category,
        categoryId: listing.categoryId ?? null,
        photo,
        createdAt: listing.createdAt,
        sellerId: listing.sellerId,
      });
    }

    return { listings: shortListings, totalCount };
  } catch (err) {
    console.error('Error fetching listings:', err);
    return { listings: [], totalCount: 0 };
  }
}

export async function deleteListing(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the listing to check the seller ID
    const [listing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    
    if (!listing) {
      return { success: false, error: 'Listing not found' };
    }
    
    // Check if user is suspended
    await checkUserSuspension(listing.sellerId);
    
    await db.delete(listings).where(eq(listings.id, id));
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting listing:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete listing' };
  }
}

export async function updateListing(
  id: number,
  formData: ListingFormData,
  photoData: string[] = []
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user is suspended
    await checkUserSuspension(formData.sellerId);
    
    // Validate form data
    const validatedData = listingSchema.parse(formData);

    // Prepare listing data for database
    const listingData: Partial<NewListing> = {
      title: validatedData.title,
      price: validatedData.price.toString(),
      description: validatedData.description ?? null,
      longDescription: validatedData.longDescription ?? null,
      categoryId: validatedData.categoryId ?? null,
      status: validatedData.status,
      updatedAt: new Date(),
    };

    // Update listing
    await db.update(listings).set(listingData).where(eq(listings.id, id));

    // If new photos are provided, replace all photos for this listing
    if (photoData.length > 0) {
      // Remove old photo links
      await db.delete(listingPhotos).where(eq(listingPhotos.listingId, id));
      // Insert new photos and link them
      for (const imageData of photoData) {
        try {
          photoSchema.parse({ image: imageData });
          const [photoRecord] = await db.insert(photos).values({ image: imageData }).returning();
          await db.insert(listingPhotos).values({ listingId: id, photoId: photoRecord.id });
        } catch (photoError) {
          console.error('Error uploading photo:', photoError);
        }
      }
    }

    revalidatePath('/');
    revalidatePath(`/listing/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating listing:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    } else if (error instanceof Error) {
      return { success: false, error: error.message}
    } 
    return { success: false, error: 'Failed to update listing' };
  }
}

export async function setListingStatus(
  id: number,
  status: ListingStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.update(listings).set({ status }).where(eq(listings.id, id));
    revalidatePath(`/listing/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating listing status:', error);
    return { success: false, error: 'Failed to update listing status' };
  }
}

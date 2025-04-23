'use server';

import { db } from '@/lib/db';
import { listings, NewListing, ListingStatus } from '@/lib/db/schema/listings';
import { categories } from '@/lib/db/schema/categories';
import { photos } from '@/lib/db/schema/photos';
import { listingPhotos } from '@/lib/db/schema/listing_photos';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, inArray, asc, desc } from 'drizzle-orm';

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
}

export interface ListingWithPhotos {
  id: number;
  title: string;
  price: string;
  description: string | null;
  longDescription: string | null;
  categoryId: number | null;
  status: ListingStatus;
  photos: string[]; // Base64 encoded images
}

export interface ShortListing {
  id: number;
  title: string;
  price: string;
  category: string | null;
  photo: string | null; // Single thumbnail photo Base64 encoded
  createdAt: Date;
}

export async function createListing(
  formData: ListingFormData,
  photoData: string[] = []
): Promise<{ success: boolean; listingId?: number; error?: string }> {
  try {
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
    const photoRecords = await db
      .select({ photoId: listingPhotos.photoId })
      .from(listingPhotos)
      .where(eq(listingPhotos.listingId, id));

    // Fetch actual photo data if there are linked photos
    const photoData: string[] = [];

    if (photoRecords.length > 0) {
      const photoIds = photoRecords.map(record => record.photoId);

      const photoResults = await db.select().from(photos).where(inArray(photos.id, photoIds));

      photoData.push(...photoResults.map(photo => photo.image));
    }

    return {
      ...listing,
      photos: photoData,
    };
  } catch (error) {
    console.error('Error fetching listing:', error);
    return null;
  }
}

export async function getAllListings(options?: {
  page?: number;
  pageSize?: number;
  sortBy?: 'price' | 'date';
  sortOrder?: 'asc' | 'desc';
  categoryId?: number | null;
}): Promise<{ listings: ShortListing[]; totalCount: number }> {
  try {
    // Build the where condition for category filter
    let whereCondition = undefined;
    if (options?.categoryId) {
      whereCondition = eq(listings.categoryId, options.categoryId);
    }

    // Get total count with filters applied
    const countQuery = db.select().from(listings);
    if (whereCondition) {
      countQuery.where(whereCondition);
    }
    const filteredListings = await countQuery;
    const totalCount = filteredListings.length;

    // Build the query for paginated results
    const query = db.select().from(listings);
    if (whereCondition) {
      query.where(whereCondition);
    }

    // Apply sorting
    if (options?.sortBy) {
      const sortColumn = options.sortBy === 'price' ? listings.price : listings.createdAt;
      const sortOrder = options.sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);
      query.orderBy(sortOrder);
    }

    // Apply pagination
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    query.limit(pageSize).offset(offset);

    const listingsData = await query;

    // Fetch the first linked photo for each listing
    const shortListings: ShortListing[] = [];

    for (const listing of listingsData) {
      const [photoRecord] = await db
        .select({ photoId: listingPhotos.photoId })
        .from(listingPhotos)
        .where(eq(listingPhotos.listingId, listing.id))
        .limit(1);

      let photo: string | null = null;

      if (photoRecord) {
        const [photoResult] = await db
          .select()
          .from(photos)
          .where(eq(photos.id, photoRecord.photoId))
          .limit(1);

        if (photoResult) {
          photo = photoResult.image;
        }
      }

      const categoryName = await db
        .select({ name: categories.name })
        .from(categories)
        .where(listing.categoryId !== null ? eq(categories.id, listing.categoryId) : undefined)
        .limit(1);

      const category = categoryName.length > 0 ? categoryName[0].name : null;

      shortListings.push({
        id: listing.id,
        title: listing.title,
        price: listing.price,
        category,
        photo,
        createdAt: listing.createdAt,
      });
    }

    return {
      listings: shortListings,
      totalCount,
    };
  } catch (error) {
    console.error('Error fetching all listings:', error);
    return {
      listings: [],
      totalCount: 0,
    };
  }
}

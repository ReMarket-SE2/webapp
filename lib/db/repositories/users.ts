import { db } from '../index';
import { users, type NewUser, type User } from '../schema/users';
import { photos, type Photo } from '../schema/photos';
import { eq } from 'drizzle-orm';

export const usersRepository = {
  // Get all users
  getAll: async (): Promise<User[]> => {
    return db.select().from(users);
  },

  // Get user by ID
  getById: async (id: number): Promise<User | undefined> => {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  },

  // Get user by username
  getByUsername: async (username: string): Promise<User | undefined> => {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  },

  // Get user by email
  getByEmail: async (email: string): Promise<User | undefined> => {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  },

  // Create a new user
  create: async (user: NewUser): Promise<User> => {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  },

  // Update a user
  update: async (id: number, user: Partial<NewUser>): Promise<User | undefined> => {
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  },

  // Delete a user
  delete: async (id: number): Promise<void> => {
    await db.delete(users).where(eq(users.id, id));
  },
  
  // Get user with profile image
  getWithProfileImage: async (id: number): Promise<{ user: User, profileImage?: Photo } | undefined> => {
    const user = await usersRepository.getById(id);
    if (!user) return undefined;
    
    if (!user.profileImageId) {
      return { user, profileImage: undefined };
    }
    
    const profileImage = await db.select().from(photos).where(eq(photos.id, user.profileImageId));
    return {
      user,
      profileImage: profileImage[0],
    };
  },
  
  // Set profile image for a user
  setProfileImage: async (userId: number, imageData: string): Promise<User | undefined> => {
    return await db.transaction(async (tx) => {
      // Create the new photo
      const [newPhoto] = await tx.insert(photos).values({ image: imageData }).returning();
      
      // Update the user with the new profile image ID
      const [updatedUser] = await tx.update(users)
        .set({ profileImageId: newPhoto.id })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser;
    });
  },
  
  // Update profile image for a user
  updateProfileImage: async (userId: number, imageData: string): Promise<User | undefined> => {
    const user = await usersRepository.getById(userId);
    if (!user) return undefined;
    
    return await db.transaction(async (tx) => {
      let photoId: number;
      
      if (user.profileImageId) {
        // Update existing photo
        const [updatedPhoto] = await tx.update(photos)
          .set({ image: imageData })
          .where(eq(photos.id, user.profileImageId))
          .returning();
        photoId = updatedPhoto.id;
      } else {
        // Create new photo
        const [newPhoto] = await tx.insert(photos).values({ image: imageData }).returning();
        photoId = newPhoto.id;
      }
      
      // Update user with photo ID
      const [updatedUser] = await tx.update(users)
        .set({ profileImageId: photoId })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser;
    });
  },
  
  // Remove profile image from a user
  removeProfileImage: async (userId: number): Promise<User | undefined> => {
    const user = await usersRepository.getById(userId);
    if (!user || !user.profileImageId) return user;
    
    return await db.transaction(async (tx) => {
      // Update user to remove profile image reference
      const [updatedUser] = await tx.update(users)
        .set({ profileImageId: null })
        .where(eq(users.id, userId))
        .returning();
      
      // Note: We're not deleting the photo here in case it's used elsewhere
      // If you want to delete it, uncomment the line below
      // await tx.delete(photos).where(eq(photos.id, user.profileImageId));
      
      return updatedUser;
    });
  },
  
  // Create a user with a profile image
  createWithProfileImage: async (userData: Omit<NewUser, 'profileImageId'>, imageData: string): Promise<{ user: User, profileImage: Photo }> => {
    return await db.transaction(async (tx) => {
      // Create the photo first
      const [newPhoto] = await tx.insert(photos).values({ image: imageData }).returning();
      
      // Create the user with the photo ID
      const [newUser] = await tx.insert(users).values({
        ...userData,
        profileImageId: newPhoto.id,
      }).returning();
      
      return {
        user: newUser,
        profileImage: newPhoto,
      };
    });
  },
}; 
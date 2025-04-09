'use server';

import { db } from '@/lib/db';
import { photos } from '@/lib/db/schema';
import { Photo, NewPhoto } from '@/lib/db/schema/photos';

/**
 * Inserts a new photo into the database
 * @param imageData Base64 encoded image data
 * @returns The newly created photo with its ID
 */
export async function insertPhoto(imageData: string): Promise<Photo> {
  const photoData: NewPhoto = {
    image: imageData,
  };

  const result = await db
    .insert(photos)
    .values(photoData)
    .returning();

  if (!result.length) {
    throw new Error('Failed to insert photo');
  }

  return result[0];
}

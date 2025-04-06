import { db } from '@/lib/db';
import { photos } from '@/lib/db/schema';
import { Photo, NewPhoto } from '@/lib/db/schema/photos';

export class PhotosActions {
  protected table = photos;

  /**
   * Insert a new photo into the database
   * @param imageData Base64 encoded image data
   * @returns The newly created photo with its ID
   */
  async insertPhoto(imageData: string): Promise<Photo> {
    const photoData: NewPhoto = {
      image: imageData
    };
    
    const result = await db
      .insert(this.table)
      .values(photoData)
      .returning();
    
    if (!result.length) {
      throw new Error('Failed to insert photo');
    }
    
    return result[0];
  }
}

export const photosActions = new PhotosActions();
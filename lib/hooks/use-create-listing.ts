'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ListingStatus } from '@/lib/db/schema/listings';
import { toast } from 'sonner';
import { createListing, ListingFormData } from '@/lib/listings/actions';
import { getCategories } from '@/lib/categories/actions';
import { Category } from '@/lib/db/schema/categories';
import { useSession } from 'next-auth/react';

export interface CreateListingForm {
  title: string;
  price: number;
  description: string;
  longDescription: string;
  categoryId: number | null;
  status: ListingStatus;
}

interface PhotoFile {
  id: string; // Client-side ID for tracking
  file: File | null;
  previewUrl: string;
}

interface UseCreateListingReturn {
  form: CreateListingForm;
  isSubmitting: boolean;
  photoFiles: PhotoFile[];
  categories: Category[];
  isLoadingCategories: boolean;
  updateForm: (updates: Partial<CreateListingForm>) => void;
  addPhoto: (file: File) => void;
  removePhoto: (id: string) => void;
  saveListing: () => Promise<number | null>;
  saveListingAsDraft: () => Promise<number | null>;
  publishListing: () => Promise<number | null>;
  reset: () => void;
  setForm: React.Dispatch<React.SetStateAction<CreateListingForm>>;
  setPhotoFiles: React.Dispatch<React.SetStateAction<PhotoFile[]>>;
}

const DEFAULT_FORM: CreateListingForm = {
  title: '',
  price: 0,
  description: '',
  longDescription: '',
  categoryId: null,
  status: 'Draft',
};

// Helper function to generate unique IDs
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export function useCreateListing(): UseCreateListingReturn {
  const { data: session } = useSession();
  const [form, setForm] = useState<CreateListingForm>(DEFAULT_FORM);
  const [photoFiles, setPhotoFiles] = useState<PhotoFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        toast.error('Failed to load categories');
        console.error('Error loading categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const updateForm = (updates: Partial<CreateListingForm>) => {
    // Validate longDescription length
    if (updates.longDescription !== undefined && updates.longDescription.length > 2000) {
      toast.error('Detailed description cannot exceed 2000 characters');
      return;
    }

    setForm(prev => ({ ...prev, ...updates }));
  };

  const addPhoto = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    // This check is no longer needed since we handle it in the PhotoUpload component
    // but we'll keep it as a safeguard
    if (photoFiles.length >= 10) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPhotoFiles(prev => [...prev, { id: generateId(), file, previewUrl }]);
  };

  const removePhoto = (id: string) => {
    setPhotoFiles(prev => {
      const updatedFiles = prev.filter(photo => photo.id !== id);
      // Revoke the object URL for the removed photo
      const removedPhoto = prev.find(photo => photo.id === id);
      if (removedPhoto?.previewUrl) {
        URL.revokeObjectURL(removedPhoto.previewUrl);
      }
      return updatedFiles;
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const saveListing = async (status: ListingStatus = form.status): Promise<number | null> => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return null;
    }

    if (form.price <= 0) {
      toast.error('Price must be greater than 0');
      return null;
    }

    if (!form.categoryId) {
      toast.error('Category is required');
      return null;
    }

    setIsSubmitting(true);

    try {
      // Convert all photos to base64
      const photoData: string[] = [];
      for (const photoFile of photoFiles) {
        try {
          const base64Image = await fileToBase64(photoFile.file as File);
          photoData.push(base64Image);
        } catch (error) {
          console.error('Failed to convert photo to base64:', error);
          // Continue with other photos
        }
      }

      const formData: ListingFormData = {
        title: form.title,
        price: form.price,
        description: form.description,
        longDescription: form.longDescription,
        categoryId: form.categoryId,
        status,
        sellerId: session?.user?.id ? parseInt(session.user.id) : 1,
      };

      // Call server action to create listing
      const result = await createListing(formData, photoData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to save listing');
      }

      toast.success('Listing saved successfully');
      router.refresh(); // Refresh the page to show updates
      return result.listingId || null;
    } catch (error) {
      console.error('Failed to save listing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save listing');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveListingAsDraft = async (): Promise<number | null> => {
    return saveListing('Draft');
  };

  const publishListing = async (): Promise<number | null> => {
    return saveListing('Active');
  };

  const reset = () => {
    setForm(DEFAULT_FORM);

    // Revoke all object URLs before clearing
    photoFiles.forEach(photo => {
      if (photo.previewUrl) {
        URL.revokeObjectURL(photo.previewUrl);
      }
    });

    setPhotoFiles([]);
  };

  return {
    form,
    isSubmitting,
    photoFiles,
    categories,
    isLoadingCategories,
    updateForm,
    addPhoto,
    removePhoto,
    saveListing,
    saveListingAsDraft,
    publishListing,
    reset,
    setForm,
    setPhotoFiles,
  };
}

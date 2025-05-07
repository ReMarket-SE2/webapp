"use client"

import { useCreateListing } from "@/lib/hooks/use-create-listing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { PhotoUpload } from "./photo-upload"
import { MarkdownEditor } from "./markdown-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ListingWithPhotos, ListingFormData } from '@/lib/listings/actions'
import React, { useEffect } from 'react'
import { useSession } from "next-auth/react"
interface CreateListingFormProps {
  mode?: 'create' | 'edit'
  initialData?: ListingWithPhotos | null
  onSubmit?: (formData: ListingFormData, photoData: string[]) => Promise<void>
}

export function CreateListingForm({ mode = 'create', initialData, onSubmit }: CreateListingFormProps) {
  const {
    form,
    isSubmitting,
    photoFiles,
    categories,
    isLoadingCategories,
    updateForm,
    addPhoto,
    removePhoto,
    saveListingAsDraft,
    publishListing,
    reset,
    setForm,
    setPhotoFiles
  } = useCreateListing()
  const { data: session } = useSession();

  const router = useRouter()

  // Prefill form state if editing
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setForm({
        title: initialData.title,
        price: parseFloat(initialData.price),
        description: initialData.description || '',
        longDescription: initialData.longDescription || '',
        categoryId: initialData.categoryId,
        status: initialData.status,
      })
      // Prefill photos as preview-only (cannot edit existing photos in this version)
      setPhotoFiles(
        (initialData.photos || []).map((img, idx) => ({
          id: `existing-${idx}`,
          file: null as File | null, // Not editable, just for preview
          previewUrl: img,
        }))
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialData])

  const handleAddPhotos = (files: FileList) => {
    // Add each file to the hook
    for (let i = 0; i < files.length; i++) {
      addPhoto(files[i])
    }
  }

  const handlePublish = async () => {
    if (mode === 'edit' && onSubmit) {
      // Only send new photos (File type)
      const newPhotoFiles = photoFiles.filter(p => p.file)
      const photoData: string[] = []
      for (const photoFile of newPhotoFiles) {
        try {
          const base64Image = await fileToBase64(photoFile.file!)
          photoData.push(base64Image)
        } catch {
          // skip
        }
      }
      await onSubmit({ ...form, sellerId: session?.user?.id ? parseInt(session.user.id) : 1 }, photoData)
      return
    }
    const listingId = await publishListing()
    if (listingId) {
      toast.success("Listing published successfully!")
      reset()
      router.push(`/listing/${listingId}`)
    }
  }

  const handleSaveDraft = async () => {
    if (mode === 'edit' && onSubmit) {
      const newPhotoFiles = photoFiles.filter(p => p.file)
      const photoData: string[] = []
      for (const photoFile of newPhotoFiles) {
        try {
          const base64Image = await fileToBase64(photoFile.file!)
          photoData.push(base64Image)
        } catch {
          // skip
        }
      }
      await onSubmit({ ...form, status: 'Draft', sellerId: session?.user?.id ? parseInt(session.user.id) : 1 }, photoData)
      return
    }
    const listingId = await saveListingAsDraft()
    if (listingId) {
      toast.success("Draft saved successfully!")
      reset()
      router.push(`/listing/${listingId}`)
    }
  }

  // Helper for base64 conversion
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  return (
    <div className="w-full h-full mx-auto flex flex-col">

      <h1 className="text-2xl font-bold mb-4">
        {mode === 'edit' ? 'Edit your listing' : 'Show off your stuff on the market'}
      </h1>

      <div className="mb-4 gap-6 flex flex-col flex-1">

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>

          <p className="text-xs text-muted-foreground">
            {form.title.length}/120 characters. Give your item a name that will help it sell.
          </p>

          <Input
            id="title"
            placeholder="What are you selling?"
            value={form.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateForm({ title: e.target.value })}
            disabled={isSubmitting}
            required
            maxLength={120}
          />
        </div>

        {/* Photo Upload */}
        <PhotoUpload
          photoFiles={photoFiles}
          onAddPhotos={handleAddPhotos}
          onRemovePhoto={removePhoto}
          isSubmitting={isSubmitting}
        />

        <div className="flex gap-4">
          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <p className="text-xs text-muted-foreground">
              Set a price for your item.
            </p>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.price === 0 ? "" : form.price}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateForm({ price: parseFloat(e.target.value) || 0 })}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Category Select */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <p className="text-xs text-muted-foreground">
              Choose a category for your item.
            </p>
            <Select
              value={form.categoryId?.toString() || ""}
              onValueChange={(value) => updateForm({ categoryId: parseInt(value) || null })}
              disabled={isSubmitting || isLoadingCategories}
            >
              <SelectTrigger id="category" className="w-[200px]">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Short Description */}
          <div className="space-y-2 flex-1">
            <Label htmlFor="description">Short Description</Label>
            <p className="text-xs text-muted-foreground">
              {form.description.length}/500 characters. Briefly describe your item.
            </p>
            <Input
              id="description"
              placeholder="Brief description of your item"
              value={form.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateForm({ description: e.target.value })}
              disabled={isSubmitting}
              maxLength={500}
            />
          </div>
        </div>

        {/* Long Description */}
        <div className="space-y-2 flex-1">
          <MarkdownEditor
            id="longDescription"
            label="Detailed Description"
            value={form.longDescription}
            onChange={(value) => updateForm({ longDescription: value })}
            placeholder="Describe your item in detail, including condition, features, dimensions, and any other relevant information that will help buyers make an informed decision"
            disabled={isSubmitting}
            maxLength={2000}
          />
        </div>

        <div className="flex justify-start gap-4 mt-2">
          <Button
            onClick={handlePublish}
            disabled={isSubmitting}
          >
            {isSubmitting ? (mode === 'edit' ? 'Saving...' : 'Publishing...') : (mode === 'edit' ? 'Save Changes' : 'Publish Listing')}
          </Button>

          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
          >
            Save as Draft
          </Button>
        </div>

      </div>
    </div>
  )
} 

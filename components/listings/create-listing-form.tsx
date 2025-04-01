"use client"

import { useCreateListing } from "@/lib/hooks/use-create-listing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { PhotoUpload } from "./photo-upload"
import { MarkdownEditor } from "./markdown-editor"

export function CreateListingForm() {
  const {
    form,
    isSubmitting,
    photoFiles,
    updateForm,
    addPhoto,
    removePhoto,
    saveListingAsDraft,
    publishListing,
    reset
  } = useCreateListing()

  const router = useRouter()

  const handleAddPhotos = (files: FileList) => {
    // Add each file to the hook
    for (let i = 0; i < files.length; i++) {
      addPhoto(files[i])
    }
  }

  const handlePublish = async () => {
    const listingId = await publishListing()
    if (listingId) {
      toast.success("Listing published successfully!")
      reset()
      router.push(`/listings/${listingId}`)
    }
  }

  const handleSaveDraft = async () => {
    const listingId = await saveListingAsDraft()
    if (listingId) {
      toast.success("Draft saved successfully!")
      reset()
      router.push(`/listings/${listingId}`)
    }
  }

  return (
    <div className="w-full h-full mx-auto flex flex-col">

      <h1 className="text-2xl font-bold mb-4">Show off your stuff on the market</h1>

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
            {isSubmitting ? "Publishing..." : "Publish Listing"}
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

"use client"

import { useCreateListing } from "@/lib/hooks/use-create-listing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
  const [imageUploadKey, setImageUploadKey] = useState(Date.now())

  const handleAddPhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Add each file to the hook
    for (let i = 0; i < files.length; i++) {
      addPhoto(files[i])
    }

    // Reset the input field to allow uploading the same file multiple times
    setImageUploadKey(Date.now())
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
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Listing</CardTitle>
        <CardDescription>Fill in the details to create your listing</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="What are you selling?"
            value={form.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateForm({ title: e.target.value })}
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price">Price ($)</Label>
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
        <div className="space-y-2">
          <Label htmlFor="description">Short Description</Label>
          <Input
            id="description"
            placeholder="Brief description of your item"
            value={form.description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateForm({ description: e.target.value })}
            disabled={isSubmitting}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {form.description.length}/500 characters
          </p>
        </div>

        {/* Long Description */}
        <div className="space-y-2">
          <Label htmlFor="longDescription">Detailed Description</Label>
          <Textarea
            id="longDescription"
            placeholder="Provide more details about your item..."
            value={form.longDescription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateForm({ longDescription: e.target.value })}
            disabled={isSubmitting}
            rows={5}
          />
        </div>

        {/* Photo Upload */}
        <div className="space-y-4">
          <Label>Photos</Label>

          <div className="flex flex-wrap gap-4">
            {photoFiles.map((photo) => (
              <div
                key={photo.id}
                className="relative w-24 h-24 rounded-md overflow-hidden border border-muted"
              >
                <Image
                  src={photo.previewUrl}
                  alt="Product preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-1 right-1 bg-black/70 rounded-full p-1 text-white"
                  disabled={isSubmitting}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            <label
              className={`
                w-24 h-24 flex items-center justify-center rounded-md border-2 
                border-dashed border-muted-foreground/25 cursor-pointer
                hover:border-muted-foreground/50 transition-colors
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span className="text-2xl text-muted-foreground">+</span>
              <input
                type="file"
                key={imageUploadKey}
                accept="image/*"
                className="hidden"
                multiple
                onChange={handleAddPhotos}
                disabled={isSubmitting}
              />
            </label>
          </div>

          <p className="text-xs text-muted-foreground">
            Upload up to 10 photos of your item. First photo will be the cover image.
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={isSubmitting}
        >
          Save as Draft
        </Button>

        <Button
          onClick={handlePublish}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Publishing..." : "Publish Listing"}
        </Button>
      </CardFooter>
    </Card>
  )
} 
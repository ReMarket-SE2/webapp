"use client"

import { Label } from "@/components/ui/label"
import Image from "next/image"
import { X } from "lucide-react"
import { useState } from "react"

interface PhotoFile {
  id: string
  previewUrl: string
}

interface PhotoUploadProps {
  photoFiles: PhotoFile[]
  onAddPhotos: (files: FileList) => void
  onRemovePhoto: (id: string) => void
  isSubmitting?: boolean
}

export function PhotoUpload({
  photoFiles,
  onAddPhotos,
  onRemovePhoto,
  isSubmitting = false
}: PhotoUploadProps) {
  const [imageUploadKey, setImageUploadKey] = useState(Date.now())

  const handleAddPhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Check if adding these files would exceed the 10 photo limit
    if (photoFiles.length + files.length > 10) {
      alert('You can only upload up to 10 photos')
      setImageUploadKey(Date.now()) // Reset the input
      return
    }

    onAddPhotos(files)
    setImageUploadKey(Date.now())
  }

  return (
    <div className="space-y-2">
      <Label>Photos</Label>

      <p className="text-xs text-muted-foreground">
        Upload up to 10 photos of your item. First photo will be the cover image.
      </p>

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
              onClick={() => onRemovePhoto(photo.id)}
              className="cursor-pointer absolute top-1 right-1 bg-black/70 rounded-full p-1 text-white"
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
    </div>
  )
} 
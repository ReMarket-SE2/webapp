"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ListingImagesGalleryProps {
  images: string[];
  title: string;
}

export default function ListingImagesGallery({ images, title }: ListingImagesGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);

  // Handle case with no images
  if (images.length === 0) {
    return (
      <div className="relative rounded-lg overflow-hidden aspect-[4/3] bg-muted flex items-center justify-center">
        <span className="text-muted-foreground">No images available</span>
      </div>
    );
  }

  const showNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const showPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden border">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full h-full"
        >
          <Image
            src={images[currentIndex]}
            alt={`${title} - Image ${currentIndex + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority={currentIndex === 0}
          />
          
          <Button
            size="icon"
            variant="outline"
            className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm z-10"
            onClick={() => setOpen(true)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </motion.div>

        {images.length > 1 && (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90 z-10"
              onClick={showPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90 z-10"
              onClick={showNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
          {images.map((image, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "relative h-16 w-16 rounded border flex-shrink-0 overflow-hidden transition-all",
                currentIndex === index && "ring-2 ring-primary ring-offset-2"
              )}
            >
              <Image
                src={image}
                alt={`${title} - Thumbnail ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </motion.button>
          ))}
        </div>
      )}

      {/* Fullscreen dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl w-[90vw] h-[90vh] p-0 overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={images[currentIndex]}
              alt={`${title} - Fullscreen ${currentIndex + 1}`}
              fill
              sizes="90vw"
              className="object-contain"
            />
            
            {images.length > 1 && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute left-2 z-10"
                  onClick={() => {
                    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 z-10"
                  onClick={() => {
                    setCurrentIndex((prev) => (prev + 1) % images.length);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
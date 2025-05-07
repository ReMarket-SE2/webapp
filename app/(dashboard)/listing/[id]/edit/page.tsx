"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getListingById, updateListing, ListingWithPhotos } from "@/lib/listings/actions";
import { CreateListingForm } from "@/components/listings/create-listing-form";
import { toast } from "sonner";
import { useState } from "react";

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const [initialData, setInitialData] = useState<ListingWithPhotos | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      const listing = await getListingById(id);
      if (!listing) {
        toast.error("Listing not found");
        router.replace("/listings");
        return;
      }
      setInitialData(listing);
      setLoading(false);
    }
    fetchData();
  }, [id, router]);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="container w-full p-4">
      <CreateListingForm
        mode="edit"
        initialData={initialData}
        onSubmit={async (formData, photoData) => {
          const res = await updateListing(id, formData, photoData);
          if (res.success) {
            toast.success("Listing updated successfully");
            router.push(`/listing/${id}`);
          } else {
            toast.error(res.error || "Failed to update listing");
          }
        }}
      />
    </div>
  );
} 

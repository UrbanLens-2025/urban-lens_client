"use client";
import LocationForm from "@/components/locations/LocationForm";
import { useLocationRequestById } from "@/hooks/locations/useLocationRequestById";
import { Loader2 } from "lucide-react";
import { use } from "react";

export default function EditLocationRequestPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = use(params);

  const { data, isLoading } = useLocationRequestById(requestId);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20">Location Request not found.</div>;
  }

  return (
    <LocationForm isEditMode={true} initialData={data} locationId={requestId} />
  );
}

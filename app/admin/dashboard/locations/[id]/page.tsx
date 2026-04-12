import { notFound } from "next/navigation";
import { locationsService } from "@/lib/locations-service";
import { LocationForm } from "@/components/admin/locations/location-form";

export default async function EditLocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const location = await locationsService.getLocationById(id);

  if (!location) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Location</h1>
        <p className="text-muted-foreground">
          Update metadata, images, and tips for {location.title?.en || location.slug}.
        </p>
      </div>

      <LocationForm initialData={location} />
    </div>
  );
}

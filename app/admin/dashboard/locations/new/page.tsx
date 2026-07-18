import { LocationForm } from "@/components/admin/locations/location-form";
export default function NewLocationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Location</h1>
        <p className="text-muted-foreground">
          Add a new photography location to your CMS.
        </p>
      </div>

      <LocationForm />
    </div>
  );
}

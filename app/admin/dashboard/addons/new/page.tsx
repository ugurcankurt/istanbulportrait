import { AddonForm } from "@/components/admin/addons/addon-form";

export default function NewAddonPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Add-on</h1>
        <p className="text-muted-foreground">
          Create a new add-on service that customers can purchase during booking.
        </p>
      </div>

      <AddonForm />
    </div>
  );
}

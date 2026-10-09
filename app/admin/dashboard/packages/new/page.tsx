import { PackageForm } from "@/components/admin/packages/package-form";
import { addonsService } from "@/lib/addons-service";

export default async function NewPackagePage() {
  const availableAddons = await addonsService.getAllAddonsAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Package</h1>
        <p className="text-muted-foreground">
          Add a new photography package to your CMS.
        </p>
      </div>

      <PackageForm availableAddons={availableAddons} />
    </div>
  );
}

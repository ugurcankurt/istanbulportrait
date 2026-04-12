import { PackageForm } from "@/components/admin/packages/package-form";

export default function NewPackagePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Package</h1>
        <p className="text-muted-foreground">
          Add a new photography package to your CMS.
        </p>
      </div>

      <PackageForm />
    </div>
  );
}

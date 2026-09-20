import { notFound } from "next/navigation";
import { PackageForm } from "@/components/admin/packages/package-form";
import { packagesService } from "@/lib/packages-service";
import { addonsService } from "@/lib/addons-service";

interface EditPackagePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPackagePage({
  params,
}: EditPackagePageProps) {
  const { id } = await params;

  const [pkg, availableAddons] = await Promise.all([
    packagesService.getPackageById(id),
    addonsService.getAllAddonsAdmin()
  ]);

  if (!pkg) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Package</h1>
        <p className="text-muted-foreground">
          Update the photography package settings and media.
        </p>
      </div>

      <PackageForm initialData={pkg} availableAddons={availableAddons} />
    </div>
  );
}

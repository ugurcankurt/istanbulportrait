"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { packagesService, type PackageDB } from "@/lib/packages-service";
import { deletePackageImage } from "@/lib/storage-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PackagesAdminPage() {
  const [packages, setPackages] = useState<PackageDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [packageToDelete, setPackageToDelete] = useState<PackageDB | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const data = await packagesService.getAllPackages();
      setPackages(data);
    } catch (error) {
      toast.error("Failed to fetch packages");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!packageToDelete) return;

    try {
      toast.loading("Deleting package...", { id: "delete-pkg" });

      // First, try to delete all associated images to save Storage space
      if (packageToDelete.cover_image) {
        await deletePackageImage(packageToDelete.cover_image);
      }
      
      if (packageToDelete.gallery_images && packageToDelete.gallery_images.length > 0) {
        // Delete all gallery images in parallel
        await Promise.all(packageToDelete.gallery_images.map(img => deletePackageImage(img)));
      }

      // Delete DB record
      const success = await packagesService.deletePackage(packageToDelete.id);
      
      if (success) {
        toast.success("Package deleted successfully", { id: "delete-pkg" });
        setPackages(packages.filter(p => p.id !== packageToDelete.id));
      } else {
        toast.error("Failed to delete package from database", { id: "delete-pkg" });
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during deletion", { id: "delete-pkg" });
    } finally {
      setPackageToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Packages</h1>
          <p className="text-muted-foreground">
            Manage your photography packages, pricing, and features.
          </p>
        </div>
        <Button asChild className="shrink-0 gap-2">
          <Link href="/admin/dashboard/packages/new">
            <Plus className="w-4 h-4" />
            Add Package
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>All Packages</CardTitle>
          <CardDescription>A list of all active and inactive packages in your system.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Title (EN)</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
                      Loading packages...
                    </div>
                  </TableCell>
                </TableRow>
              ) : packages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No packages found. Create your first one!
                  </TableCell>
                </TableRow>
              ) : (
                packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      {pkg.cover_image ? (
                        <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted">
                          <Image
                            src={pkg.cover_image}
                            alt={pkg.slug}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {pkg.title?.en || "No English Title"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {pkg.slug}
                    </TableCell>
                    <TableCell className="font-bold">
                      €{pkg.price}
                      {pkg.original_price && <span className="text-xs font-normal text-muted-foreground line-through ml-2">€{pkg.original_price}</span>}
                    </TableCell>
                    <TableCell>
                      {pkg.is_active ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="w-3 h-3" /> Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{pkg.sort_order}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link href={`/admin/dashboard/packages/${pkg.id}`}>
                            <Pencil className="w-4 h-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setPackageToDelete(pkg)}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!packageToDelete}
        onOpenChange={(open) => !open && setPackageToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the package{" "}
              <strong>{packageToDelete?.title?.en || packageToDelete?.slug}</strong> and remove all associated imagery from Supabase bucket storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete Package
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

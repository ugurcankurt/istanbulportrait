"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, MapPin as MapPinIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { locationsService, type LocationDB } from "@/lib/locations-service";
import { deleteLocationImage } from "@/lib/storage-utils";
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
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
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

export default function LocationsAdminPage() {
  const [locations, setLocations] = useState<LocationDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationToDelete, setLocationToDelete] = useState<LocationDB | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const data = await locationsService.getAllLocationsAdmin();
      setLocations(data);
    } catch (error) {
      toast.error("Failed to fetch locations");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!locationToDelete) return;

    try {
      toast.loading("Deleting location...", { id: "delete-loc" });

      if (locationToDelete.cover_image) {
        await deleteLocationImage(locationToDelete.cover_image);
      }

      if (locationToDelete.gallery_images && locationToDelete.gallery_images.length > 0) {
        await Promise.all(locationToDelete.gallery_images.map(img => deleteLocationImage(img)));
      }

      await locationsService.deleteLocation(locationToDelete.id);

      toast.success("Location deleted successfully", { id: "delete-loc" });
      setLocations(locations.filter(l => l.id !== locationToDelete.id));
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during deletion", { id: "delete-loc" });
    } finally {
      setLocationToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
          <p className="text-muted-foreground">
            Manage your photography locations and maps.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/dashboard/locations/new" />} className="shrink-0 gap-2">
          <Plus className="w-4 h-4" />
          Add Location
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>All Locations</CardTitle>
          <CardDescription>A list of all active and inactive locations in your system.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Title (EN)</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Tags</TableHead>
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
                      Loading locations...
                    </div>
                  </TableCell>
                </TableRow>
              ) : locations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-muted-foreground p-0">
                    <Empty className="py-6 border-0 w-full flex-col justify-center items-center shadow-none">
                      <EmptyMedia variant="icon"><MapPinIcon className="w-8 h-8 text-muted-foreground" /></EmptyMedia>
                      <EmptyTitle>No locations found</EmptyTitle>
                      <EmptyDescription>Create your first location to get started.</EmptyDescription>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                locations.map((loc) => (
                  <TableRow key={loc.id}>
                    <TableCell>
                      {loc.cover_image ? (
                        <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted">
                          <Image
                            src={loc.cover_image}
                            alt={loc.slug}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                          <MapPinIcon className="w-5 h-5" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {loc.title?.en || <span className="text-muted-foreground italic">Untitled</span>}
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-muted rounded text-xs">{loc.slug}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {loc.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {loc.is_active ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="w-3 h-3" /> Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{loc.sort_order}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button nativeButton={false} variant="outline" size="icon" render={<Link href={`/admin/dashboard/locations/${loc.id}`} />}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setLocationToDelete(loc)}
                        >
                          <Trash2 className="w-4 h-4" />
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

      <AlertDialog open={!!locationToDelete} onOpenChange={(open) => !open && setLocationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the location <strong>{locationToDelete?.title?.en || locationToDelete?.slug}</strong>.
              All associated images in Supabase Storage will also be completely deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Location
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

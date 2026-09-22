"use client";

import {
  CheckCircle2,
  Pencil,
  Plus,
  Puzzle,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type AddonDB, addonsService } from "@/lib/addons-service";

export default function AddonsAdminPage() {
  const [addons, setAddons] = useState<AddonDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addonToDelete, setAddonToDelete] = useState<AddonDB | null>(null);

  useEffect(() => {
    fetchAddons();
  }, []);

  const fetchAddons = async () => {
    setIsLoading(true);
    try {
      const data = await addonsService.getAllAddonsAdmin();
      setAddons(data);
    } catch (error) {
      toast.error("Failed to fetch addons");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!addonToDelete) return;

    try {
      toast.loading("Deleting addon...", { id: "delete-addon" });
      await addonsService.deleteAddon(addonToDelete.id);
      toast.success("Addon deleted successfully", { id: "delete-addon" });
      setAddons(addons.filter((a) => a.id !== addonToDelete.id));
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during deletion", { id: "delete-addon" });
    } finally {
      setAddonToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add-ons</h1>
          <p className="text-muted-foreground">
            Manage extra services that customers can add to their bookings.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/admin/dashboard/addons/new" />}
          className="shrink-0 gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Add-on
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>All Add-ons</CardTitle>
          <CardDescription>
            A list of all active and inactive add-ons in your system.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title (EN)</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Per Person?</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
                      Loading add-ons...
                    </div>
                  </TableCell>
                </TableRow>
              ) : addons.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-48 text-center text-muted-foreground p-0"
                  >
                    <Empty className="py-6 border-0 w-full flex-col justify-center items-center shadow-none">
                      <EmptyMedia variant="icon">
                        <Puzzle className="w-8 h-8 text-muted-foreground" />
                      </EmptyMedia>
                      <EmptyTitle>No add-ons found</EmptyTitle>
                      <EmptyDescription>
                        Create your first add-on to get started.
                      </EmptyDescription>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                addons.map((addon) => (
                  <TableRow key={addon.id}>
                    <TableCell className="font-medium">
                      {addon.title?.en || (
                        <span className="text-muted-foreground italic">
                          Untitled
                        </span>
                      )}
                    </TableCell>
                    <TableCell>€{addon.price}</TableCell>
                    <TableCell>{addon.is_per_person ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {addon.is_active ? (
                        <Badge
                          variant="default"
                          className="bg-green-500 hover:bg-green-600 gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="w-3 h-3" /> Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          nativeButton={false}
                          variant="outline"
                          size="icon"
                          render={
                            <Link
                              href={`/admin/dashboard/addons/${addon.id}`}
                            />
                          }
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setAddonToDelete(addon)}
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

      <AlertDialog
        open={!!addonToDelete}
        onOpenChange={(open) => !open && setAddonToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the add-on{" "}
              <strong>{addonToDelete?.title?.en || addonToDelete?.slug}</strong>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Add-on
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { ArrowLeft, Edit, Plus, Trash } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { generateSlug } from "@/lib/blog/blog-utils";
import { useBlogStore } from "@/stores/blog-store";
import type { BlogCategoryWithTranslation } from "@/types/blog";

function CategoryDialog({
  category,
  open,
  onOpenChange,
  onSave,
}: {
  category?: BlogCategoryWithTranslation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: unknown) => Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [icon, setIcon] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [translations, setTranslations] = useState({
    en: { name: "", description: "" },
    ar: { name: "", description: "" },
    ru: { name: "", description: "" },
    es: { name: "", description: "" },
    zh: { name: "", description: "" },
    fr: { name: "", description: "" },
    de: { name: "", description: "" },
    ro: { name: "", description: "" },
  });

  // Reset form when dialog closes or category changes
  useEffect(() => {
    if (open && category) {
      // Edit mode - fetch all translations from API
      const fetchAllTranslations = async () => {
        try {
          const response = await fetch(
            `/api/admin/blog-categories/${category.id}`,
          );
          const data = await response.json();

          if (data.success && data.category) {
            setSlug(data.category.slug);
            setColor(data.category.color);
            setIcon(data.category.icon || "");
            setSortOrder(data.category.sort_order);
            setTranslations({
              en: {
                name: data.category.translations?.en?.name || "",
                description: data.category.translations?.en?.description || "",
              },
              ar: {
                name: data.category.translations?.ar?.name || "",
                description: data.category.translations?.ar?.description || "",
              },
              ru: {
                name: data.category.translations?.ru?.name || "",
                description: data.category.translations?.ru?.description || "",
              },
              es: {
                name: data.category.translations?.es?.name || "",
                description: data.category.translations?.es?.description || "",
              },
              zh: {
                name: data.category.translations?.zh?.name || "",
                description: data.category.translations?.zh?.description || "",
              },
              fr: {
                name: data.category.translations?.fr?.name || "",
                description: data.category.translations?.fr?.description || "",
              },
              de: {
                name: data.category.translations?.de?.name || "",
                description: data.category.translations?.de?.description || "",
              },
              ro: {
                name: data.category.translations?.ro?.name || "",
                description: data.category.translations?.ro?.description || "",
              },
            });
          }
        } catch (error) {
          console.error("Error fetching category translations:", error);
          toast.error("Failed to load category translations");
        }
      };

      fetchAllTranslations();
    } else if (open && !category) {
      // Create mode - reset form
      setSlug("");
      setColor("#6366f1");
      setIcon("");
      setSortOrder(0);
      setTranslations({
        en: { name: "", description: "" },
        ar: { name: "", description: "" },
        ru: { name: "", description: "" },
        es: { name: "", description: "" },
        zh: { name: "", description: "" },
        fr: { name: "", description: "" },
        de: { name: "", description: "" },
        ro: { name: "", description: "" },
      });
    }
  }, [open, category]);

  const handleSave = async () => {
    if (!translations.en.name.trim()) {
      toast.error("English name is required");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        slug: slug || generateSlug(translations.en.name),
        color,
        icon: icon || null,
        sort_order: sortOrder,
        translations,
      });
      onOpenChange(false);
      toast.success(category ? "Category updated" : "Category created");
    } catch (_error) {
      toast.error("Failed to save category");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit Category" : "Create Category"}
          </DialogTitle>
          <DialogDescription>
            Manage category details in multiple languages
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Global Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="category-slug"
              />
            </div>
            <div>
              <Label htmlFor="color">Color (Hex)</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#6366f1"
                />
                <div
                  className="w-10 h-10 rounded border"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="icon">Icon (optional)</Label>
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="📷"
              />
            </div>
            <div>
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={sortOrder}
                onChange={(e) =>
                  setSortOrder(Number.parseInt(e.target.value, 10))
                }
              />
            </div>
          </div>

          {/* Multi-language Tabs */}
          <Tabs defaultValue="en">
            <TabsList className="flex w-full flex-wrap gap-1 h-auto p-1">
              <TabsTrigger value="en" className="flex-1 min-w-[60px]">🇬🇧 EN</TabsTrigger>
              <TabsTrigger value="ar" className="flex-1 min-w-[60px]">🇸🇦 AR</TabsTrigger>
              <TabsTrigger value="ru" className="flex-1 min-w-[60px]">🇷🇺 RU</TabsTrigger>
              <TabsTrigger value="es" className="flex-1 min-w-[60px]">🇪🇸 ES</TabsTrigger>
              <TabsTrigger value="zh" className="flex-1 min-w-[60px]">🇨🇳 ZH</TabsTrigger>
              <TabsTrigger value="fr" className="flex-1 min-w-[60px]">🇫🇷 FR</TabsTrigger>
              <TabsTrigger value="de" className="flex-1 min-w-[60px]">🇩🇪 DE</TabsTrigger>
              <TabsTrigger value="ro" className="flex-1 min-w-[60px]">🇷🇴 RO</TabsTrigger>
            </TabsList>

            {(["en", "ar", "ru", "es", "zh", "fr", "de", "ro"] as const).map((locale) => (
              <TabsContent key={locale} value={locale} className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={translations[locale].name}
                    onChange={(e) =>
                      setTranslations({
                        ...translations,
                        [locale]: {
                          ...translations[locale],
                          name: e.target.value,
                        },
                      })
                    }
                    placeholder="Category name"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={translations[locale].description}
                    onChange={(e) =>
                      setTranslations({
                        ...translations,
                        [locale]: {
                          ...translations[locale],
                          description: e.target.value,
                        },
                      })
                    }
                    placeholder="Category description (optional)"
                    rows={3}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CategoriesManagementPage() {
  const {
    categories,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useBlogStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    BlogCategoryWithTranslation | undefined
  >();

  useEffect(() => {
    fetchCategories("en");
  }, [fetchCategories]);

  const handleCreate = () => {
    setEditingCategory(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (category: BlogCategoryWithTranslation) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleSave = async (data: unknown) => {
    if (editingCategory) {
      // Update existing category
      await updateCategory(editingCategory.id, data);
    } else {
      // Create new category
      await createCategory(data);
    }
    await fetchCategories("en");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      const success = await deleteCategory(id);
      if (success) {
        toast.success("Category deleted successfully");
      } else {
        toast.error("Failed to delete category");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard/blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground">Manage blog post categories</p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Category
        </Button>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No categories found</p>
              <Button onClick={handleCreate}>Create First Category</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {category.icon && <span>{category.icon}</span>}
                        {category.translation.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.slug}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: `${category.color}20`,
                          color: category.color,
                        }}
                      >
                        {category.color}
                      </Badge>
                    </TableCell>
                    <TableCell>{category.sort_order}</TableCell>
                    <TableCell>{category.post_count || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <CategoryDialog
        category={editingCategory}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
      />
    </div>
  );
}

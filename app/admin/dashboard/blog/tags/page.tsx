"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash, X } from "lucide-react";
import Link from "next/link";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBlogStore } from "@/stores/blog-store";
import type { BlogTagWithTranslation } from "@/types/blog";
import { generateSlug } from "@/lib/blog/blog-utils";

function TagDialog({
  tag,
  open,
  onOpenChange,
  onSave,
}: {
  tag?: BlogTagWithTranslation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [slug, setSlug] = useState("");
  const [translations, setTranslations] = useState({
    en: { name: "" },
    ar: { name: "" },
    ru: { name: "" },
    es: { name: "" },
    zh: { name: "" },
  });

  // Reset form when dialog opens/closes or tag changes
  useEffect(() => {
    if (open && tag) {
      // Edit mode - fetch all translations from API
      const fetchAllTranslations = async () => {
        try {
          const response = await fetch(`/api/admin/blog-tags/${tag.id}`);
          const data = await response.json();

          if (data.success && data.tag) {
            setSlug(data.tag.slug);
            setTranslations({
              en: { name: data.tag.translations?.en?.name || "" },
              ar: { name: data.tag.translations?.ar?.name || "" },
              ru: { name: data.tag.translations?.ru?.name || "" },
              es: { name: data.tag.translations?.es?.name || "" },
              zh: { name: data.tag.translations?.zh?.name || "" },
            });
          }
        } catch (error) {
          console.error("Error fetching tag translations:", error);
          toast.error("Failed to load tag translations");
        }
      };

      fetchAllTranslations();
    } else if (open && !tag) {
      // Create mode - reset form
      setSlug("");
      setTranslations({
        en: { name: "" },
        ar: { name: "" },
        ru: { name: "" },
        es: { name: "" },
        zh: { name: "" },
      });
    }
  }, [open, tag]);

  const handleSave = async () => {
    if (!translations.en.name.trim()) {
      toast.error("English name is required");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        slug: slug || generateSlug(translations.en.name),
        translations,
      });
      onOpenChange(false);
      toast.success(tag ? "Tag updated" : "Tag created");
    } catch (error) {
      toast.error("Failed to save tag");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tag ? "Edit Tag" : "Create Tag"}</DialogTitle>
          <DialogDescription>
            Manage tag details in multiple languages
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Slug */}
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="tag-slug"
            />
          </div>

          {/* Multi-language Tabs */}
          <Tabs defaultValue="en">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1">
              <TabsTrigger value="en">🇬🇧 EN</TabsTrigger>
              <TabsTrigger value="ar">🇸🇦 AR</TabsTrigger>
              <TabsTrigger value="ru">🇷🇺 RU</TabsTrigger>
              <TabsTrigger value="es">🇪🇸 ES</TabsTrigger>
              <TabsTrigger value="zh">🇨🇳 ZH</TabsTrigger>
            </TabsList>

            {(["en", "ar", "ru", "es", "zh"] as const).map((locale) => (
              <TabsContent key={locale} value={locale} className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={translations[locale].name}
                    onChange={(e) =>
                      setTranslations({
                        ...translations,
                        [locale]: { name: e.target.value },
                      })
                    }
                    placeholder="Tag name"
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
            {isSaving ? "Saving..." : "Save Tag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TagsManagementPage() {
  const { tags, fetchTags, createTag, updateTag, deleteTag } = useBlogStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<
    BlogTagWithTranslation | undefined
  >();

  useEffect(() => {
    fetchTags("en");
  }, [fetchTags]);

  const handleCreate = () => {
    setEditingTag(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (tag: BlogTagWithTranslation) => {
    setEditingTag(tag);
    setDialogOpen(true);
  };

  const handleSave = async (data: any) => {
    if (editingTag) {
      // Update existing tag
      await updateTag(editingTag.id, data);
    } else {
      // Create new tag
      await createTag(data);
    }
    await fetchTags("en");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this tag?")) {
      const success = await deleteTag(id);
      if (success) {
        toast.success("Tag deleted successfully");
      } else {
        toast.error("Failed to delete tag");
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
            <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
            <p className="text-muted-foreground">Manage blog post tags</p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Tag
        </Button>
      </div>

      {/* Tags Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Tags</CardTitle>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No tags found</p>
              <Button onClick={handleCreate}>Create First Tag</Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-sm py-2 px-3 cursor-pointer hover:bg-secondary/80 flex items-center gap-2"
                >
                  <span onClick={() => handleEdit(tag)}>
                    #{tag.translation.name}
                  </span>
                  <span className="text-muted-foreground">
                    ({tag.post_count || 0})
                  </span>
                  <button
                    type="button"
                    className="ml-1 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(tag.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tag Dialog */}
      <TagDialog
        tag={editingTag}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
      />
    </div>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { calculateReadingTime, generateSlug } from "@/lib/blog/blog-utils";
import { blogFormSchema } from "@/lib/validations/blog-validations";
import { useBlogStore } from "@/stores/blog-store";
import type { BlogFormData, BlogPostWithRelations } from "@/types/blog";
import { MarkdownEditor } from "./markdown-editor";
import { ImageUpload } from "./image-upload";

interface BlogFormProps {
  initialData?: BlogPostWithRelations;
  onSubmit: (data: BlogFormData) => Promise<void>;
  isSubmitting: boolean;
}

const locales = [
  { value: "en", label: "English 🇬🇧" },
  { value: "ar", label: "العربية 🇸🇦" },
  { value: "ru", label: "Русский 🇷🇺" },
  { value: "es", label: "Español 🇪🇸" },
  { value: "zh", label: "简体中文 🇨🇳" },
  { value: "fr", label: "Français 🇫🇷" },
  { value: "de", label: "Deutsch 🇩🇪" },
  { value: "ro", label: "Română 🇷🇴" },
] as const;

export function BlogForm({
  initialData,
  onSubmit,
  isSubmitting,
}: BlogFormProps) {
  const { categories, tags, fetchCategories, fetchTags } = useBlogStore();
  const [activeTab, setActiveTab] = useState<"en" | "ar" | "ru" | "es" | "zh" | "fr" | "de" | "ro">(
    "en",
  );
  const [autoSlug, setAutoSlug] = useState(!initialData);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Fetch categories and tags
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        await Promise.all([fetchCategories("en"), fetchTags("en")]);
      } catch (error) {
        console.error("Error loading categories/tags:", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, [fetchCategories, fetchTags]);

  const form = useForm({
    resolver: zodResolver(blogFormSchema),
    defaultValues: initialData
      ? {
        slug: initialData.slug,
        status: initialData.status,
        featured_image: initialData.featured_image,
        published_at: initialData.published_at,
        meta_keywords: initialData.meta_keywords,
        is_featured: initialData.is_featured,
        translations: {
          en: {
            title: (initialData as any).translations?.en?.title || "",
            excerpt: (initialData as any).translations?.en?.excerpt || "",
            content: (initialData as any).translations?.en?.content || "",
            meta_description:
              (initialData as any).translations?.en?.meta_description || "",
          },
          ar: {
            title: (initialData as any).translations?.ar?.title || "",
            excerpt: (initialData as any).translations?.ar?.excerpt || "",
            content: (initialData as any).translations?.ar?.content || "",
            meta_description:
              (initialData as any).translations?.ar?.meta_description || "",
          },
          ru: {
            title: (initialData as any).translations?.ru?.title || "",
            excerpt: (initialData as any).translations?.ru?.excerpt || "",
            content: (initialData as any).translations?.ru?.content || "",
            meta_description:
              (initialData as any).translations?.ru?.meta_description || "",
          },
          es: {
            title: (initialData as any).translations?.es?.title || "",
            excerpt: (initialData as any).translations?.es?.excerpt || "",
            content: (initialData as any).translations?.es?.content || "",
            meta_description:
              (initialData as any).translations?.es?.meta_description || "",
          },
          zh: {
            title: (initialData as any).translations?.zh?.title || "",
            excerpt: (initialData as any).translations?.zh?.excerpt || "",
            content: (initialData as any).translations?.zh?.content || "",
            meta_description:
              (initialData as any).translations?.zh?.meta_description || "",
          },
          fr: {
            title: (initialData as any).translations?.fr?.title || "",
            excerpt: (initialData as any).translations?.fr?.excerpt || "",
            content: (initialData as any).translations?.fr?.content || "",
            meta_description:
              (initialData as any).translations?.fr?.meta_description || "",
          },
          de: {
            title: (initialData as any).translations?.de?.title || "",
            excerpt: (initialData as any).translations?.de?.excerpt || "",
            content: (initialData as any).translations?.de?.content || "",
            meta_description:
              (initialData as any).translations?.de?.meta_description || "",
          },
          ro: {
            title: (initialData as any).translations?.ro?.title || "",
            excerpt: (initialData as any).translations?.ro?.excerpt || "",
            content: (initialData as any).translations?.ro?.content || "",
            meta_description:
              (initialData as any).translations?.ro?.meta_description || "",
          },
        },
        category_ids:
          (initialData as any).categories?.map((c: any) => c.category.id) ||
          [],
        tag_ids: (initialData as any).tags?.map((t: any) => t.tag.id) || [],
      }
      : {
        slug: "",
        status: "draft",
        featured_image: null,
        published_at: null,
        meta_keywords: [],
        is_featured: false,
        translations: {
          en: { title: "", excerpt: "", content: "", meta_description: "" },
          ar: { title: "", excerpt: "", content: "", meta_description: "" },
          ru: { title: "", excerpt: "", content: "", meta_description: "" },
          es: { title: "", excerpt: "", content: "", meta_description: "" },
          zh: { title: "", excerpt: "", content: "", meta_description: "" },
          fr: { title: "", excerpt: "", content: "", meta_description: "" },
          de: { title: "", excerpt: "", content: "", meta_description: "" },
          ro: { title: "", excerpt: "", content: "", meta_description: "" },
        },
        category_ids: [],
        tag_ids: [],
      },
  });

  // Auto-generate slug from English title
  const enTitle = form.watch("translations.en.title");
  useEffect(() => {
    if (autoSlug && enTitle) {
      const slug = generateSlug(enTitle, { locale: "en" });
      form.setValue("slug", slug);
    }
  }, [enTitle, autoSlug, form]);

  // Calculate reading time from English content
  const enContent = form.watch("translations.en.content");
  const readingTime = enContent ? calculateReadingTime(enContent).minutes : 0;

  const handleSubmit = async (data: any) => {
    await onSubmit(data as BlogFormData);
  };

  const handlePublish = () => {
    form.setValue("status", "published");
    if (!form.getValues("published_at")) {
      form.setValue("published_at", new Date().toISOString());
    }
    form.handleSubmit(handleSubmit)();
  };

  const handleSaveDraft = () => {
    form.setValue("status", "draft");
    form.handleSubmit(handleSubmit)();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Global Fields Card */}
        <Card>
          <CardHeader>
            <CardTitle>Post Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Slug */}
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          {...field}
                          placeholder="post-url-slug"
                          disabled={autoSlug}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAutoSlug(!autoSlug)}
                        >
                          {autoSlug ? "Manual" : "Auto"}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      URL-friendly identifier (auto-generated from English
                      title)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Featured Image */}
              <FormField
                control={form.control}
                name="featured_image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Featured Image</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        onRemove={() => field.onChange(null)}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload the main image for this post. Auto-converted to WebP.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Published Date */}
              <FormField
                control={form.control}
                name="published_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publish Date</FormLabel>
                    <FormControl>
                      <Input
                        value={field.value ? field.value.slice(0, 16) : ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value ? new Date(value).toISOString() : null,
                          );
                        }}
                        type="datetime-local"
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty for auto (on publish)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Meta Keywords */}
            <FormField
              control={form.control}
              name="meta_keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Keywords</FormLabel>
                  <FormControl>
                    <Input
                      value={field.value?.join(", ") || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value.split(",").map((k) => k.trim()),
                        )
                      }
                      placeholder="photography, istanbul, portrait, tips"
                    />
                  </FormControl>
                  <FormDescription>
                    Comma-separated keywords for SEO
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Categories */}
            <FormField
              control={form.control}
              name="category_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categories</FormLabel>
                  {isLoadingData ? (
                    <div className="text-sm text-muted-foreground py-2">
                      Loading categories...
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2">
                      No categories available.{" "}
                      <a
                        href="/admin/dashboard/blog/categories"
                        target="_blank"
                        className="underline hover:text-foreground"
                        rel="noopener"
                      >
                        Create one
                      </a>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            checked={field.value?.includes(category.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([
                                  ...(field.value || []),
                                  category.id,
                                ]);
                              } else {
                                field.onChange(
                                  (field.value || []).filter(
                                    (id) => id !== category.id,
                                  ),
                                );
                              }
                            }}
                          />
                          <label className="text-sm cursor-pointer">
                            {category.translation?.name || category.slug}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tag_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  {isLoadingData ? (
                    <div className="text-sm text-muted-foreground py-2">
                      Loading tags...
                    </div>
                  ) : tags.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2">
                      No tags available.{" "}
                      <a
                        href="/admin/dashboard/blog/tags"
                        target="_blank"
                        className="underline hover:text-foreground"
                        rel="noopener"
                      >
                        Create one
                      </a>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            checked={field.value?.includes(tag.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([
                                  ...(field.value || []),
                                  tag.id,
                                ]);
                              } else {
                                field.onChange(
                                  (field.value || []).filter(
                                    (id) => id !== tag.id,
                                  ),
                                );
                              }
                            }}
                          />
                          <label className="text-sm cursor-pointer">
                            {tag.translation?.name || tag.slug}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Featured Checkbox */}
            <FormField
              control={form.control}
              name="is_featured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Featured Post</FormLabel>
                    <FormDescription>
                      Display this post prominently on the blog homepage
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Multi-language Content Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Content (Multi-language)</span>
              <span className="text-sm font-normal text-muted-foreground">
                Reading time: ~{readingTime} min
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            >
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1">
                {locales.map((locale) => {
                  const hasContent = form.watch(
                    `translations.${locale.value}.title`,
                  );
                  return (
                    <TabsTrigger
                      key={locale.value}
                      value={locale.value}
                      className="relative"
                    >
                      <span className="hidden sm:inline">{locale.label}</span>
                      <span className="sm:hidden text-lg">
                        {locale.label.match(/[\u{1F1E0}-\u{1F1FF}]{2}/u)?.[0]}
                      </span>
                      {hasContent && (
                        <span className="ml-1 text-green-500 text-xs">✓</span>
                      )}
                      {!hasContent && locale.value !== "en" && (
                        <span className="ml-1 text-yellow-500 text-xs opacity-50">
                          ⚠
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {locales.map((locale) => (
                <TabsContent
                  key={locale.value}
                  value={locale.value}
                  className="space-y-4 mt-4"
                  dir={locale.value === "ar" ? "rtl" : "ltr"}
                >
                  {/* Title */}
                  <FormField
                    control={form.control}
                    name={`translations.${locale.value}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title ({locale.label})</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Post title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Excerpt */}
                  <FormField
                    control={form.control}
                    name={`translations.${locale.value}.excerpt`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Excerpt ({locale.label})</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Short summary (optional)"
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Brief summary displayed in post listings
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Content (Markdown) */}
                  <FormField
                    control={form.control}
                    name={`translations.${locale.value}.content`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content ({locale.label})</FormLabel>
                        <FormControl>
                          <MarkdownEditor
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Write your blog post content in Markdown..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Meta Description */}
                  <FormField
                    control={form.control}
                    name={`translations.${locale.value}.meta_description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Description ({locale.label})</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="SEO meta description (optional, max 160 chars)"
                            rows={2}
                            maxLength={160}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/160 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-2 sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg border">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button type="button" onClick={handlePublish} disabled={isSubmitting}>
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

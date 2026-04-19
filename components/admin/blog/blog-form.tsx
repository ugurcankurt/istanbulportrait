"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
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
import { ImageUpload } from "./image-upload";
import { MarkdownEditor } from "./markdown-editor";

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
  { value: "tr", label: "Türkçe 🇹🇷" },
] as const;

export function BlogForm({
  initialData,
  onSubmit,
  isSubmitting,
}: BlogFormProps) {
  const { categories, tags, fetchCategories, fetchTags } = useBlogStore();
  const [activeTab, setActiveTab] = useState<
    "en" | "ar" | "ru" | "es" | "zh" | "fr" | "de" | "ro" | "tr"
  >("en");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);

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
        status: initialData.status,
        featured_image: initialData.featured_image,
        published_at: initialData.published_at,
        is_featured: initialData.is_featured,
        translations: {
          en: {
            slug: (initialData as any).translations?.en?.slug || "",
            title: (initialData as any).translations?.en?.title || "",
            excerpt: (initialData as any).translations?.en?.excerpt || "",
            content: (initialData as any).translations?.en?.content || "",
          },
          ar: {
            slug: (initialData as any).translations?.ar?.slug || "",
            title: (initialData as any).translations?.ar?.title || "",
            excerpt: (initialData as any).translations?.ar?.excerpt || "",
            content: (initialData as any).translations?.ar?.content || "",
          },
          ru: {
            slug: (initialData as any).translations?.ru?.slug || "",
            title: (initialData as any).translations?.ru?.title || "",
            excerpt: (initialData as any).translations?.ru?.excerpt || "",
            content: (initialData as any).translations?.ru?.content || "",
          },
          es: {
            slug: (initialData as any).translations?.es?.slug || "",
            title: (initialData as any).translations?.es?.title || "",
            excerpt: (initialData as any).translations?.es?.excerpt || "",
            content: (initialData as any).translations?.es?.content || "",
          },
          zh: {
            slug: (initialData as any).translations?.zh?.slug || "",
            title: (initialData as any).translations?.zh?.title || "",
            excerpt: (initialData as any).translations?.zh?.excerpt || "",
            content: (initialData as any).translations?.zh?.content || "",
          },
          fr: {
            slug: (initialData as any).translations?.fr?.slug || "",
            title: (initialData as any).translations?.fr?.title || "",
            excerpt: (initialData as any).translations?.fr?.excerpt || "",
            content: (initialData as any).translations?.fr?.content || "",
          },
          de: {
            slug: (initialData as any).translations?.de?.slug || "",
            title: (initialData as any).translations?.de?.title || "",
            excerpt: (initialData as any).translations?.de?.excerpt || "",
            content: (initialData as any).translations?.de?.content || "",
          },
          ro: {
            slug: (initialData as any).translations?.ro?.slug || "",
            title: (initialData as any).translations?.ro?.title || "",
            excerpt: (initialData as any).translations?.ro?.excerpt || "",
            content: (initialData as any).translations?.ro?.content || "",
          },
          tr: {
            slug: (initialData as any).translations?.tr?.slug || "",
            title: (initialData as any).translations?.tr?.title || "",
            excerpt: (initialData as any).translations?.tr?.excerpt || "",
            content: (initialData as any).translations?.tr?.content || "",
          },
        },
        category_ids:
          (initialData as any).categories?.map((c: any) => c.category.id) ||
          [],
        tag_ids: (initialData as any).tags?.map((t: any) => t.tag.id) || [],
      }
      : {
        status: "draft",
        featured_image: null,
        published_at: null,
        is_featured: false,
        translations: {
          en: { slug: "", title: "", excerpt: "", content: "" },
          ar: { slug: "", title: "", excerpt: "", content: "" },
          ru: { slug: "", title: "", excerpt: "", content: "" },
          es: { slug: "", title: "", excerpt: "", content: "" },
          zh: { slug: "", title: "", excerpt: "", content: "" },
          fr: { slug: "", title: "", excerpt: "", content: "" },
          de: { slug: "", title: "", excerpt: "", content: "" },
          ro: { slug: "", title: "", excerpt: "", content: "" },
          tr: { slug: "", title: "", excerpt: "", content: "" },
        },
        category_ids: [],
        tag_ids: [],
      },
  });

  const handleAITranslate = async () => {
    const enState = form.getValues("translations.en");
    if (!enState?.title?.trim() || !enState?.content?.trim()) {
      toast.error("Please fill in the English Title and Content first to provide source context for AI.");
      return;
    }

    setIsTranslating(true);
    toast.loading("AI is translating your blog post (this may take up to 20 seconds)...", { id: "ai-translation" });
    try {
      const translateRes = await fetch("/api/admin/translate-blog-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: enState?.title || "",
          excerpt: enState?.excerpt || "",
          content: enState?.content || "",
        }),
      });

      if (translateRes.ok) {
        const translateData = await translateRes.json();
        if (translateData.translations) {
          const currentTranslations = form.getValues("translations");
          const targetLocales = ["ar", "ru", "es", "zh", "de", "fr", "ro", "tr"];

          targetLocales.forEach((loc) => {
            const aiTrans = translateData.translations[loc];
            if (aiTrans) {
              const currentLangState = currentTranslations[loc as keyof typeof currentTranslations] || {};
              form.setValue(`translations.${loc}` as any, {
                ...currentLangState,
                title: aiTrans.title || "",
                excerpt: aiTrans.excerpt || "",
                content: aiTrans.content || "",
                // We generate the slug dynamically from the translated title to ensure it's URL safe and locally correct
                slug: aiTrans.title ? generateSlug(aiTrans.title, { locale: loc as any }) : (currentLangState as any).slug || "",
              });
            }
          });

          toast.success("Blog post successfully translated to all languages!", { id: "ai-translation" });
        }
      } else {
        toast.error("AI translation failed. Please try again.", { id: "ai-translation" });
      }
    } catch (e) {
      toast.error("AI translation failed due to a network error.", { id: "ai-translation" });
    } finally {
      setIsTranslating(false);
    }
  };



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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Main Content Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Multi-language Content Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className="text-lg">Content (Multi-language)</CardTitle>
                  <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded-md border">
                    ~{readingTime} min read
                  </span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAITranslate}
                  disabled={isTranslating}
                  className="w-fit shrink-0"
                >
                  {isTranslating ? <Spinner className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />}
                  Auto-Translate (AI)
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as typeof activeTab)}
              >
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-1 h-auto mb-6">
                  {locales.map((locale) => {
                    const hasContent = form.watch(
                      `translations.${locale.value}.title`,
                    );
                    return (
                      <TabsTrigger
                        key={locale.value}
                        value={locale.value}
                        className="relative py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        <span className="hidden sm:inline">{locale.label}</span>
                        <span className="sm:hidden text-lg">
                          {locale.label.match(/[\u{1F1E0}-\u{1F1FF}]{2}/u)?.[0]}
                        </span>
                        {hasContent && (
                          <span className="ml-1 text-green-500 text-xs font-bold">✓</span>
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
                    className="space-y-6 mt-0"
                    dir={locale.value === "ar" ? "rtl" : "ltr"}
                  >
                    {/* Title */}
                    <FormField
                      control={form.control}
                      name={`translations.${locale.value}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Title ({locale.label})</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter a captivating post title..."
                              className="text-lg py-6 font-medium"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Slug */}
                    <FormField
                      control={form.control}
                      name={`translations.${locale.value}.slug`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug ({locale.label})</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input {...field} placeholder="url-friendly-identifier" className="font-mono text-sm bg-muted/50" />
                            </FormControl>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                const currentTitle = form.getValues(`translations.${locale.value}.title` as any);
                                if (currentTitle) {
                                  form.setValue(
                                    `translations.${locale.value}.slug` as any,
                                    generateSlug(currentTitle, { locale: locale.value as any })
                                  );
                                }
                              }}
                            >
                              Generate
                            </Button>
                          </div>
                          <FormDescription className="text-xs">
                            Automatically created from title. Used in URL: /blog/slug
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
                          <FormLabel className="flex justify-between items-end">
                            <span className="text-base font-medium">Content ({locale.label})</span>
                          </FormLabel>
                          <FormControl>
                            <div className="min-h-[400px] border rounded-md shadow-sm bg-background">
                              <MarkdownEditor
                                value={field.value || ""}
                                onChange={field.onChange}
                                placeholder="Write your blog post content in Markdown here..."
                              />
                            </div>
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
                              placeholder="Write a short, engaging summary of the post..."
                              rows={3}
                              className="resize-none"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Brief summary displayed in post listings and preview cards.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Meta Description Removed */}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Space */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Action & Publish Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="text-lg">Publish</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">

              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="w-full font-medium h-11"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  className="w-full font-medium bg-blue-600 hover:bg-blue-700 text-white h-11"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Publishing..." : "Publish Now"}
                </Button>
              </div>

              <div className="space-y-4 pt-4 border-t">
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
                      <FormDescription className="text-xs">
                        Leave empty for auto (on publish)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Featured Checkbox */}
                <FormField
                  control={form.control}
                  name="is_featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/10 mt-2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Featured Post</FormLabel>
                        <FormDescription className="text-xs">
                          Pin this post to the top
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="h-5 w-5"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Media Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="text-lg">Media</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
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
                    <FormDescription className="text-xs">
                      Primary image for this post. Auto-converted to WebP. Recommended size: 1200x630.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Organization Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="text-lg">Organization</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">

              {/* Categories */}
              <FormField
                control={form.control}
                name="category_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex justify-between items-end">
                      <span>Categories</span>
                      {categories.length === 0 && (
                        <a
                          href="/admin/dashboard/blog/categories"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Create New
                        </a>
                      )}
                    </FormLabel>
                    <div className="p-3 border rounded-md max-h-48 overflow-y-auto bg-muted/10 flex flex-col gap-2">
                      {isLoadingData ? (
                        <div className="text-sm text-muted-foreground py-2 text-center animate-pulse">
                          Loading categories...
                        </div>
                      ) : categories.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-2 text-center">
                          No categories available.
                        </div>
                      ) : (
                        categories.map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`category-${category.id}`}
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
                            <label htmlFor={`category-${category.id}`} className="text-sm cursor-pointer hover:font-medium transition-all">
                              {category.translation?.name || category.slug}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
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
                    <FormLabel className="flex justify-between items-end">
                      <span>Tags</span>
                      {tags.length === 0 && (
                        <a
                          href="/admin/dashboard/blog/tags"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Create New
                        </a>
                      )}
                    </FormLabel>
                    <div className="p-3 border rounded-md max-h-48 overflow-y-auto bg-muted/10">
                      {isLoadingData ? (
                        <div className="text-sm text-muted-foreground py-2 text-center animate-pulse">
                          Loading tags...
                        </div>
                      ) : tags.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-2 text-center">
                          No tags available.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <div
                              key={tag.id}
                              className="flex items-center space-x-1.5 bg-background border px-2 py-1 rounded text-xs hover:border-primary/50 transition-colors"
                            >
                              <Checkbox
                                id={`tag-${tag.id}`}
                                className="h-3 w-3"
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
                              <label htmlFor={`tag-${tag.id}`} className="cursor-pointer">
                                {tag.translation?.name || tag.slug}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Meta Keywords Removed */}

            </CardContent>
          </Card>

        </div>
      </form>
    </Form>
  );
}

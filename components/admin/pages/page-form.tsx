"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {  Sparkles, Trash2, UploadCloud, Plus } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { pagesContentService, type PageDB } from "@/lib/pages-content-service";
import { uploadPackageImage, deletePackageImage } from "@/lib/storage-utils";

interface PageFormProps {
  initialData?: PageDB;
}

const SUPPORTED_LOCALES = ["en", "ar", "ru", "es", "zh", "de", "fr", "ro", "tr"];

export function PageForm({ initialData }: PageFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(initialData?.cover_image || null);

  const form = useForm<any>({
    defaultValues: {
      slug: initialData?.slug || "",
      is_active: initialData?.is_active ?? true,
      title: initialData?.title || { en: "" },
      subtitle: initialData?.subtitle || { en: "" },
      cover_image: initialData?.cover_image || null,
      content: initialData?.content || { faqs: [], sections: [], about: { stats: [], highlights: [] } },
    },
  });

  const { fields: faqFields, append: appendFaq, remove: removeFaq } = useFieldArray({
    control: form.control,
    name: "content.faqs",
  });

  const { fields: sectionFields, append: appendSection, remove: removeSection } = useFieldArray({
    control: form.control,
    name: "content.sections",
  });

  const { fields: aboutStatsFields, append: appendAboutStat, remove: removeAboutStat } = useFieldArray({
    control: form.control,
    name: "content.about.stats",
  });

  const { fields: aboutHighlightsFields, append: appendAboutHighlight, remove: removeAboutHighlight } = useFieldArray({
    control: form.control,
    name: "content.about.highlights",
  });

  const handleAITranslate = async () => {
    const data = form.getValues();
    if (!data.title?.en || !data.subtitle?.en) {
      toast.error("Please fill in the English Title and Subtitle first before auto-translating.");
      return;
    }

    toast.loading("Translating to all languages...", { id: "ai-translation" });
    try {
      const translateRes = await fetch("/api/admin/translate-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title.en,
          subtitle: data.subtitle.en,
          content: {
            faqs: data.content?.faqs?.map((f: any) => ({
              question: f.question?.en || "",
              answer: f.answer?.en || ""
            })) || [],
            sections: data.content?.sections?.map((s: any) => ({
              title: s.title?.en || "",
              description: s.description?.en || "",
              items: s.items?.en || ""
            })) || [],
            about: data.content?.about ? {
              description: data.content.about.description?.en || "",
              stats: data.content.about.stats?.map((s: any) => ({
                number: s.number || "",
                label: s.label?.en || ""
              })) || [],
              highlights: data.content.about.highlights?.map((h: any) => ({
                title: h.title?.en || "",
                description: h.description?.en || ""
              })) || []
            } : undefined
          }
        }),
      });

      if (translateRes.ok) {
        const translateData = await translateRes.json();
        if (translateData.translations) {
          SUPPORTED_LOCALES.forEach(loc => {
            if (loc === "en") return;
            if (translateData.translations[loc]) {
              form.setValue(`title.${loc}`, translateData.translations[loc].title, { shouldDirty: true });
              form.setValue(`subtitle.${loc}`, translateData.translations[loc].subtitle, { shouldDirty: true });

              if (translateData.translations[loc].content?.faqs) {
                const aiFaqs = translateData.translations[loc].content.faqs;
                data.content?.faqs?.forEach((_: any, index: number) => {
                  if (aiFaqs[index]) {
                    form.setValue(`content.faqs.${index}.question.${loc}`, aiFaqs[index].question, { shouldDirty: true });
                    form.setValue(`content.faqs.${index}.answer.${loc}`, aiFaqs[index].answer, { shouldDirty: true });
                  }
                });
              }

              if (translateData.translations[loc].content?.sections) {
                const aiSections = translateData.translations[loc].content.sections;
                data.content?.sections?.forEach((_: any, index: number) => {
                  if (aiSections[index]) {
                    form.setValue(`content.sections.${index}.title.${loc}`, aiSections[index].title, { shouldDirty: true });
                    form.setValue(`content.sections.${index}.description.${loc}`, aiSections[index].description, { shouldDirty: true });
                    form.setValue(`content.sections.${index}.items.${loc}`, aiSections[index].items, { shouldDirty: true });
                  }
                });
              }

              if (translateData.translations[loc].content?.about) {
                const aiAbout = translateData.translations[loc].content.about;
                if (aiAbout.description) form.setValue(`content.about.description.${loc}`, aiAbout.description, { shouldDirty: true });
                
                data.content?.about?.stats?.forEach((_: any, index: number) => {
                  if (aiAbout.stats?.[index]) {
                    form.setValue(`content.about.stats.${index}.label.${loc}`, aiAbout.stats[index].label, { shouldDirty: true });
                  }
                });

                data.content?.about?.highlights?.forEach((_: any, index: number) => {
                  if (aiAbout.highlights?.[index]) {
                    form.setValue(`content.about.highlights.${index}.title.${loc}`, aiAbout.highlights[index].title, { shouldDirty: true });
                    form.setValue(`content.about.highlights.${index}.description.${loc}`, aiAbout.highlights[index].description, { shouldDirty: true });
                  }
                });
              }
            }
          });
          toast.success("Blank languages successfully auto-filled!", { id: "ai-translation" });
        }
      } else {
        toast.error("AI translation failed. Check API key.", { id: "ai-translation" });
      }
    } catch (err) {
      toast.error("AI translation API error.", { id: "ai-translation" });
    }
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        slug: data.slug,
        is_active: data.is_active,
        title: data.title,
        subtitle: data.subtitle,
        cover_image: data.cover_image,
        content: data.content,
      };

      if (initialData?.id) {
        await pagesContentService.updatePage(initialData.id, payload);
        toast.success("Page updated successfully!");
      } else {
        await pagesContentService.createPage(payload);
        toast.success("Page created successfully!");
      }

      router.push("/admin/dashboard/pages");
      router.refresh();

    } catch (error: any) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Page Global Settings</CardTitle>
                <CardDescription>Configure the slug used to identify this page in the codebase.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. about, privacy, contact" {...field} disabled={!!initialData} />
                      </FormControl>
                      <FormDescription>
                        Internal identifier matching the route (e.g., use "about" for /about). Cannot be changed later.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Localized Content Tabs */}
                <div className="pt-4 border-t mt-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <div>
                      <Label className="block text-lg font-semibold">Localized Content</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Manage hero titles and subtitles for each language.
                      </p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleAITranslate}
                      className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Auto-Translate All with AI
                    </Button>
                  </div>
                  
                  <Tabs defaultValue="en" className="w-full">
                    <TabsList className="w-full flex flex-wrap h-auto">
                      {SUPPORTED_LOCALES.map(loc => (
                        <TabsTrigger key={loc} value={loc} className="uppercase">{loc}</TabsTrigger>
                      ))}
                    </TabsList>
                    {SUPPORTED_LOCALES.map(loc => (
                      <TabsContent key={loc} value={loc} className="space-y-6 pt-4">
                        <FormField
                          control={form.control}
                          name={`title.${loc}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Page Title / Hero Heading ({loc.toUpperCase()})</FormLabel>
                              <FormControl>
                                <Input placeholder={`Title in ${loc}`} {...field} value={field.value || ''} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`subtitle.${loc}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subtitle / Description ({loc.toUpperCase()})</FormLabel>
                              <FormControl>
                                <Input placeholder={`Subtitle in ${loc}`} {...field} value={field.value || ''} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {/* FAQs Section injected dynamic for home-faq */}
                        {form.watch("slug") === "home-faq" && (
                          <div className="pt-6 border-t mt-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-lg font-semibold">Frequently Asked Questions ({loc.toUpperCase()})</Label>
                            </div>
                            
                            {faqFields.map((field, index) => (
                              <div key={field.id} className="p-4 border rounded-md relative bg-muted/20">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => removeFaq(index)}
                                  title="Delete FAQ"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                
                                <div className="space-y-4 max-w-[95%]">
                                  <FormField
                                    control={form.control}
                                    name={`content.faqs.${index}.question.${loc}`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Question {index + 1}</FormLabel>
                                        <FormControl>
                                          <Input placeholder={`Enter question in ${loc}`} {...field} value={field.value || ''} />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`content.faqs.${index}.answer.${loc}`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Answer {index + 1}</FormLabel>
                                        <FormControl>
                                          <textarea 
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder={`Enter answer in ${loc}`}
                                            {...field}
                                            value={field.value || ''}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>
                            ))}
                            
                            {loc === "en" && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => appendFaq({ question: { en: "" }, answer: { en: "" } })}
                                className="w-full mt-2"
                              >
                                <Plus className="w-4 h-4 mr-2" /> Add FAQ
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Legal Sections Section injected dynamically for privacy/terms */}
                        {(form.watch("slug") === "privacy" || form.watch("slug") === "terms") && (
                          <div className="pt-6 border-t mt-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-lg font-semibold">Content Sections ({loc.toUpperCase()})</Label>
                            </div>
                            
                            {sectionFields.map((field, index) => (
                              <div key={field.id} className="p-4 border rounded-md relative bg-muted/20">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => removeSection(index)}
                                  title="Delete Section"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                
                                <div className="space-y-4 max-w-[95%]">
                                  <FormField
                                    control={form.control}
                                    name={`content.sections.${index}.title.${loc}`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Section Title {index + 1}</FormLabel>
                                        <FormControl>
                                          <Input placeholder={`Enter section title in ${loc}`} {...field} value={field.value || ''} />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`content.sections.${index}.description.${loc}`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                          <textarea 
                                            className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder={`Enter paragraph description in ${loc}`}
                                            {...field}
                                            value={field.value || ''}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`content.sections.${index}.items.${loc}`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>List Items (Optional)</FormLabel>
                                        <FormControl>
                                          <textarea 
                                            className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                                            placeholder={`Item 1\nItem 2\nItem 3`}
                                            {...field}
                                            value={field.value || ''}
                                          />
                                        </FormControl>
                                        <FormDescription>Separate each list item by pressing Enter (new line).</FormDescription>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>
                            ))}
                            
                            {loc === "en" && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => appendSection({ title: { en: "" }, description: { en: "" }, items: { en: "" } })}
                                className="w-full mt-2"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Section
                              </Button>
                            )}
                          </div>
                        )}

                        {/* About Page Fields */}
                        {form.watch("slug") === "about" && (
                          <div className="pt-6 border-t mt-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-lg font-semibold">About Page Content ({loc.toUpperCase()})</Label>
                            </div>
                            
                            <FormField
                              control={form.control}
                              name={`content.about.description.${loc}`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Main Description</FormLabel>
                                  <FormControl>
                                    <textarea 
                                      className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                      placeholder={`Enter full about description in ${loc}`}
                                      {...field}
                                      value={field.value || ''}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <div className="pt-4 space-y-4">
                              <Label className="text-md font-semibold text-primary">Statistics</Label>
                              {aboutStatsFields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-[1fr_2fr] sm:grid-cols-2 gap-4 p-4 border rounded-md relative bg-muted/10">
                                  {loc === "en" && (
                                    <Button
                                      type="button" variant="ghost" size="icon"
                                      className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                                      onClick={() => removeAboutStat(index)}
                                    ><Trash2 className="w-4 h-4" /></Button>
                                  )}
                                  <FormField
                                    control={form.control}
                                    name={`content.about.stats.${index}.number`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Number</FormLabel>
                                        <FormControl>
                                          <Input placeholder="e.g. 8+" {...field} value={field.value || ''} disabled={loc !== "en"} className={loc !== "en" ? "bg-muted cursor-not-allowed" : ""} />
                                        </FormControl>
                                        {loc === "en" && <FormDescription className="text-xs">Shared across all languages</FormDescription>}
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`content.about.stats.${index}.label.${loc}`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Label</FormLabel>
                                        <FormControl>
                                          <Input placeholder={`e.g. Years Experience in ${loc}`} {...field} value={field.value || ''} />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              ))}
                              {loc === "en" && (
                                <Button type="button" variant="outline" onClick={() => appendAboutStat({ number: "", label: { en: "" } })} className="w-full mt-2">
                                  <Plus className="w-4 h-4 mr-2" /> Add Statistic
                                </Button>
                              )}
                            </div>

                            <div className="pt-4 space-y-4">
                              <Label className="text-md font-semibold text-primary">Highlights</Label>
                              {aboutHighlightsFields.map((field, index) => (
                                <div key={field.id} className="space-y-4 p-4 border rounded-md relative bg-muted/10">
                                  {loc === "en" && (
                                    <Button
                                      type="button" variant="ghost" size="icon"
                                      className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                                      onClick={() => removeAboutHighlight(index)}
                                    ><Trash2 className="w-4 h-4" /></Button>
                                  )}
                                  <FormField
                                    control={form.control}
                                    name={`content.about.highlights.${index}.title.${loc}`}
                                    render={({ field }) => (
                                      <FormItem className={loc === "en" ? "pr-8" : ""}>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                          <Input placeholder={`Highlight title in ${loc}`} {...field} value={field.value || ''} />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`content.about.highlights.${index}.description.${loc}`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                          <textarea 
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder={`Highlight description in ${loc}`}
                                            {...field} value={field.value || ''}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              ))}
                              {loc === "en" && (
                                <Button type="button" variant="outline" onClick={() => appendAboutHighlight({ title: { en: "" }, description: { en: "" } })} className="w-full mt-2">
                                  <Plus className="w-4 h-4 mr-2" /> Add Highlight
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                        
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <FormDescription>
                          If inactive, fallback to default translations.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            {(form.watch("slug") === "home-hero" || form.watch("slug") === "about") && (
              <Card>
                <CardHeader>
                  <CardTitle>Page Cover Image {form.watch("slug") === "home-hero" && "/ Hero Background"}</CardTitle>
                  <CardDescription>Upload a background or cover image for this section. Used natively in the frontend.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="cover_image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image</FormLabel>
                        <FormControl>
                          {coverImagePreview ? (
                            <div className="relative aspect-video rounded-xl overflow-hidden border">
                              <Image
                                src={coverImagePreview}
                                alt="Cover Preview"
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={async () => {
                                    if (confirm("Remove cover image?")) {
                                      if (initialData?.cover_image === coverImagePreview) {
                                         await deletePackageImage(coverImagePreview, "pages");
                                      }
                                      setCoverImagePreview(null);
                                      form.setValue("cover_image", null, { shouldDirty: true });
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove Image
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-full h-48 border-2 border-dashed rounded-xl transition-colors hover:border-primary hover:bg-muted/50">
                              <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                  <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                  <p className="mb-2 text-sm text-muted-foreground">
                                    <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                                  </p>
                                  <p className="text-xs text-muted-foreground">Optional, highly recommended for Covers & Heros</p>
                                </div>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const slugValue = form.getValues().slug || "draft";
                                      const mockPreview = URL.createObjectURL(file);
                                      setCoverImagePreview(mockPreview);
                                      toast.loading("Uploading cover image...", { id: "upload-cover" });
                                      try {
                                        // Upload squarely to the new "pages" bucket under the page slug
                                        const { success, url, error } = await uploadPackageImage(slugValue, file, "pages");
                                        if (success && url) {
                                          setCoverImagePreview(url);
                                          form.setValue("cover_image", url, { shouldDirty: true });
                                          toast.success("Cover image uploaded!", { id: "upload-cover" });
                                        } else {
                                          throw new Error(error);
                                        }
                                      } catch (err) {
                                        setCoverImagePreview(null);
                                        toast.error("Upload failed.", { id: "upload-cover" });
                                      }
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {form.watch("slug") === "home-instagram" && (
              <Card>
                <CardHeader>
                  <CardTitle>Instagram Integration Settings</CardTitle>
                  <CardDescription>Configure the live connection to your Instagram feed via Behold.so.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="content.behold_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Behold Feed API URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. https://feeds.behold.so/NkfbcFxwKo...." 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormDescription>
                          Paste the exact Feed URL provided by your Behold.so dashboard.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {form.watch("slug") === "home-reviews" && (
              <Card>
                <CardHeader>
                  <CardTitle>Google Reviews Integration</CardTitle>
                  <CardDescription>Paste your Featurable.com widget code to embed live reviews natively.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="content.featurable_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Featurable Widget Link or Code</FormLabel>
                        <FormControl>
                          <textarea 
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder='<script src="https://featurable.com/api/v1/widgets/ce950623-57ec-498e-8b11-c6d2d84fd5ef"></script>' 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormDescription>
                          Paste the exact link or embed code generated from your Featurable dashboard. The system will cleanly extract the ID automatically.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 py-4 sticky bottom-0 bg-background border-t pt-4">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/dashboard/pages")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              initialData ? "Save Changes" : "Create Page"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

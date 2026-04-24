"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Trash2, UploadCloud, ImageIcon, Plus, Sparkles, Navigation } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

import { locationsService, type LocationDB } from "@/lib/locations-service";
import { uploadLocationImage, deleteLocationImage } from "@/lib/storage-utils";
import { generateNativeSlug } from "@/lib/slug-generator";

interface LocationFormProps {
  initialData?: LocationDB;
}

const SUPPORTED_LOCALES = ["en", "ar", "ru", "es", "zh", "de", "fr", "ro", "tr"];

export function LocationForm({ initialData }: LocationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(initialData?.cover_image || null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(initialData?.gallery_images || []);
  const [isTranslating, setIsTranslating] = useState(false);

  const formattedInitialData = initialData ? {
    ...initialData,
    tags: initialData.tags?.map(t => ({ value: t })) || [],
    nearby_locations: initialData.nearby_locations?.map(l => ({ value: l })) || [],
    photography_tips: {
      ...initialData.photography_tips,
      en: (initialData.photography_tips?.en || []).map(t => ({ value: t }))
    }
  } : undefined;

  const form = useForm<any>({
    defaultValues: formattedInitialData || {
      slug: "",
      is_active: true,
      sort_order: 1,
      cover_image: null,
      gallery_images: [],
      title: { en: "" },
      description: { en: "" },
      best_time: { en: "" },
      photography_tips: { en: [{ value: "" }] },
      nearby_locations: [],
      tags: [],
      coordinates: { lat: 41.0082, lng: 28.9784 }
    },
  });

  const { control } = form;

  const { fields: tipsFieldsEn, append: appendTip, remove: removeTip } = useFieldArray({
    control,
    name: `photography_tips.en`,
  });

  const { fields: tagsFields, append: appendTag, remove: removeTag } = useFieldArray({
    control,
    name: `tags`,
  });

  const { fields: nearbyFields, append: appendNearby, remove: removeNearby } = useFieldArray({
    control,
    name: `nearby_locations`,
  });

  const watchTipsEn = form.watch("photography_tips.en") || [];
  const watchTitleEn = form.watch("title.en");
  const watchSlug = form.watch("slug");

  // Auto-generate slug from English title if slug is empty
  useEffect(() => {
    if (watchTitleEn && !watchSlug && !initialData?.slug) {
      form.setValue("slug", generateNativeSlug(watchTitleEn), { shouldValidate: true });
    }
  }, [watchTitleEn, watchSlug, initialData?.slug, form]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const slug = form.getValues("slug");
    if (!slug) {
      toast.error("Please enter a slug first before uploading images!");
      return;
    }

    try {
      setIsSubmitting(true);
      toast.loading("Compressing and uploading...", { id: "upload-cover" });

      const { success, url, error } = await uploadLocationImage(slug, file);

      if (success && url) {
        setCoverImagePreview(url);
        form.setValue("cover_image", url, { shouldDirty: true });
        toast.success("Cover image uploaded!", { id: "upload-cover" });
      } else {
        throw new Error(error || "Upload failed");
      }
    } catch (error: any) {
      toast.error(error.message, { id: "upload-cover" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const slug = form.getValues("slug");
    if (!slug) {
      toast.error("Please enter a slug first!");
      return;
    }

    try {
      setIsSubmitting(true);
      toast.loading(`Uploading ${files.length} images...`, { id: "upload-gallery" });

      const newUrls: string[] = [];

      for (const file of files) {
        const { success, url } = await uploadLocationImage(slug, file);
        if (success && url) {
          newUrls.push(url);
        }
      }

      if (newUrls.length > 0) {
        const updatedGallery = [...galleryPreviews, ...newUrls];
        setGalleryPreviews(updatedGallery);
        form.setValue("gallery_images", updatedGallery, { shouldDirty: true });
        toast.success(`Successfully uploaded ${newUrls.length} images!`, { id: "upload-gallery" });
      }
    } catch (error: any) {
      toast.error("Failed to upload some images", { id: "upload-gallery" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCover = async () => {
    if (!coverImagePreview) return;
    try {
      await deleteLocationImage(coverImagePreview);
      setCoverImagePreview(null);
      form.setValue("cover_image", null);
      toast.success("Cover image removed");
    } catch (error) {
      toast.error("Failed to remove cover image");
    }
  };

  const handleRemoveGalleryImage = async (index: number) => {
    const urlToRemove = galleryPreviews[index];
    try {
      await deleteLocationImage(urlToRemove);
      const updatedGallery = galleryPreviews.filter((_, i) => i !== index);
      setGalleryPreviews(updatedGallery);
      form.setValue("gallery_images", updatedGallery);
      toast.success("Image removed from gallery");
    } catch (error) {
      toast.error("Failed to remove image");
    }
  };

  const handleAITranslate = async () => {
    const values = form.getValues();

    // Ensure we have English content to translate
    if (!values.title?.en || !values.description?.en) {
      toast.error("Please enter English Title and Description first!");
      return;
    }

    try {
      setIsTranslating(true);
      toast.loading("AI is translating location content to 7 languages... This may take up to a minute.", { id: "ai-trans" });

      const contentToTranslate = {
        title: values.title.en,
        description: values.description.en,
        best_time: values.best_time?.en || "",
        photography_tips: (values.photography_tips?.en || []).map((t: any) => t?.value ?? t).filter(Boolean),
      };

      const response = await fetch("/api/admin/translate-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contentToTranslate),
      });

      if (!response.ok) {
        throw new Error("Translation request failed");
      }

      const { translatedSegments } = await response.json();

      SUPPORTED_LOCALES.forEach((locale) => {
        if (locale === "en") return;

        if (translatedSegments[locale]) {
          const trans = translatedSegments[locale];

          form.setValue(`title.${locale}`, trans.title || "");
          form.setValue(`description.${locale}`, trans.description || "");
          form.setValue(`best_time.${locale}`, trans.best_time || "");

          if (Array.isArray(trans.photography_tips)) {
            form.setValue(`photography_tips.${locale}`, trans.photography_tips);
          }
        }
      });

      toast.success("AI Translation complete!", { id: "ai-trans" });
    } catch (error) {
      console.error(error);
      toast.error("AI Translation failed. Please try again.", { id: "ai-trans" });
    } finally {
      setIsTranslating(false);
    }
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      toast.loading("Saving location...", { id: "save-loc" });

      const payload: Partial<LocationDB> = {
        slug: data.slug,
        is_active: data.is_active,
        sort_order: parseInt(data.sort_order),
        cover_image: data.cover_image,
        gallery_images: data.gallery_images,
        title: data.title,
        description: data.description,
        best_time: data.best_time,
        photography_tips: Object.keys(data.photography_tips || {}).reduce((acc: any, locale) => {
          const tips = data.photography_tips[locale];
          acc[locale] = (Array.isArray(tips) ? tips : []).map((t: any) => t?.value ?? t).filter(Boolean);
          return acc;
        }, {}),
        nearby_locations: (data.nearby_locations || []).map((l: any) => l?.value ?? l).filter(Boolean),
        tags: Array.isArray(data.tags)
          ? data.tags.map((t: any) => t?.value ?? t).flatMap((t: string) => (t && typeof t === 'string') ? t.split(',').map(s => s.trim()).filter(Boolean) : [])
          : [],
        coordinates: {
          lat: parseFloat(data.coordinates.lat) || 0,
          lng: parseFloat(data.coordinates.lng) || 0
        }
      };

      if (initialData?.id) {
        await locationsService.updateLocation(initialData.id, payload);
        toast.success("Location updated successfully", { id: "save-loc" });
      } else {
        await locationsService.createLocation(payload);
        toast.success("Location created successfully", { id: "save-loc" });
      }

      router.push("/admin/dashboard/locations");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save location", { id: "save-loc" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* TOP ACTIONS */}
        <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-primary/10 shadow-sm sticky top-0 z-10 w-full dark:bg-background">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/admin/dashboard/locations")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <div className="flex items-center space-x-2 border-l pl-4 border-border">
              <Switch
                checked={form.watch("is_active")}
                onCheckedChange={(c) => form.setValue("is_active", c)}
              />
              <Label>Active & Published</Label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleAITranslate}
              disabled={isTranslating || isSubmitting}
              className="gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-400"
            >
              {isTranslating ? <Spinner className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Translate All (AI)
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Location"
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: Metadata & Media */}
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (URL)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. galata-tower" {...field} />
                      </FormControl>
                      <FormDescription>Must be unique, lowercase, no spaces.</FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>Lower numbers appear first.</FormDescription>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="coordinates.lat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" placeholder="41.0082" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="coordinates.lng"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" placeholder="28.9784" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags & Relations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <FormLabel className="mb-2 block">Tags (e.g. historic, couple, rooftop)</FormLabel>
                  <div className="space-y-2">
                    {tagsFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <Input {...form.register(`tags.${index}.value`)} placeholder="Tag..." />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeTag(index)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => appendTag({ value: "" })}>
                      <Plus className="w-4 h-4 mr-2" /> Add Tag
                    </Button>
                  </div>
                </div>

                <div>
                  <FormLabel className="mb-2 block">Nearby Locations (Slugs)</FormLabel>
                  <div className="space-y-2">
                    {nearbyFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <Input {...form.register(`nearby_locations.${index}.value`)} placeholder="galata-bridge" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeNearby(index)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => appendNearby({ value: "" })}>
                      <Plus className="w-4 h-4 mr-2" /> Add Nearby
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
                <CardDescription>Hero and Gallery Images</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!form.watch("slug") && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 p-3 rounded-lg text-sm mb-4 border border-amber-200 dark:border-amber-900 flex items-center justify-center font-medium">
                    Please type a Slug (URL) in the Metadata section before uploading images.
                  </div>
                )}
                <div>
                  <Label className="mb-2 block">Hero Image (Cover)</Label>
                  {coverImagePreview ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border">
                      <Image src={coverImagePreview} alt="Cover" fill className="object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600"
                        onClick={handleRemoveCover}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center bg-muted/50 hover:bg-muted transition-colors">
                      <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">{form.watch("slug") ? "Click to upload cover" : "Type slug first!"}</p>
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        disabled={!form.watch("slug")}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label className="mb-2 block">Gallery Images</Label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {galleryPreviews.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                        <Image src={url} alt={`Gallery ${index}`} fill className="object-cover" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => handleRemoveGalleryImage(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="relative aspect-square rounded-md border-2 border-dashed flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      <Plus className="w-6 h-6 text-muted-foreground" />
                      <input
                        type="file"
                        multiple
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        accept="image/*"
                        onChange={handleGalleryUpload}
                        disabled={!form.watch("slug")}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Content translation */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="bg-muted/30 pb-4 border-b">
                <CardTitle className="text-xl flex items-center gap-2">
                  Content Dictionary
                  <Badge variant="outline" className="ml-2 font-normal text-xs bg-background">
                    {SUPPORTED_LOCALES.length} Languages
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Write in English first, then use <strong>Translate All (AI)</strong>. AI will recursively translate titles, descriptions, and photography tips matching the English fields structure.
                </CardDescription>
              </CardHeader>
              <Tabs defaultValue="en" className="w-full">
                <div className="px-6 pt-4 border-b">
                  <TabsList className="bg-transparent space-x-2 h-auto p-0 mb-4 overflow-x-auto w-full justify-start">
                    {SUPPORTED_LOCALES.map((locale) => (
                      <TabsTrigger
                        key={locale}
                        value={locale}
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5"
                      >
                        {locale.toUpperCase()}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {SUPPORTED_LOCALES.map((locale) => (
                  <TabsContent key={locale} value={locale} className="p-6 space-y-6 m-0 border-none outline-none">

                    <FormField
                      control={form.control}
                      name={`title.${locale}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location Name ({locale})</FormLabel>
                          <FormControl>
                            <Input placeholder="..." {...field} className="text-lg font-medium" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`description.${locale}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detailed Description ({locale})</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the location..."
                              {...field}
                              className="min-h-[150px] resize-y"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`best_time.${locale}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Best Time To Visit ({locale})</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Early Morning, Sunset" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3 pt-4 border-t">
                      <FormLabel className="text-base font-semibold block">
                        Photography Tips ({locale})
                      </FormLabel>

                      {/* For English: Let admin add/remove fields */}
                      {locale === "en" ? (
                        <>
                          {tipsFieldsEn.map((field, index) => (
                            <div key={field.id} className="flex items-start gap-2">
                              <Input
                                {...form.register(`photography_tips.en.${index}.value`)}
                                placeholder="Enter a photography tip..."
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeTip(index)}
                                className="shrink-0"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendTip({ value: "" })}
                          >
                            <Plus className="w-4 h-4 mr-2" /> Add Tip
                          </Button>
                        </>
                      ) : (
                        /* For other locales: Mirror English fields count */
                        <>
                          {watchTipsEn.map((_: any, index: number) => (
                            <div key={index} className="flex items-start gap-2">
                              <Input
                                {...form.register(`photography_tips.${locale}.${index}`)}
                                placeholder="Waiting for translation..."
                              />
                            </div>
                          ))}
                          {watchTipsEn.length === 0 && (
                            <p className="text-sm text-muted-foreground italic">Add tips in English first.</p>
                          )}
                        </>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}

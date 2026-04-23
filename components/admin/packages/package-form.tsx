"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, UploadCloud, Plus, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Field, FieldLabel } from "@/components/ui/field";
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

import { packagesService, type PackageDB } from "@/lib/packages-service";
import { uploadPackageImage, deletePackageImage } from "@/lib/storage-utils";

interface PackageFormProps {
  initialData?: PackageDB;
}

const SUPPORTED_LOCALES = ["en", "ar", "ru", "es", "zh", "de", "fr", "ro", "tr"];

export function PackageForm({ initialData }: PackageFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(initialData?.cover_image || null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(initialData?.gallery_images || []);

  const form = useForm<any>({
    defaultValues: initialData || {
      slug: "",
      price: 150,
      original_price: null,
      is_active: true,
      is_per_person: false,
      is_popular: false,
      sort_order: 1,
      cover_image: null,
      gallery_images: [],
      title: { en: "" },
      description: { en: "" },
      duration: { en: "" },
      features: { en: [""] },
      locations: 1,
    },
  });

  const { control } = form;

  const { fields: featureFieldsEn, append: appendFeature, remove: removeFeature } = useFieldArray({
    control,
    name: `features.en`,
  });

  // Watch features to know how many fields to render in other locales
  const watchFeaturesEn = form.watch("features.en") || [];

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if slug exists to use as folder name
    const slug = form.getValues("slug");
    if (!slug) {
      toast.error("Please enter a slug first before uploading images!");
      return;
    }

    try {
      setIsSubmitting(true);
      toast.loading("Compressing and uploading...", { id: "upload-cover" });

      const { success, url, error } = await uploadPackageImage(slug, file);

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

  const handleRemoveCover = async () => {
    const currentUrl = form.getValues("cover_image");
    if (currentUrl && currentUrl.startsWith("http")) {
      // Best effort try to delete from bucket
      await deletePackageImage(currentUrl);
    }
    setCoverImagePreview(null);
    form.setValue("cover_image", null, { shouldDirty: true });
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const slug = form.getValues("slug");
    if (!slug) {
      toast.error("Please enter a slug first!");
      return;
    }

    setIsSubmitting(true);
    toast.loading(`Uploading ${files.length} images...`, { id: "upload-gallery" });

    try {
      const uploadPromises = Array.from(files).map(file => uploadPackageImage(slug, file));
      const results = await Promise.all(uploadPromises);

      const newUrls = results.filter(r => r.success && r.url).map(r => r.url as string);

      if (newUrls.length > 0) {
        const currentGallery = form.getValues("gallery_images") || [];
        const updatedGallery = [...currentGallery, ...newUrls];
        setGalleryPreviews(updatedGallery);
        form.setValue("gallery_images", updatedGallery, { shouldDirty: true });
        toast.success("Gallery images uploaded!", { id: "upload-gallery" });
      }
    } catch (err) {
      toast.error("Failed to upload some gallery images", { id: "upload-gallery" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveGalleryImage = async (index: number) => {
    const currentGallery = form.getValues("gallery_images") || [];
    const urlToRemove = currentGallery[index];

    if (urlToRemove && urlToRemove.startsWith("http")) {
      await deletePackageImage(urlToRemove);
    }

    const newGallery = [...currentGallery];
    newGallery.splice(index, 1);

    setGalleryPreviews(newGallery);
    form.setValue("gallery_images", newGallery, { shouldDirty: true });
  };

  const handleMoveGalleryImage = (index: number, direction: 'left' | 'right') => {
    const currentGallery = form.getValues("gallery_images") || [];
    if (
      (direction === 'left' && index === 0) || 
      (direction === 'right' && index === currentGallery.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'left' ? index - 1 : index + 1;
    const newGallery = [...currentGallery];
    
    // Swap elements
    [newGallery[index], newGallery[newIndex]] = [newGallery[newIndex], newGallery[index]];

    setGalleryPreviews(newGallery);
    form.setValue("gallery_images", newGallery, { shouldDirty: true });
  };

  const handleAITranslate = async () => {
    const data = form.getValues();
    if (!data.title?.en || !data.description?.en || !data.duration?.en || !data.features?.en) {
      toast.error("Please fill in all English fields first before auto-translating.");
      return;
    }

    toast.loading("Translating to all languages...", { id: "ai-translation" });
    try {
      const translateRes = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title.en,
          description: data.description.en,
          duration: data.duration.en,
          features: data.features.en,
        }),
      });

      if (translateRes.ok) {
        const translateData = await translateRes.json();
        if (translateData.translations) {
          SUPPORTED_LOCALES.forEach(loc => {
            if (loc === "en") return;
            if (translateData.translations[loc]) {
              form.setValue(`title.${loc}`, translateData.translations[loc].title, { shouldDirty: true });
              form.setValue(`description.${loc}`, translateData.translations[loc].description, { shouldDirty: true });
              form.setValue(`duration.${loc}`, translateData.translations[loc].duration, { shouldDirty: true });
              form.setValue(`features.${loc}`, translateData.translations[loc].features, { shouldDirty: true });
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
      const { generateNativeSlug } = await import('@/lib/slug-generator');
      // Set the master identifier slug based on the English Title
      const masterSlug = data.slug || generateNativeSlug(data.title.en || 'unknown-package');

      // Formatting payload
      const payload: any = {
        slug: masterSlug,
        price: Number(data.price),
        original_price: data.original_price ? Number(data.original_price) : null,
        is_active: data.is_active,
        is_per_person: data.is_per_person,
        is_popular: Boolean(data.is_popular),
        sort_order: Number(data.sort_order),
        cover_image: data.cover_image,
        gallery_images: data.gallery_images,
        title: data.title,
        description: data.description,
        duration: data.duration,
        features: data.features,
        locations: typeof data.locations === "string" ? parseInt(data.locations, 10) : data.locations,
      };

      if (initialData?.id) {
        await packagesService.updatePackage(initialData.id, payload);
        toast.success("Package updated successfully!");
      } else {
        await packagesService.createPackage(payload);
        toast.success("Package created successfully!");
      }

      router.push("/admin/dashboard/packages");
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
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Core details about this photography package.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Master Slug is now strictly auto-generated from English Title so we hide it here */}
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Price (€)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="original_price"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Original Price (Optional)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="sort_order"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Sort Order</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="locations"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Locations (Count)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                </div>

                {/* Localized Content Tabs */}
                <div className="pt-4 border-t mt-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <div>
                      <Label className="block text-lg font-semibold">Localized Content</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Manage package details for each language.
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
                              <FormLabel>Title ({loc.toUpperCase()})</FormLabel>
                              <FormControl>
                                <Input placeholder={`Title in ${loc}`} {...field} value={field.value || ''} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`duration.${loc}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration string ({loc.toUpperCase()})</FormLabel>
                              <FormControl>
                                <Input placeholder={`e.g. 1.5 Hours`} {...field} value={field.value || ''} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`description.${loc}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description ({loc.toUpperCase()})</FormLabel>
                              <FormControl>
                                <Textarea placeholder={`Detailed description in ${loc}...`} className="min-h-32" {...field} value={field.value || ''} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {/* Feature Checklist for ALL locales */}
                        <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                          <Label className="block font-semibold">
                            Features Checklist ({loc.toUpperCase()})
                            {loc !== 'en' && <span className="text-xs text-muted-foreground ml-2 font-normal">(Auto-syncs length with English)</span>}
                          </Label>
                          <ul className="space-y-2">
                            {/* For EN we use fieldArray, for others we map based on EN length so they match line-by-line */}
                            {(loc === 'en' ? featureFieldsEn : watchFeaturesEn).map((_: any, index: number) => (
                              <li key={loc === 'en' ? (featureFieldsEn[index] as any).id : `feat-${loc}-${index}`} className="flex gap-2 items-center">
                                <FormField
                                  control={form.control}
                                  name={`features.${loc}.${index}`}
                                  render={({ field }) => (
                                    <FormControl>
                                      <Input placeholder={`Feature ${index + 1} in ${loc}`} {...field} value={field.value || ''} />
                                    </FormControl>
                                  )}
                                />
                                {loc === 'en' && (
                                  <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(index)}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                )}
                              </li>
                            ))}
                          </ul>
                          {loc === 'en' && (
                            <Button type="button" variant="outline" size="sm" onClick={() => appendFeature("")}>
                              <Plus className="w-4 h-4 mr-2" />
                              Add Feature (EN)
                            </Button>
                          )}
                        </div>
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
                <CardTitle>Status & Order</CardTitle>
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
                          Make this package visible on the website.
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

                <FormField
                  control={form.control}
                  name="is_per_person"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Per Person Pricing</FormLabel>
                        <FormDescription>
                          If enabled, price is multiplied by person count.
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

                <FormField
                  control={form.control}
                  name="is_popular"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Most Popular</FormLabel>
                        <FormDescription>
                          Display the "Most Popular" badge on this package.
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

                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>Lower numbers appear first.</FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
                <CardDescription>Upload photos (auto-optimized max 150KB WebP).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                <Field className="space-y-4">
                  <FieldLabel>Cover Image</FieldLabel>
                  {coverImagePreview ? (
                    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border">
                      <Image src={coverImagePreview} fill className="object-cover" alt="Cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 rounded-full w-8 h-8 opacity-80 hover:opacity-100"
                        onClick={handleRemoveCover}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Label
                      htmlFor="cover-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span>
                        </p>
                      </div>
                      <Input
                        id="cover-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverUpload}
                        disabled={isSubmitting}
                      />
                    </Label>
                  )}
                </Field>

                <Field className="space-y-4">
                  <FieldLabel>Gallery Images</FieldLabel>

                  {galleryPreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {galleryPreviews.map((url, i) => (
                        <div key={i} className="group relative aspect-square rounded-md overflow-hidden border">
                          <Image src={url} fill className="object-cover" alt={`Gallery ${i}`} />
                          
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 rounded-full w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveGalleryImage(i)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>

                          <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity px-1">
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className={`rounded-full w-6 h-6 bg-background/80 hover:bg-background ${i === 0 ? 'invisible' : ''}`}
                              onClick={() => handleMoveGalleryImage(i, 'left')}
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className={`rounded-full w-6 h-6 bg-background/80 hover:bg-background ${i === galleryPreviews.length - 1 ? 'invisible' : ''}`}
                              onClick={() => handleMoveGalleryImage(i, 'right')}
                            >
                              <ChevronRight className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Label
                    htmlFor="gallery-upload"
                    className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 gap-2">
                      <Plus className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-semibold">Add Gallery Images</span>
                    </div>
                    <Input
                      id="gallery-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleGalleryUpload}
                      disabled={isSubmitting}
                    />
                  </Label>
                </Field>
              </CardContent>
            </Card>

          </div>
        </div>

        <div className="flex justify-end py-4 sticky bottom-0 bg-background border-t pt-4">
          <ButtonGroup>
            <Button type="button" variant="outline" onClick={() => router.push("/admin/dashboard/packages")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                initialData ? "Save Changes" : "Create Package"
              )}
            </Button>
          </ButtonGroup>
        </div>
      </form>
    </Form>
  );
}

"use client";

import { Save, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import type { AddonDB } from "@/lib/addons-service";
import { generateNativeSlug } from "@/lib/slug-generator";

interface AddonFormProps {
  initialData?: AddonDB;
}

const SUPPORTED_LOCALES = [
  "en",
  "ar",
  "ru",
  "es",
  "zh",
  "de",
  "fr",
  "ro",
  "tr",
];

export function AddonForm({ initialData }: AddonFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState("en");

  const form = useForm<any>({
    defaultValues: initialData || {
      slug: "",
      is_active: true,
      price: 0,
      is_per_person: false,
      title: { en: "" },
      description: { en: "" },
    },
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        price: parseFloat(values.price.toString()),
      };

      const url = initialData?.id
        ? `/api/admin/addons/${initialData.id}`
        : "/api/admin/addons";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save addon");
      }

      toast.success(
        initialData
          ? "Addon updated successfully"
          : "Addon created successfully",
      );
      router.push("/admin/dashboard/addons");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoTranslate = async () => {
    if (activeTab === "en") return;
    const data = form.getValues();
    if (!data.title?.en || !data.description?.en) {
      toast.error(
        "Please fill in all English fields first before auto-translating.",
      );
      return;
    }

    setIsTranslating(true);
    toast.loading(`Translating to ${activeTab.toUpperCase()}...`, {
      id: "ai-translation",
    });

    try {
      const translateRes = await fetch("/api/admin/translate-addon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title.en,
          description: data.description.en,
          targetLocale: activeTab,
        }),
      });

      if (translateRes.ok) {
        const translateData = await translateRes.json();
        if (translateData.translations?.[activeTab]) {
          const translated = translateData.translations[activeTab];
          form.setValue(`title.${activeTab}`, translated.title, {
            shouldDirty: true,
          });
          form.setValue(`description.${activeTab}`, translated.description, {
            shouldDirty: true,
          });

          toast.success(`${activeTab.toUpperCase()} translation successful!`, {
            id: "ai-translation",
          });
        } else {
          toast.error("AI translation returned empty.", {
            id: "ai-translation",
          });
        }
      } else {
        const errData = await translateRes.json();
        throw new Error(errData.error || "Translation failed");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to translate.", {
        id: "ai-translation",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const generateSlug = () => {
    const enTitle = form.getValues("title.en");
    if (enTitle) {
      form.setValue("slug", generateNativeSlug(enTitle), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Set the core details for this add-on.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-semibold">Localizations</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage add-on details for each language.
                    </p>
                  </div>
                  {activeTab !== "en" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAutoTranslate}
                      disabled={isTranslating}
                      className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900"
                    >
                      {isTranslating ? (
                        <Spinner className="w-4 h-4 mr-2" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Translate to {activeTab.toUpperCase()}
                    </Button>
                  )}
                </div>

                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="flex flex-wrap h-auto w-full justify-start bg-muted/50 p-1 mb-4">
                    {SUPPORTED_LOCALES.map((locale) => (
                      <TabsTrigger
                        key={locale}
                        value={locale}
                        className="uppercase text-xs"
                      >
                        {locale}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {SUPPORTED_LOCALES.map((locale) => (
                    <TabsContent
                      key={locale}
                      value={locale}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name={`title.${locale}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Title ({locale.toUpperCase()})
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={`e.g. Professional Makeup`}
                                {...field}
                                value={field.value || ""}
                                dir={locale === "ar" ? "rtl" : "ltr"}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`description.${locale}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Description ({locale.toUpperCase()})
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the add-on..."
                                className="min-h-[100px]"
                                {...field}
                                value={field.value || ""}
                                dir={locale === "ar" ? "rtl" : "ltr"}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Settings & Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="professional-makeup" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={generateSlug}
                        >
                          Generate
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="50"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
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
                        <FormLabel className="text-base">
                          Per Person Pricing
                        </FormLabel>
                        <FormDescription>
                          If enabled, the price will be multiplied by the number
                          of people selected during booking.
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
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Active Status
                        </FormLabel>
                        <FormDescription>
                          Enable or disable this add-on across the site.
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

            <div className="sticky bottom-6">
              <Button
                type="submit"
                className="w-full shadow-lg"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Add-on
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}

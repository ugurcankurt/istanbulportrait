"use client";

import { useEffect, useState } from "react";
import {  Save } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WebpImageUploader } from "@/components/ui/webp-image-uploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteSettings, defaultSettings } from "@/lib/settings-service";
import { ThemeCustomizer } from "@/components/admin/theme-customizer";

const SUPPORTED_LOCALES = ["en", "ar", "ru", "es", "zh", "de", "fr", "ro", "tr"];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/admin/settings");
        if (response.ok) {
          const data = await response.json();
          // Merge fetched data with defaults to ensure all keys exist
          setSettings({ ...defaultSettings, ...data });
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        toast.error("Could not load site settings. Using defaults.");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      toast.success("Site settings have been successfully saved.");
    } catch (error) {
      toast.error("There was an error updating your site settings.");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SiteSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateTranslatable = (key: "address" | "working_hours" | "site_description", locale: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [locale]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Site Settings</h1>
          <p className="text-muted-foreground">Manage global site configuration, API links, and logos.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Spinner className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance / Theme Customizer */}
        <div className="lg:col-span-2">
           <ThemeCustomizer 
             themeColor={settings.theme_color} 
             onThemeChange={(v) => updateSetting("theme_color", v)} 
           />
        </div>

        {/* SEO & Brand Identity */}
        <Card className="lg:col-span-2">
            <CardHeader>
               <CardTitle>Global SEO & Schema Identity</CardTitle>
               <CardDescription>Master metadata for search engines, rich snippets, and social sharing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Site Name (SEO Title Base)</Label>
                    <Input
                       value={settings.site_name || ""}
                       onChange={(e) => updateSetting("site_name", e.target.value)}
                       placeholder="Istanbul Photo Session"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Organization Legal Name (Schema)</Label>
                    <Input
                       value={settings.organization_name || ""}
                       onChange={(e) => updateSetting("organization_name", e.target.value)}
                       placeholder="Istanbul Portrait"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Founder Name (Schema & About)</Label>
                    <Input
                       value={settings.founder_name || ""}
                       onChange={(e) => updateSetting("founder_name", e.target.value)}
                       placeholder="Uğur Cankurt"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Founding Date</Label>
                    <Input
                       type="date"
                       value={settings.organization_founding_date || ""}
                       onChange={(e) => updateSetting("organization_founding_date", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6 mt-4">
                  <div className="space-y-4">
                    <WebpImageUploader
                       label="Default Social Share Image (OG Image)"
                       description="Fallback image when a page is shared on social networks."
                       value={settings.default_og_image_url}
                       onChange={(v) => updateSetting("default_og_image_url", v)}
                       bucket="pages"
                       folder="site-assets"
                    />
                  </div>
                  <div className="space-y-4">
                    <WebpImageUploader
                       label="Founder Portrait"
                       description="Used inside Schema.org entity definitions."
                       value={settings.founder_image_url}
                       onChange={(v) => updateSetting("founder_image_url", v)}
                       bucket="pages"
                       folder="site-assets"
                    />
                  </div>
                </div>
            </CardContent>
        </Card>

        {/* Core Assets */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Assets</CardTitle>
            <CardDescription>Upload main logos and favicons. Auto-converted to .webp.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <WebpImageUploader
              label="Logo (Light Mode)"
              description="Used on white/light backgrounds."
              value={settings.logo_url}
              onChange={(v) => updateSetting("logo_url", v)}
              bucket="pages"
              folder="site-assets"
            />
            <div className="h-px bg-border my-6" />
            <WebpImageUploader
              label="Logo (Dark Mode)"
              description="Used on dark/black backgrounds."
              value={settings.logo_dark_url}
              onChange={(v) => updateSetting("logo_dark_url", v)}
              bucket="pages"
              folder="site-assets"
            />
            <div className="h-px bg-border my-6" />
            <WebpImageUploader
              label="Favicon"
              description="Small icon displayed in the browser tab."
              value={settings.favicon_url}
              onChange={(v) => updateSetting("favicon_url", v)}
              bucket="pages"
              folder="site-assets"
            />
          </CardContent>
        </Card>

        {/* Global Contact Infos */}
        <Card>
          <CardHeader>
            <CardTitle>Global Support Contact</CardTitle>
            <CardDescription>Primary communication channels shared globally.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input
                value={settings.contact_email}
                onChange={(e) => updateSetting("contact_email", e.target.value)}
                placeholder="info@yourdomain.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Support Phone Number</Label>
              <Input
                value={settings.contact_phone}
                onChange={(e) => updateSetting("contact_phone", e.target.value)}
                placeholder="+905551234567"
              />
              <p className="text-xs text-muted-foreground mt-1">Please include country code, e.g. +90</p>
            </div>
            <div className="space-y-2">
              <Label>WhatsApp Lead Number</Label>
              <Input
                value={settings.whatsapp_number}
                onChange={(e) => updateSetting("whatsapp_number", e.target.value)}
                placeholder="+905551234567"
              />
              <p className="text-xs text-muted-foreground mt-1">Directs the WhatsApp Button. Please include full country code.</p>
            </div>
          </CardContent>
        </Card>

        {/* Localization specific configurations */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Translatable Locale Specific Settings</CardTitle>
            <CardDescription>Configure localized variants for textual globals like address.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="en" className="w-full">
              <TabsList className="mb-4 flex-wrap pb-2 h-auto">
                {SUPPORTED_LOCALES.map((locale) => (
                  <TabsTrigger key={locale} value={locale} className="uppercase">
                    {locale}
                  </TabsTrigger>
                ))}
              </TabsList>

              {SUPPORTED_LOCALES.map((locale) => (
                <TabsContent key={locale} value={locale} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Global SEO Meta Description</Label>
                    <Textarea
                      value={settings.site_description?.[locale] || ""}
                      onChange={(e) => updateTranslatable("site_description", locale, e.target.value)}
                      placeholder="Expert photographer in Istanbul for professional portrait and lifestyle photography sessions."
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Local Full Address</Label>
                    <Textarea
                      value={settings.address?.[locale] || ""}
                      onChange={(e) => updateTranslatable("address", locale, e.target.value)}
                      placeholder="Eminönü, Istanbul, Turkey"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Working Hours Message</Label>
                    <Input
                      value={settings.working_hours?.[locale] || ""}
                      onChange={(e) => updateTranslatable("working_hours", locale, e.target.value)}
                      placeholder="Everyday: 06:00 - 22:00"
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Social Media Links</CardTitle>
            <CardDescription>URLs attached to footers and quick navigations.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Instagram URL</Label>
              <Input
                value={settings.instagram_url || ""}
                onChange={(e) => updateSetting("instagram_url", e.target.value)}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Facebook URL</Label>
              <Input
                value={settings.facebook_url || ""}
                onChange={(e) => updateSetting("facebook_url", e.target.value)}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>YouTube URL</Label>
              <Input
                value={settings.youtube_url || ""}
                onChange={(e) => updateSetting("youtube_url", e.target.value)}
                placeholder="https://youtube.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>TikTok URL</Label>
              <Input
                value={settings.tiktok_url || ""}
                onChange={(e) => updateSetting("tiktok_url", e.target.value)}
                placeholder="https://tiktok.com/..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Developer & Tracking Configurations */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Developer & Tracking Configurations</CardTitle>
            <CardDescription>Bypass .env.local completely. Configure analytics and external APIs here.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Google Analytics ID</Label>
                <Input
                  value={settings.google_analytics_id || ""}
                  onChange={(e) => updateSetting("google_analytics_id", e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label>Yandex Metrica ID</Label>
                <Input
                  value={settings.yandex_metrica_id || ""}
                  onChange={(e) => updateSetting("yandex_metrica_id", e.target.value)}
                  placeholder="12345678"
                />
              </div>
              <div className="space-y-2">
                <Label>Resend API Key</Label>
                <Input
                  type="password"
                  value={settings.resend_api_key || ""}
                  onChange={(e) => updateSetting("resend_api_key", e.target.value)}
                  placeholder="re_xxxxxxxxxxxxxx"
                />
              </div>
              <div className="space-y-2 pt-2 border-t mt-4">
                <Label>Gemini API Key (AI Translations)</Label>
                <Input
                  type="password"
                  value={settings.gemini_api_key || ""}
                  onChange={(e) => updateSetting("gemini_api_key", e.target.value)}
                  placeholder="AIzaSy..."
                />
              </div>
            </div>

            <div className="space-y-4">
               <div className="space-y-2">
                <Label>Custom &lt;head&gt; Scripts</Label>
                <Textarea
                  className="font-mono text-xs h-24"
                  value={settings.custom_head_scripts || ""}
                  onChange={(e) => updateSetting("custom_head_scripts", e.target.value)}
                  placeholder="<script>...</script>"
                />
                <p className="text-xs text-muted-foreground">Injected directly inside the &lt;head&gt; tag.</p>
              </div>
              <div className="space-y-2">
                <Label>Custom &lt;body&gt; Scripts</Label>
                <Textarea
                  className="font-mono text-xs h-24"
                  value={settings.custom_body_scripts || ""}
                  onChange={(e) => updateSetting("custom_body_scripts", e.target.value)}
                  placeholder="<script>...</script>"
                />
                 <p className="text-xs text-muted-foreground">Injected before the closing &lt;/body&gt; tag.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer safe margin */}
      <div className="h-10 w-full" />
    </div>
  );
}

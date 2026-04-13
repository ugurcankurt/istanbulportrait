import { supabase } from "./supabase";

export interface SiteSettings {
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  instagram_url: string;
  facebook_url: string;
  youtube_url: string;
  tiktok_url: string;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  address: Record<string, string>; // locale -> address
  working_hours: Record<string, string>; // locale -> working_hours
  google_analytics_id: string | null;
  yandex_metrica_id: string | null;
  resend_api_key: string | null;
  custom_head_scripts: string | null;
  custom_body_scripts: string | null;
  gemini_api_key: string | null;
  site_name: string | null;
  site_description: Record<string, string>; // locale -> description

  default_og_image_url: string | null;
  organization_name: string | null;
  organization_founding_date: string | null;
  founder_name: string | null;
  founder_image_url: string | null;
  ai_search_config: Record<string, any>; // JSON schema config
  theme_color: string;
}

export const defaultSettings: SiteSettings = {
  contact_email: "",
  contact_phone: "",
  whatsapp_number: "",
  instagram_url: "",
  facebook_url: "",
  youtube_url: "",
  tiktok_url: "",
  logo_url: "",
  logo_dark_url: "",
  favicon_url: "",
  address: {},
  working_hours: {},
  google_analytics_id: null,
  yandex_metrica_id: null,
  resend_api_key: null,
  custom_head_scripts: null,
  custom_body_scripts: null,
  gemini_api_key: null,
  site_name: "",
  site_description: {},
  default_og_image_url: "",
  organization_name: "",
  organization_founding_date: "",
  founder_name: "",
  founder_image_url: "",
  ai_search_config: {},
  theme_color: "violet"
};

export const settingsService = {
  /**
   * Fetch site settings from Supabase (runs on Server or Client).
   * Falls back to default settings if query fails or table is empty.
   */
  async getSettings(): Promise<SiteSettings> {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) {
        console.error("Error fetching site settings:", error);
        return defaultSettings;
      }

      if (!data) return defaultSettings;

      // Merge fetched data with defaults to ensure all fields exist
      return {
        contact_email: data.contact_email || defaultSettings.contact_email,
        contact_phone: data.contact_phone || defaultSettings.contact_phone,
        whatsapp_number: data.whatsapp_number || defaultSettings.whatsapp_number,
        instagram_url: data.instagram_url || defaultSettings.instagram_url,
        facebook_url: data.facebook_url || defaultSettings.facebook_url,
        youtube_url: data.youtube_url || defaultSettings.youtube_url,
        tiktok_url: data.tiktok_url || defaultSettings.tiktok_url,
        logo_url: data.logo_url || defaultSettings.logo_url,
        logo_dark_url: data.logo_dark_url || defaultSettings.logo_dark_url,
        favicon_url: data.favicon_url || defaultSettings.favicon_url,
        address: (data.address as Record<string, string>) || defaultSettings.address,
        working_hours: (data.working_hours as Record<string, string>) || defaultSettings.working_hours,
        google_analytics_id: data.google_analytics_id || defaultSettings.google_analytics_id,
        yandex_metrica_id: data.yandex_metrica_id || defaultSettings.yandex_metrica_id,
        resend_api_key: data.resend_api_key || defaultSettings.resend_api_key,
        custom_head_scripts: data.custom_head_scripts || defaultSettings.custom_head_scripts,
        custom_body_scripts: data.custom_body_scripts || defaultSettings.custom_body_scripts,
        gemini_api_key: data.gemini_api_key || defaultSettings.gemini_api_key,
        site_name: data.site_name || defaultSettings.site_name,
        site_description: (data.site_description as Record<string, string>) || defaultSettings.site_description,

        default_og_image_url: data.default_og_image_url || defaultSettings.default_og_image_url,
        organization_name: data.organization_name || defaultSettings.organization_name,
        organization_founding_date: data.organization_founding_date || defaultSettings.organization_founding_date,
        founder_name: data.founder_name || defaultSettings.founder_name,
        founder_image_url: data.founder_image_url || defaultSettings.founder_image_url,
        ai_search_config: (data.ai_search_config as Record<string, any>) || defaultSettings.ai_search_config,
        theme_color: data.theme_color || defaultSettings.theme_color,
      };
    } catch (error) {
      console.error("Failed to load settings:", error);
      return defaultSettings;
    }
  },

  /**
   * Helper to resolve translatable fields explicitly.
   */
  resolveTranslatable(field: Record<string, string>, locale: string, fallbackLocale = "en"): string {
    if (!field) return "";
    return field[locale] || field[fallbackLocale] || Object.values(field)[0] || "";
  }
};

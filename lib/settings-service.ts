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
  color_mode: "light" | "dark" | "system" | string;
  city: string | null;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_time: string | null;
  closing_time: string | null;
  working_days: string[] | null;

  // Modern Dynamic Environment Settings
  iyzico_base_url: string | null;
  iyzico_api_key: string | null;
  iyzico_secret_key: string | null;

  facebook_pixel_id: string | null;
  facebook_dataset_id: string | null;
  facebook_access_token: string | null;
  facebook_verify_token: string | null;

  instagram_access_token: string | null;
  instagram_account_id: string | null;

  ga4_measurement_protocol_secret: string | null;
  app_base_url: string | null;
  admin_email: string | null;

  turinvoice_base_url: string | null;
  turinvoice_login: string | null;
  turinvoice_password: string | null;
  turinvoice_id_tsp: string | null;
  turinvoice_secret_key: string | null;
  turinvoice_callback_url: string | null;

  clarity_project_id: string | null;
  yandex_webmaster_key: string | null;
  bing_webmaster_key: string | null;
  indexnow_api_key: string | null;

  behold_url: string | null;
  prodigi_api_key: string | null;
  prodigi_api_url: string | null;
  google_ads_webhook_key: string | null;
  featurable_widget_id: string | null;
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
  theme_color: "violet",
  color_mode: "system",
  city: null,
  country_code: null,
  latitude: null,
  longitude: null,
  opening_time: null,
  closing_time: null,
  working_days: null,

  iyzico_base_url: null,
  iyzico_api_key: null,
  iyzico_secret_key: null,
  facebook_pixel_id: null,
  facebook_dataset_id: null,
  facebook_access_token: null,
  facebook_verify_token: null,
  instagram_access_token: null,
  instagram_account_id: null,
  ga4_measurement_protocol_secret: null,
  app_base_url: null,
  admin_email: null,
  turinvoice_base_url: null,
  turinvoice_login: null,
  turinvoice_password: null,
  turinvoice_id_tsp: null,
  turinvoice_secret_key: null,
  turinvoice_callback_url: null,
  clarity_project_id: null,
  yandex_webmaster_key: null,
  bing_webmaster_key: null,
  indexnow_api_key: null,
  behold_url: null,
  prodigi_api_key: null,
  prodigi_api_url: null,
  google_ads_webhook_key: null,
  featurable_widget_id: null,
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
        color_mode: data.color_mode || defaultSettings.color_mode,
        city: data.city || defaultSettings.city,
        country_code: data.country_code || defaultSettings.country_code,
        latitude: data.latitude || defaultSettings.latitude,
        longitude: data.longitude || defaultSettings.longitude,
        opening_time: data.opening_time || defaultSettings.opening_time,
        closing_time: data.closing_time || defaultSettings.closing_time,
        working_days: data.working_days || defaultSettings.working_days,

        iyzico_base_url: data.iyzico_base_url || defaultSettings.iyzico_base_url,
        iyzico_api_key: data.iyzico_api_key || defaultSettings.iyzico_api_key,
        iyzico_secret_key: data.iyzico_secret_key || defaultSettings.iyzico_secret_key,
        facebook_pixel_id: data.facebook_pixel_id || defaultSettings.facebook_pixel_id,
        facebook_dataset_id: data.facebook_dataset_id || defaultSettings.facebook_dataset_id,
        facebook_access_token: data.facebook_access_token || defaultSettings.facebook_access_token,
        facebook_verify_token: data.facebook_verify_token || defaultSettings.facebook_verify_token,
        instagram_access_token: data.instagram_access_token || defaultSettings.instagram_access_token,
        instagram_account_id: data.instagram_account_id || defaultSettings.instagram_account_id,
        ga4_measurement_protocol_secret: data.ga4_measurement_protocol_secret || defaultSettings.ga4_measurement_protocol_secret,
        app_base_url: data.app_base_url || defaultSettings.app_base_url,
        admin_email: data.admin_email || defaultSettings.admin_email,
        turinvoice_base_url: data.turinvoice_base_url || defaultSettings.turinvoice_base_url,
        turinvoice_login: data.turinvoice_login || defaultSettings.turinvoice_login,
        turinvoice_password: data.turinvoice_password || defaultSettings.turinvoice_password,
        turinvoice_id_tsp: data.turinvoice_id_tsp || defaultSettings.turinvoice_id_tsp,
        turinvoice_secret_key: data.turinvoice_secret_key || defaultSettings.turinvoice_secret_key,
        turinvoice_callback_url: data.turinvoice_callback_url || defaultSettings.turinvoice_callback_url,
        clarity_project_id: data.clarity_project_id || defaultSettings.clarity_project_id,
        yandex_webmaster_key: data.yandex_webmaster_key || defaultSettings.yandex_webmaster_key,
        bing_webmaster_key: data.bing_webmaster_key || defaultSettings.bing_webmaster_key,
        indexnow_api_key: data.indexnow_api_key || defaultSettings.indexnow_api_key,
        behold_url: data.behold_url || defaultSettings.behold_url,
        prodigi_api_key: data.prodigi_api_key || defaultSettings.prodigi_api_key,
        prodigi_api_url: data.prodigi_api_url || defaultSettings.prodigi_api_url,
        google_ads_webhook_key: data.google_ads_webhook_key || defaultSettings.google_ads_webhook_key,
        featurable_widget_id: data.featurable_widget_id || defaultSettings.featurable_widget_id,
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

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
  resend_audience_id: string | null;
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
  resend_audience_id: null,
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

      const rawData = data as any;

      // Merge fetched data with defaults to ensure all fields exist
      return {
        contact_email: rawData.contact_email || defaultSettings.contact_email,
        contact_phone: rawData.contact_phone || defaultSettings.contact_phone,
        whatsapp_number: rawData.whatsapp_number || defaultSettings.whatsapp_number,
        instagram_url: rawData.instagram_url || defaultSettings.instagram_url,
        facebook_url: rawData.facebook_url || defaultSettings.facebook_url,
        youtube_url: rawData.youtube_url || defaultSettings.youtube_url,
        tiktok_url: rawData.tiktok_url || defaultSettings.tiktok_url,
        logo_url: rawData.logo_url || defaultSettings.logo_url,
        logo_dark_url: rawData.logo_dark_url || defaultSettings.logo_dark_url,
        favicon_url: rawData.favicon_url || defaultSettings.favicon_url,
        address: (rawData.address as Record<string, string>) || defaultSettings.address,
        working_hours: (rawData.working_hours as Record<string, string>) || defaultSettings.working_hours,
        google_analytics_id: rawData.google_analytics_id || defaultSettings.google_analytics_id,
        yandex_metrica_id: rawData.yandex_metrica_id || defaultSettings.yandex_metrica_id,
        resend_api_key: rawData.resend_api_key || defaultSettings.resend_api_key,
        resend_audience_id: rawData.resend_audience_id || defaultSettings.resend_audience_id,
        custom_head_scripts: rawData.custom_head_scripts || defaultSettings.custom_head_scripts,
        custom_body_scripts: rawData.custom_body_scripts || defaultSettings.custom_body_scripts,
        gemini_api_key: rawData.gemini_api_key || defaultSettings.gemini_api_key,
        site_name: rawData.site_name || defaultSettings.site_name,
        site_description: (rawData.site_description as Record<string, string>) || defaultSettings.site_description,

        default_og_image_url: rawData.default_og_image_url || defaultSettings.default_og_image_url,
        organization_name: rawData.organization_name || defaultSettings.organization_name,
        organization_founding_date: rawData.organization_founding_date || defaultSettings.organization_founding_date,
        founder_name: rawData.founder_name || defaultSettings.founder_name,
        founder_image_url: rawData.founder_image_url || defaultSettings.founder_image_url,
        ai_search_config: (rawData.ai_search_config as Record<string, any>) || defaultSettings.ai_search_config,
        theme_color: rawData.theme_color || defaultSettings.theme_color,
        color_mode: rawData.color_mode || defaultSettings.color_mode,
        city: rawData.city || defaultSettings.city,
        country_code: rawData.country_code || defaultSettings.country_code,
        latitude: rawData.latitude || defaultSettings.latitude,
        longitude: rawData.longitude || defaultSettings.longitude,
        opening_time: rawData.opening_time || defaultSettings.opening_time,
        closing_time: rawData.closing_time || defaultSettings.closing_time,
        working_days: rawData.working_days || defaultSettings.working_days,

        iyzico_base_url: rawData.iyzico_base_url || defaultSettings.iyzico_base_url,
        iyzico_api_key: rawData.iyzico_api_key || defaultSettings.iyzico_api_key,
        iyzico_secret_key: rawData.iyzico_secret_key || defaultSettings.iyzico_secret_key,
        facebook_pixel_id: rawData.facebook_pixel_id || defaultSettings.facebook_pixel_id,
        facebook_dataset_id: rawData.facebook_dataset_id || defaultSettings.facebook_dataset_id,
        facebook_access_token: rawData.facebook_access_token || defaultSettings.facebook_access_token,
        facebook_verify_token: rawData.facebook_verify_token || defaultSettings.facebook_verify_token,
        instagram_access_token: rawData.instagram_access_token || defaultSettings.instagram_access_token,
        instagram_account_id: rawData.instagram_account_id || defaultSettings.instagram_account_id,
        ga4_measurement_protocol_secret: rawData.ga4_measurement_protocol_secret || defaultSettings.ga4_measurement_protocol_secret,
        app_base_url: rawData.app_base_url || defaultSettings.app_base_url,
        admin_email: rawData.admin_email || defaultSettings.admin_email,
        turinvoice_base_url: rawData.turinvoice_base_url || defaultSettings.turinvoice_base_url,
        turinvoice_login: rawData.turinvoice_login || defaultSettings.turinvoice_login,
        turinvoice_password: rawData.turinvoice_password || defaultSettings.turinvoice_password,
        turinvoice_id_tsp: rawData.turinvoice_id_tsp || defaultSettings.turinvoice_id_tsp,
        turinvoice_secret_key: rawData.turinvoice_secret_key || defaultSettings.turinvoice_secret_key,
        turinvoice_callback_url: rawData.turinvoice_callback_url || defaultSettings.turinvoice_callback_url,
        clarity_project_id: rawData.clarity_project_id || defaultSettings.clarity_project_id,
        yandex_webmaster_key: rawData.yandex_webmaster_key || defaultSettings.yandex_webmaster_key,
        bing_webmaster_key: rawData.bing_webmaster_key || defaultSettings.bing_webmaster_key,
        indexnow_api_key: rawData.indexnow_api_key || defaultSettings.indexnow_api_key,
        behold_url: rawData.behold_url || defaultSettings.behold_url,
        prodigi_api_key: rawData.prodigi_api_key || defaultSettings.prodigi_api_key,
        prodigi_api_url: rawData.prodigi_api_url || defaultSettings.prodigi_api_url,
        google_ads_webhook_key: rawData.google_ads_webhook_key || defaultSettings.google_ads_webhook_key,
        featurable_widget_id: rawData.featurable_widget_id || defaultSettings.featurable_widget_id,
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

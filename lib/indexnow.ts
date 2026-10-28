import { getBaseUrl } from "./seo-utils";
import { settingsService } from "./settings-service";

/**
 * Submits updated URLs to the IndexNow API (Bing, Yandex, Seznam, Naver).
 * Instantly alerts search engines about new or updated content.
 */
export async function submitToIndexNow(urls: string[]): Promise<{
  success: boolean;
  message?: string;
  statusCode?: number;
}> {
  try {
    const settings = await settingsService.getSettings();
    const apiKey = settings.indexnow_api_key?.trim();

    if (!apiKey) {
      return { success: false, message: "No IndexNow API key configured." };
    }

    const baseUrl = settings.app_base_url || getBaseUrl();
    const host = new URL(baseUrl).hostname;

    // Normalize URLs to fully qualified RFC 3986 percent-encoded absolute URLs
    const fullUrls = urls.map((url) => {
      const full =
        url.startsWith("http://") || url.startsWith("https://")
          ? url
          : `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
      try {
        return encodeURI(decodeURI(full));
      } catch {
        return encodeURI(full);
      }
    });

    const payload = {
      host,
      key: apiKey,
      keyLocation: `${baseUrl}/${apiKey}.txt`,
      urlList: Array.from(new Set(fullUrls)),
    };

    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.status === 202) {
      return {
        success: true,
        statusCode: response.status,
        message: `Successfully submitted ${payload.urlList.length} URLs to IndexNow.`,
      };
    }

    const errText = await response.text().catch(() => "");
    console.warn(
      `IndexNow submission response status: ${response.status}`,
      errText,
    );
    return {
      success: false,
      statusCode: response.status,
      message: `IndexNow responded with status ${response.status}: ${errText}`,
    };
  } catch (error: any) {
    console.error("IndexNow submission error:", error);
    return {
      success: false,
      message: error?.message || "IndexNow network error",
    };
  }
}

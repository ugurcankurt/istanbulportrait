// Global type declarations for Istanbul Portrait

declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js" | "consent",
      targetId: string | Date,
      config?: {
        page_location?: string;
        page_title?: string;
        event_category?: string;
        event_label?: string;
        value?: number;
        non_interaction?: boolean;
        [key: string]: any;
      }
    ) => void;
    
    fbq: (
      command: "track" | "trackCustom" | "init" | "consent",
      eventName: string,
      parameters?: Record<string, unknown>
    ) => void;
    
    _fbq: typeof window.fbq;
    
    dataLayer: any[];
  }
}

export {};
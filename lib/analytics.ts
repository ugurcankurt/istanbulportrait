declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'consent',
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID

export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

export const event = (
  action: string,
  {
    event_category,
    event_label,
    value,
  }: {
    event_category?: string
    event_label?: string
    value?: number
  }
) => {
  if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
    window.gtag('event', action, {
      event_category,
      event_label,
      value,
    })
  }
}

// Custom events for photography business
export const trackBookingEvent = (packageId: string, amount: number) => {
  event('booking_started', {
    event_category: 'engagement',
    event_label: packageId,
    value: amount,
  })
}

export const trackPaymentEvent = (packageId: string, amount: number, status: 'success' | 'failure') => {
  event('payment_completed', {
    event_category: 'ecommerce',
    event_label: `${packageId}_${status}`,
    value: status === 'success' ? amount : 0,
  })
}

export const trackPackageView = (packageId: string) => {
  event('package_view', {
    event_category: 'engagement',
    event_label: packageId,
  })
}

export const trackContactForm = () => {
  event('contact_form_submit', {
    event_category: 'engagement',
    event_label: 'contact_page',
  })
}

export const trackLanguageChange = (language: string) => {
  event('language_change', {
    event_category: 'user_interaction',
    event_label: language,
  })
}

export const trackGalleryView = (imageId?: string) => {
  event('gallery_view', {
    event_category: 'engagement',
    event_label: imageId || 'gallery_page',
  })
}
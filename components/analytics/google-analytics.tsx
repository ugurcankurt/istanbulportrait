'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { GA_TRACKING_ID, pageview } from '@/lib/analytics'

export function GoogleAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!GA_TRACKING_ID) return

    const url = pathname + searchParams.toString()
    pageview(url)
  }, [pathname, searchParams])

  if (!GA_TRACKING_ID || process.env.NODE_ENV !== 'production') {
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script
        strategy="afterInteractive"
        id="google-analytics"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('consent', 'default', {
              'analytics_storage': 'granted',
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'functionality_storage': 'granted',
              'personalization_storage': 'granted',
              'security_storage': 'granted'
            });

            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
              custom_map: {
                'custom_dimension_1': 'package_type',
                'custom_dimension_2': 'user_language'
              }
            });
          `,
        }}
      />
    </>
  )
}

export function CookieConsent() {
  const handleAcceptCookies = () => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted'
      })
    }
    localStorage.setItem('cookie_consent', 'accepted')
    // Hide consent banner
    const banner = document.getElementById('cookie-consent-banner')
    if (banner) banner.style.display = 'none'
  }

  const handleDeclineCookies = () => {
    localStorage.setItem('cookie_consent', 'declined')
    const banner = document.getElementById('cookie-consent-banner')
    if (banner) banner.style.display = 'none'
  }

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (consent) {
      const banner = document.getElementById('cookie-consent-banner')
      if (banner) banner.style.display = 'none'
    }
  }, [])

  return (
    <div
      id="cookie-consent-banner"
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-50"
    >
      <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          <p>
            We use cookies to enhance your browsing experience and analyze our traffic. 
            <a href="/privacy" className="underline hover:text-foreground ml-1">
              Learn more
            </a>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDeclineCookies}
            className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAcceptCookies}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
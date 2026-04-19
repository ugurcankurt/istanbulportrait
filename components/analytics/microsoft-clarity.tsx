"use client";

import Script from "next/script";

export function MicrosoftClarity({ clarityId }: { clarityId?: string | null }) {
  if (!clarityId) {
    console.warn(
      "Microsoft Clarity Project ID not found. Add it dynamically via Supabase Settings Dashboard.",
    );
    return null;
  }

  return (
    <Script
      id="ms-clarity"
      strategy="lazyOnload"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Microsoft Clarity requires inline script
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${clarityId}");
        `,
      }}
    />
  );
}

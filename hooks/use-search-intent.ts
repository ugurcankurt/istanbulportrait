import { useEffect, useState } from 'react';

const INTENT_STORAGE_KEY = 'istanbulportrait_intent_slug';
const QUERY_STORAGE_KEY = 'istanbulportrait_intent_query';

export function useSearchIntent() {
  const [intentSlug, setIntentSlug] = useState<string | null>(null);

  useEffect(() => {
    // 1. First, load existing intent from local storage immediately for fast UI
    const storedSlug = localStorage.getItem(INTENT_STORAGE_KEY);
    const storedQuery = localStorage.getItem(QUERY_STORAGE_KEY);
    if (storedSlug) {
      setIntentSlug(storedSlug);
    }

    // 2. Parse URL parameters for a new query
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      // We look for common marketing & search params
      const query = 
        searchParams.get('q') || 
        searchParams.get('utm_term') || 
        searchParams.get('intent') || 
        searchParams.get('utm_campaign');

      if (query && query !== storedQuery) {
        // We have a new unseen search query! Ask Gemini to resolve it.
        resolveIntent(query);
      }
    }
  }, []);

  const resolveIntent = async (query: string) => {
    try {
      // Temporarily store the query so we don't spam the API on re-renders
      localStorage.setItem(QUERY_STORAGE_KEY, query);

      const res = await fetch('/api/intent-resolver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.slug) {
          localStorage.setItem(INTENT_STORAGE_KEY, data.slug);
          setIntentSlug(data.slug);
        }
      }
    } catch (error) {
      console.error("Failed to resolve user intent", error);
    }
  };

  return { intentSlug };
}

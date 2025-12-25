import { useState, useEffect } from 'react';

export function usePageViews() {
  const [pageViews, setPageViews] = useState(0);

  useEffect(() => {
    // Förhindra dubbelräkning med en session-flagga
    const sessionKey = 'pageViewTracked';
    const hasTracked = sessionStorage.getItem(sessionKey);

    // API URL - använd BASE_URL för att fungera i både dev och prod
    const baseUrl = import.meta.env.BASE_URL || '/pag/';
    const apiUrl = baseUrl + 'api/pageviews.php';

    // AbortController för att kunna avbryta requests
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchPageViews = async (isFirstVisit = false) => {
      try {
        const res = await fetch(apiUrl, {
          method: 'GET',
          signal,
          cache: 'no-cache'
        });

        // Om request misslyckas (404, network error, etc), returnera tyst
        if (!res.ok) {
          return;
        }

        // Kontrollera content-type för att säkerställa att vi får JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return;
        }

        const text = await res.text();
        if (!text || text.trim().startsWith('<')) {
          // Om svaret ser ut som HTML (t.ex. 404-sida), ignorera
          return;
        }

        const data = JSON.parse(text);
        if (data && typeof data.count === 'number') {
          setPageViews(data.count);
          if (isFirstVisit) {
            sessionStorage.setItem(sessionKey, 'true');
          }
        }
      } catch (err) {
        // Ignorera alla fel tyst (inklusive AbortError, JSON parse errors, etc)
        // Inga console errors ska visas
      }
    };

    if (hasTracked) {
      // Redan räknat denna session, bara hämta nuvarande värde
      fetchPageViews(false);
    } else {
      // Öka global räknare första gången i sessionen
      fetchPageViews(true);
    }

    // Cleanup: avbryt request om komponenten unmountas
    return () => {
      controller.abort();
    };
  }, []);

  return pageViews;
}


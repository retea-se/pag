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

    if (hasTracked) {
      // Redan räknat denna session, bara hämta nuvarande värde
      fetch(apiUrl, { method: 'GET' })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          setPageViews(data.count || 0);
        })
        .catch(() => {
          // Tyst fel - visa 0 om API misslyckas
          setPageViews(0);
        });
      return;
    }

    // Öka global räknare första gången i sessionen
    fetch(apiUrl, { method: 'GET' })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setPageViews(data.count || 0);
        sessionStorage.setItem(sessionKey, 'true');
      })
      .catch(() => {
        // Tyst fel - visa 0 om API misslyckas (förhindrar console errors)
        setPageViews(0);
      });
  }, []);

  return pageViews;
}


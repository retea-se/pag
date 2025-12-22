// Stockholm Live API - hämtar events från alla arenor i Globenområdet

const ARENAS = {
  aviciiArena: {
    id: 'avicii-arena',
    name: 'Avicii Arena',
    apiUrl: '/api/avicii/wp-json/wp/v2/events',
    scrapePath: '/api/avicii',
    website: 'https://aviciiarena.se',
    color: '#3b82f6'
  },
  threeArena: {
    id: '3arena',
    name: '3Arena',
    apiUrl: '/api/3arena/wp-json/wp/v2/events',
    scrapePath: '/api/3arena',
    website: 'https://3arena.se',
    color: '#10b981'
  },
  hovet: {
    id: 'hovet',
    name: 'Hovet',
    apiUrl: '/api/hovet/wp-json/wp/v2/events',
    scrapePath: '/api/hovet',
    website: 'https://hovetarena.se',
    color: '#f59e0b'
  },
  annexet: {
    id: 'annexet',
    name: 'Annexet',
    apiUrl: '/api/annexet/wp-json/wp/v2/events',
    scrapePath: '/api/annexet',
    website: 'https://annexet.se',
    color: '#ef4444'
  }
};

const CACHE_KEY = 'globen-events-cache-v4';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minuter

// Event kategorier med ikoner
const CATEGORIES = {
  27: { name: 'Musik/Show', icon: 'music' },
  29: { name: 'Sport', icon: 'sport' },
  30: { name: 'Humor/Samtal', icon: 'mic' },
  35: { name: 'Annat', icon: 'calendar' },
  26: { name: 'Event', icon: 'calendar' }
};

// Svenska månader för datumparsning
const SWEDISH_MONTHS = {
  'januari': 0, 'februari': 1, 'mars': 2, 'april': 3,
  'maj': 4, 'juni': 5, 'juli': 6, 'augusti': 7,
  'september': 8, 'oktober': 9, 'november': 10, 'december': 11
};

// Allowlist för SSRF-skydd
const ALLOWED_DOMAINS = [
  'aviciiarena.se',
  '3arena.se',
  'hovetarena.se',
  'annexet.se'
];

/**
 * Validerar event-URL mot SSRF-skydd
 * @param {string} url - URL att validera
 * @returns {boolean} - true om URL är giltig, false annars
 */
function validateEventUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);

    // Kräv HTTPS
    if (urlObj.protocol !== 'https:') {
      console.warn(`SSRF: Ogiltigt protokoll för ${url} (kräver https:)`);
      return false;
    }

    // Kontrollera hostname mot allowlist
    const hostname = urlObj.hostname.toLowerCase();
    const isAllowed = ALLOWED_DOMAINS.some(domain => {
      return hostname === domain || hostname.endsWith('.' + domain);
    });

    if (!isAllowed) {
      console.warn(`SSRF: Ogiltig hostname för ${url} (${hostname} är inte i allowlist)`);
      return false;
    }

    // Blockera interna IP-intervall
    if (hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
      console.warn(`SSRF: Intern IP/hostname blockerad för ${url}`);
      return false;
    }

    return true;
  } catch (error) {
    console.warn(`SSRF: Ogiltig URL-format för ${url}:`, error.message);
    return false;
  }
}

// Hämta cache från localStorage
function getCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < CACHE_DURATION) {
        return data.events;
      }
    }
  } catch (e) {
    console.warn('Cache read error:', e);
  }
  return null;
}

// Spara till cache
function setCache(events) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      events
    }));
  } catch (e) {
    console.warn('Cache write error:', e);
  }
}

// Parsa HTML-entiteter
function decodeHtml(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

// Parsa svenskt datum (ex: "13 november 2026" eller "13 - 14 november 2026")
function parseSwedishDate(dateStr, defaultYear = new Date().getFullYear()) {
  if (!dateStr) return null;

  const str = dateStr.toLowerCase().trim();

  // Matcha "13 november 2026" eller "13 november"
  const singleMatch = str.match(/(\d{1,2})\s+([a-zåäö]+)(?:\s+(\d{4}))?/);
  if (singleMatch) {
    const day = parseInt(singleMatch[1]);
    const month = SWEDISH_MONTHS[singleMatch[2]];
    const year = singleMatch[3] ? parseInt(singleMatch[3]) : defaultYear;

    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }

  return null;
}

// Parsa tid (ex: "19:30" eller "kl. 19:30")
function parseTime(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2})[:.:](\d{2})/);
  if (match) {
    return { hours: parseInt(match[1]), minutes: parseInt(match[2]) };
  }
  return null;
}

// Scrapa eventdetaljer från eventsida
async function scrapeEventDetails(event, arena) {
  try {
    // SSRF-validering av original-URL
    if (!validateEventUrl(event.link)) {
      console.warn(`SSRF: Blockerad URL: ${event.link}`);
      return null;
    }

    // Bygg proxy-URL för eventsidan
    const eventPath = event.link.replace(arena.website, '');
    const proxyUrl = `${arena.scrapePath}${eventPath}`;

    const response = await fetch(proxyUrl);
    if (!response.ok) return null;

    const html = await response.text();

    // Sök efter datum i olika format
    let eventDate = null;
    let eventTime = null;

    // Leta efter datum i formatet "13 november 2026" eller liknande
    const datePatterns = [
      /(\d{1,2})\s*([-–])\s*(\d{1,2})?\s*([a-zåäö]+)\s*(\d{4})/gi,
      /(\d{1,2})\s+([a-zåäö]+)\s+(\d{4})/gi,
      /(\d{1,2})\s+([a-zåäö]+)/gi
    ];

    for (const pattern of datePatterns) {
      const match = html.match(pattern);
      if (match && match[0]) {
        eventDate = parseSwedishDate(match[0]);
        if (eventDate) break;
      }
    }

    // Leta efter tid
    const timeMatch = html.match(/(?:showstart|kl\.?|tid:?)\s*(\d{1,2}[:.]\d{2})/i);
    if (timeMatch) {
      eventTime = parseTime(timeMatch[1]);
    }

    // Kombinera datum och tid
    if (eventDate && eventTime) {
      eventDate.setHours(eventTime.hours, eventTime.minutes);
    }

    return {
      eventDate,
      eventTime: eventTime ? `${String(eventTime.hours).padStart(2, '0')}:${String(eventTime.minutes).padStart(2, '0')}` : null
    };
  } catch (error) {
    console.warn(`Could not scrape ${event.title}:`, error.message);
    return null;
  }
}

// Hämta events från en arena
async function fetchArenaEvents(arena, scrapeDetails = false) {
  try {
    const response = await fetch(`${arena.apiUrl}?per_page=100`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const events = await response.json();

    const mappedEvents = events
      .map(event => ({
        id: `${arena.id}-${event.id}`,
        title: decodeHtml(event.title?.rendered || ''),
        arena: arena.name,
        arenaId: arena.id,
        arenaColor: arena.color,
        link: event.link,
        category: event.events_category?.[0] || 26,
        categoryName: CATEGORIES[event.events_category?.[0]]?.name || 'Event',
        categoryIcon: CATEGORIES[event.events_category?.[0]]?.icon || 'calendar',
        slug: event.slug,
        eventDate: null,
        eventTime: null,
        publishedDate: event.date ? new Date(event.date) : null
      }))
      // Filtrera bort Premium, Clubhouse, The 1989 (tilläggstjänster)
      .filter(event => {
        const title = event.title.toLowerCase();
        return !title.includes('clubhouse') &&
               !title.includes('premium') &&
               title !== 'the 1989';
      });

    // Scrapa detaljer för varje event om efterfrågat
    if (scrapeDetails) {
      for (const event of mappedEvents) {
        const details = await scrapeEventDetails(event, arena);
        if (details) {
          event.eventDate = details.eventDate;
          event.eventTime = details.eventTime;
        }
        // Liten delay
        await new Promise(r => setTimeout(r, 50));
      }
    }

    return mappedEvents;
  } catch (error) {
    console.error(`Error fetching ${arena.name}:`, error);
    return [];
  }
}

// Hämta events från statisk JSON-fil (genererad av bakgrundsskript)
async function fetchStaticEvents() {
  try {
    // Använd import.meta.env.BASE_URL för korrekt sökväg i Vite
    const baseUrl = import.meta.env.BASE_URL || '/';
    const response = await fetch(`${baseUrl}events.json`);
    if (!response.ok) return null;

    const data = await response.json();
    console.log(`Loaded ${data.eventCount} events from static file (updated: ${data.lastUpdated})`);
    return data.events;
  } catch (error) {
    console.warn('Could not load static events:', error);
    return null;
  }
}

// Hämta alla events från alla arenor
export async function fetchAllEvents(forceRefresh = false, scrapeDetails = false) {
  // Kolla localStorage cache först
  if (!forceRefresh) {
    const cached = getCache();
    if (cached) {
      console.log('Using cached events');
      return cached;
    }
  }

  // Försök ladda från statisk JSON-fil (snabbast)
  const staticEvents = await fetchStaticEvents();
  if (staticEvents && staticEvents.length > 0) {
    setCache(staticEvents);
    return staticEvents;
  }

  // Fallback: hämta live från API (långsammare)
  console.log('Fetching fresh events from Stockholm Live...');

  const allEvents = [];

  for (const [key, arena] of Object.entries(ARENAS)) {
    const events = await fetchArenaEvents(arena, scrapeDetails);
    allEvents.push(...events);
    await new Promise(r => setTimeout(r, 100));
  }

  // Sortera efter eventdatum (events utan datum sist)
  allEvents.sort((a, b) => {
    if (a.eventDate && b.eventDate) {
      return a.eventDate - b.eventDate;
    }
    if (a.eventDate) return -1;
    if (b.eventDate) return 1;
    return a.title.localeCompare(b.title, 'sv');
  });

  // Spara till cache
  setCache(allEvents);

  return allEvents;
}

// Filtrera events efter datumperiod
export function filterEventsByPeriod(events, period) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return events.filter(event => {
    if (!event.eventDate) {
      // Events utan datum visas bara i "kommande"
      return period === 'upcoming' || period === 'all';
    }

    const eventDay = new Date(event.eventDate.getFullYear(), event.eventDate.getMonth(), event.eventDate.getDate());

    switch (period) {
      case 'yesterday':
        return eventDay.getTime() === yesterday.getTime();
      case 'today':
        return eventDay.getTime() === today.getTime();
      case 'tomorrow':
        return eventDay.getTime() === tomorrow.getTime();
      case 'week':
        return eventDay >= today && eventDay < weekEnd;
      case 'upcoming':
        return eventDay >= today;
      case 'all':
      default:
        return true;
    }
  });
}

// Gruppera events efter tid på dagen
export function groupEventsByTimeOfDay(events) {
  const groups = {
    morning: { label: 'Förmiddag', events: [] },
    afternoon: { label: 'Eftermiddag', events: [] },
    evening: { label: 'Kväll', events: [] },
    night: { label: 'Natt', events: [] },
    unknown: { label: 'Tid ej angiven', events: [] }
  };

  events.forEach(event => {
    if (!event.eventTime) {
      groups.unknown.events.push(event);
      return;
    }

    const hour = parseInt(event.eventTime.split(':')[0]);

    if (hour < 12) {
      groups.morning.events.push(event);
    } else if (hour < 17) {
      groups.afternoon.events.push(event);
    } else if (hour < 21) {
      groups.evening.events.push(event);
    } else {
      groups.night.events.push(event);
    }
  });

  return Object.entries(groups)
    .filter(([key, group]) => group.events.length > 0)
    .map(([key, group]) => group);
}

// Gruppera events efter datum eller tid
export function groupEventsByDate(events, byDate = false) {
  if (!byDate) {
    return groupEventsByTimeOfDay(events);
  }

  // Gruppera efter månad/år för kommande events
  const groups = {};
  const noDateEvents = [];

  events.forEach(event => {
    if (!event.eventDate) {
      noDateEvents.push(event);
      return;
    }

    const date = new Date(event.eventDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });

    if (!groups[monthKey]) {
      groups[monthKey] = { label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1), events: [] };
    }
    groups[monthKey].events.push(event);
  });

  // Sortera månader kronologiskt
  const sortedGroups = Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, group]) => group);

  // Lägg till events utan datum sist
  if (noDateEvents.length > 0) {
    sortedGroups.push({ label: 'Datum ej angivet', events: noDateEvents });
  }

  return sortedGroups;
}

// Generera RSS XML
export function generateRSS(events, baseUrl = 'https://mackan.eu/pag') {
  const now = new Date().toUTCString();

  const items = events
    .filter(e => e.eventDate)
    .slice(0, 50)
    .map(event => {
      const dateStr = event.eventDate ? event.eventDate.toLocaleDateString('sv-SE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : '';
      const timeStr = event.eventTime || '';

      return `
    <item>
      <title><![CDATA[${event.title} - ${event.arena}]]></title>
      <link>${event.link}</link>
      <guid isPermaLink="false">${event.id}</guid>
      <pubDate>${event.eventDate ? event.eventDate.toUTCString() : now}</pubDate>
      <description><![CDATA[${dateStr}${timeStr ? ' kl. ' + timeStr : ''} på ${event.arena}. Kategori: ${event.categoryName}]]></description>
      <category>${event.categoryName}</category>
    </item>`;
    }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>På G i Globen-området</title>
    <link>${baseUrl}</link>
    <description>Evenemang på Avicii Arena, 3Arena, Hovet och Annexet</description>
    <language>sv</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
}

// Exportera konstanter
export { ARENAS, CATEGORIES };

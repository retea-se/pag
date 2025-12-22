#!/usr/bin/env node
/**
 * Bakgrundsskript för att hämta och cacha evenemang från Stockholm Live
 * Hybrid-lösning: Scraping + Ticketmaster API för bättre datumkvalitet
 *
 * Kör via cron/scheduled task: node scripts/fetch-events.js
 * Rekommenderat: Varje timme eller 2-4 gånger per dygn
 */
/* eslint-env node */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import pLimit from 'p-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ladda miljövariabler från .env
config({ path: path.join(__dirname, '..', '.env') });

const TICKETMASTER_KEY = process.env.TICKETMASTER_KEY || '';

// Konfiguration från miljövariabler
const FETCH_TIMEOUT_MS = parseInt(process.env.FETCH_TIMEOUT_MS || '10000', 10);
const MAX_RUNTIME_MS = parseInt(process.env.MAX_RUNTIME_MS || '300000', 10); // 5 minuter
const MAX_PARALLEL_SCRAPES = parseInt(process.env.MAX_PARALLEL_SCRAPES || '5', 10);
const MAX_RETRIES = 2;

const ARENAS = {
  aviciiArena: {
    id: 'avicii-arena',
    name: 'Avicii Arena',
    apiUrl: 'https://aviciiarena.se/wp-json/wp/v2/events?per_page=100',
    website: 'https://aviciiarena.se',
    color: '#3b82f6',
    ticketmasterVenueIds: ['Z7r9jZaA6X', 'KovZ917Adl7'] // Avicii Arena + GLOBEN
  },
  threeArena: {
    id: '3arena',
    name: '3Arena',
    apiUrl: 'https://3arena.se/wp-json/wp/v2/events?per_page=100',
    website: 'https://3arena.se',
    color: '#10b981',
    ticketmasterVenueIds: []
  },
  hovet: {
    id: 'hovet',
    name: 'Hovet',
    apiUrl: 'https://hovetarena.se/wp-json/wp/v2/events?per_page=100',
    website: 'https://hovetarena.se',
    color: '#f59e0b',
    ticketmasterVenueIds: ['Z698xZq2Za7wK', 'Z598xZq2ZevA1', 'Z598xZq2Zevk7', 'ZFr9jZ1kFk']
  },
  annexet: {
    id: 'annexet',
    name: 'Annexet',
    apiUrl: 'https://annexet.se/wp-json/wp/v2/events?per_page=100',
    website: 'https://annexet.se',
    color: '#ef4444',
    ticketmasterVenueIds: ['Za98xZq2Za1']
  }
};

const CATEGORIES = {
  27: { name: 'Musik/Show', icon: 'music' },
  29: { name: 'Sport', icon: 'sport' },
  30: { name: 'Humor/Samtal', icon: 'mic' },
  35: { name: 'Annat', icon: 'calendar' },
  26: { name: 'Event', icon: 'calendar' }
};

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
      console.warn(`  SSRF: Ogiltigt protokoll för ${url} (kräver https:)`);
      return false;
    }

    // Kontrollera hostname mot allowlist
    const hostname = urlObj.hostname.toLowerCase();
    const isAllowed = ALLOWED_DOMAINS.some(domain => {
      return hostname === domain || hostname.endsWith('.' + domain);
    });

    if (!isAllowed) {
      console.warn(`  SSRF: Ogiltig hostname för ${url} (${hostname} är inte i allowlist)`);
      return false;
    }

    // Blockera interna IP-intervall
    if (hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname.startsWith('172.17.') ||
        hostname.startsWith('172.18.') ||
        hostname.startsWith('172.19.') ||
        hostname.startsWith('172.20.') ||
        hostname.startsWith('172.21.') ||
        hostname.startsWith('172.22.') ||
        hostname.startsWith('172.23.') ||
        hostname.startsWith('172.24.') ||
        hostname.startsWith('172.25.') ||
        hostname.startsWith('172.26.') ||
        hostname.startsWith('172.27.') ||
        hostname.startsWith('172.28.') ||
        hostname.startsWith('172.29.') ||
        hostname.startsWith('172.30.') ||
        hostname.startsWith('172.31.')) {
      console.warn(`  SSRF: Intern IP/hostname blockerad för ${url}`);
      return false;
    }

    return true;
  } catch (error) {
    console.warn(`  SSRF: Ogiltig URL-format för ${url}:`, error.message);
    return false;
  }
}

function fetch(url, timeoutMs = FETCH_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    let timeoutId;
    let completed = false;

    const req = https.get(url, { headers: { 'User-Agent': 'GlobenEvents/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (completed) return;
        completed = true;
        clearTimeout(timeoutId);
        try {
          resolve({
            ok: res.statusCode === 200,
            text: () => data,
            json: () => JSON.parse(data)
          });
        } catch (parseError) {
          console.error(`  JSON parse error for ${url}:`, parseError.message);
          reject(new Error(`JSON parse error: ${parseError.message}`));
        }
      });
    });

    req.on('error', (error) => {
      if (completed) return;
      completed = true;
      clearTimeout(timeoutId);
      if (error.code === 'ECONNRESET' || error.message.includes('timeout')) {
        console.error(`  Request timeout for ${url} (${timeoutMs}ms)`);
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      } else {
        reject(error);
      }
    });

    // Timeout handling
    timeoutId = setTimeout(() => {
      if (completed) return;
      completed = true;
      req.destroy();
      console.error(`  Request timeout for ${url} (${timeoutMs}ms)`);
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

function decodeHtml(html) {
  return html
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

function parseSwedishDate(dateStr) {
  if (!dateStr) return null;
  const str = dateStr.toLowerCase().trim();

  // Matcha "fredag 13 november 2026" eller "13 november 2026"
  const match = str.match(/(\d{1,2})\s+([a-zåäö]+)\s+(\d{4})/);
  if (match) {
    const day = parseInt(match[1]);
    const month = SWEDISH_MONTHS[match[2]];
    const year = parseInt(match[3]);
    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }
  return null;
}

function parseTime(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2})[.:](\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  return null;
}

/**
 * Scrapar ALLA datum och tider från en eventsida med retry-logik
 * Returnerar en array av performances: [{ date: Date, time: "HH:MM" }, ...]
 */
async function scrapeEventDetails(eventUrl, retries = MAX_RETRIES) {
  // SSRF-validering
  if (!validateEventUrl(eventUrl)) {
    console.warn(`  SSRF: Blockerad URL: ${eventUrl}`);
    return { performances: [] };
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 1s, 2s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(r => setTimeout(r, delay));
      }

      const response = await fetch(eventUrl);
      if (!response.ok) {
        if (attempt < retries && response.ok === false) {
          continue; // Retry on non-200 status
        }
        return { performances: [] };
      }

      const html = await response.text();
      const performances = [];

      // Splitta HTML vid varje <li> för att hantera inline HTML
      // Format: <li><div class="date"><span><strong>Fredag 9 januari 2026</span></strong></div>
      //         <div class="item"><span class="time">15:00</span></div>...</li>
      const liParts = html.split(/<li>/i);

      for (const liContent of liParts) {
        // Hitta datum i denna <li>-del
        const dateMatch = liContent.match(/<div class="date"[^>]*>.*?<strong>([^<]*\d{1,2}\s+[a-zåäö]+\s+\d{4})/i);

        if (!dateMatch) continue;

        const dateText = dateMatch[1];
        const eventDate = parseSwedishDate(dateText);

        if (!eventDate) continue;

        // Begränsa sökningen till innan nästa </li>
        const liEnd = liContent.indexOf('</li>');
        const liSection = liEnd > 0 ? liContent.substring(0, liEnd) : liContent;

        // Hitta alla tider inom detta <li>-element
        const timeRegex = /<span class="time">(\d{1,2}[.:]\d{2})<\/span>/gi;
        let timeMatch;
        let foundTimes = false;

        while ((timeMatch = timeRegex.exec(liSection)) !== null) {
          const time = parseTime(timeMatch[1]);
          if (time) {
            const dateWithTime = new Date(eventDate);
            const [hours, minutes] = time.split(':').map(Number);
            dateWithTime.setHours(hours, minutes, 0, 0);

            performances.push({
              date: dateWithTime,
              time: time
            });
            foundTimes = true;
          }
        }

        // Om inga tider hittades, lägg till datumet utan tid
        if (!foundTimes) {
          performances.push({
            date: new Date(eventDate),
            time: null
          });
        }
      }

      // Fallback: Om vi inte hittade strukturerade datum, försök med enklare regex
      if (performances.length === 0) {
        const dateMatches = html.match(/<strong>([^<]*\d{1,2}\s+[a-zåäö]+\s+\d{4})[^<]*<\/strong>/gi);

        if (dateMatches && dateMatches.length > 0) {
          for (const match of dateMatches) {
            const dateText = match.replace(/<\/?strong>/gi, '').replace(/<\/?span>/gi, '');
            const eventDate = parseSwedishDate(dateText);
            if (eventDate) {
              // Försök hitta tid nära detta datum
              const timeMatch = html.match(/(?:showstart|kl\.?)\s*(\d{1,2}[.:]\d{2})/i);
              const time = timeMatch ? parseTime(timeMatch[1]) : null;

              if (time) {
                const [hours, minutes] = time.split(':').map(Number);
                eventDate.setHours(hours, minutes, 0, 0);
              }

              performances.push({
                date: eventDate,
                time: time
              });
              break; // Ta bara första i fallback-läge
            }
          }
        }
      }

      return { performances };
    } catch (error) {
      if (attempt < retries) {
        console.warn(`  Scrape-fel (försök ${attempt + 1}/${retries + 1}): ${eventUrl} - ${error.message}`);
        continue;
      }
      console.warn(`  Kunde inte scrapa efter ${retries + 1} försök: ${eventUrl} - ${error.message}`);
      return { performances: [] };
    }
  }
  return { performances: [] };
}

/**
 * Hämtar events från Ticketmaster API för matchning
 * (För närvarande inte använd, kan aktiveras i framtiden)
 */
// eslint-disable-next-line no-unused-vars
async function fetchTicketmasterEvents(keyword, venueIds) {
  if (!TICKETMASTER_KEY || venueIds.length === 0) return [];

  try {
    const venueParam = venueIds.join(',');
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_KEY}&venueId=${venueParam}&size=100&countryCode=SE`;

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data._embedded?.events) return [];

    return data._embedded.events.map(event => ({
      name: event.name,
      date: event.dates?.start?.dateTime || event.dates?.start?.localDate,
      time: event.dates?.start?.localTime,
      venue: event._embedded?.venues?.[0]?.name
    }));
  } catch (error) {
    console.warn('  Ticketmaster API-fel:', error.message);
    return [];
  }
}

async function fetchArenaEvents(arenaKey, arena) {
  console.log(`Hämtar events från ${arena.name}...`);

  try {
    const response = await fetch(arena.apiUrl);
    if (!response.ok) {
      console.error(`  API-fel för ${arena.name}`);
      return [];
    }

    const events = await response.json();
    console.log(`  Hittade ${events.length} events från API`);

    // Filtrera bort Premium, Clubhouse etc
    const validEvents = events.filter(event => {
      const title = decodeHtml(event.title?.rendered || '');
      return !title.match(/^(Premium|The 1989)$/i) &&
             !title.toLowerCase().includes('clubhouse') &&
             !title.toLowerCase().includes('premium lounge');
    });

    console.log(`  Scrapar ${validEvents.length} events (parallellt, max ${MAX_PARALLEL_SCRAPES} samtidigt)...`);

    // Skapa limit för parallellism
    const limit = pLimit(MAX_PARALLEL_SCRAPES);
    const errorQueue = [];

    // Scrapa alla events parallellt
    const scrapePromises = validEvents.map((event) => {
      return limit(async () => {
        const title = decodeHtml(event.title?.rendered || '');
        try {
          const details = await scrapeEventDetails(event.link);
          const performances = details?.performances || [];

          if (performances.length > 0) {
            return {
              success: true,
              event,
              title,
              performances
            };
          } else {
            return {
              success: true,
              event,
              title,
              performances: []
            };
          }
        } catch (error) {
          errorQueue.push({
            event: title,
            url: event.link,
            error: error.message
          });
          return {
            success: false,
            event,
            title,
            performances: []
          };
        }
      });
    });

    const results = await Promise.all(scrapePromises);

    // Bygg mapped events från resultat
    const mappedEvents = [];
    for (const result of results) {
      if (!result.success) continue;

      const { event, title, performances } = result;

      if (performances.length > 0) {
        // Skapa en entry för varje föreställning
        for (let j = 0; j < performances.length; j++) {
          const perf = performances[j];
          mappedEvents.push({
            id: `${arena.id}-${event.id}${performances.length > 1 ? `-${j + 1}` : ''}`,
            title,
            arena: arena.name,
            arenaId: arena.id,
            arenaColor: arena.color,
            link: event.link,
            category: event.events_category?.[0] || 26,
            categoryName: CATEGORIES[event.events_category?.[0]]?.name || 'Event',
            categoryIcon: CATEGORIES[event.events_category?.[0]]?.icon || 'calendar',
            slug: event.slug,
            eventDate: perf.date?.toISOString() || null,
            eventTime: perf.time || null,
            performanceNumber: performances.length > 1 ? j + 1 : null,
            totalPerformances: performances.length > 1 ? performances.length : null
          });
        }
      } else {
        // Lägg till utan datum
        mappedEvents.push({
          id: `${arena.id}-${event.id}`,
          title,
          arena: arena.name,
          arenaId: arena.id,
          arenaColor: arena.color,
          link: event.link,
          category: event.events_category?.[0] || 26,
          categoryName: CATEGORIES[event.events_category?.[0]]?.name || 'Event',
          categoryIcon: CATEGORIES[event.events_category?.[0]]?.icon || 'calendar',
          slug: event.slug,
          eventDate: null,
          eventTime: null
        });
      }
    }

    // Rapportera fel om några
    if (errorQueue.length > 0) {
      console.warn(`  ${errorQueue.length} event misslyckades vid scraping:`);
      for (const err of errorQueue.slice(0, 5)) {
        console.warn(`    - ${err.event}: ${err.error}`);
      }
      if (errorQueue.length > 5) {
        console.warn(`    ... och ${errorQueue.length - 5} till`);
      }
    }

    console.log(`  ✓ Klar: ${mappedEvents.length} event-tillfällen (${errorQueue.length} misslyckade)`);

    return { events: mappedEvents, errors: errorQueue.length };
  } catch (error) {
    console.error(`  Fel vid hämtning från ${arena.name}:`, error.message);
    return { events: [], errors: 0, critical: true };
  }
}

// Filtrera events efter period
function filterEventsByPeriod(events, period) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return events.filter(event => {
    if (!event.eventDate) {
      return period === 'upcoming';
    }

    const eventDay = new Date(event.eventDate);
    const eventDayOnly = new Date(eventDay.getFullYear(), eventDay.getMonth(), eventDay.getDate());

    switch (period) {
      case 'today':
        return eventDayOnly.getTime() === today.getTime();
      case 'tomorrow':
        return eventDayOnly.getTime() === tomorrow.getTime();
      case 'week':
        return eventDayOnly >= today && eventDayOnly < weekEnd;
      case 'upcoming':
      default:
        return eventDayOnly >= today;
    }
  });
}

// Generera RSS XML
function generateRSS(events, title, description, feedUrl) {
  const now = new Date().toUTCString();
  const baseUrl = 'https://mackan.eu/pag';

  const items = events
    .slice(0, 100)
    .map(event => {
      const eventDate = event.eventDate ? new Date(event.eventDate) : null;
      const dateStr = eventDate ? eventDate.toLocaleDateString('sv-SE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'Datum ej angivet';
      const timeStr = event.eventTime || '';

      // Lägg till föreställningsnummer i titeln för multi-show events
      let titleSuffix = '';
      if (event.totalPerformances > 1) {
        titleSuffix = ` (${event.performanceNumber}/${event.totalPerformances})`;
      }

      return `
    <item>
      <title><![CDATA[${event.title}${titleSuffix} - ${event.arena}]]></title>
      <link>${event.link}</link>
      <guid isPermaLink="false">${event.id}</guid>
      <pubDate>${eventDate ? eventDate.toUTCString() : now}</pubDate>
      <description><![CDATA[${dateStr}${timeStr ? ' kl. ' + timeStr : ''} på ${event.arena}. Kategori: ${event.categoryName}]]></description>
      <category>${event.categoryName}</category>
    </item>`;
    }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${title}</title>
    <link>${baseUrl}</link>
    <description>${description}</description>
    <language>sv</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
}

async function main() {
  console.log('='.repeat(50));
  console.log('Globen Events - Datahämtning');
  console.log('Startar:', new Date().toLocaleString('sv-SE'));
  console.log('='.repeat(50));

  // Global timeout för hela körningen
  const maxRuntimePromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Max runtime exceeded (${MAX_RUNTIME_MS}ms)`));
    }, MAX_RUNTIME_MS);
  });

  let totalErrors = 0;
  let criticalErrors = 0;

  const runScript = async () => {
    const allEvents = [];

    for (const [key, arena] of Object.entries(ARENAS)) {
      try {
        const result = await fetchArenaEvents(key, arena);
        if (result.critical) {
          criticalErrors++;
        } else {
          allEvents.push(...result.events);
          totalErrors += result.errors;
        }
        console.log('');
      } catch (error) {
        criticalErrors++;
        console.error(`  KRITISKT FEL för ${arena.name}:`, error.message);
      }
    }

    // Filtrera bort dubbletter baserat på id (inkluderar datum/tid för multi-show events)
  const seen = new Set();
  const uniqueEvents = allEvents.filter(e => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  // Sortera: events med datum först (kronologiskt), sedan utan datum (alfabetiskt)
  uniqueEvents.sort((a, b) => {
    if (a.eventDate && b.eventDate) {
      return new Date(a.eventDate) - new Date(b.eventDate);
    }
    if (a.eventDate) return -1;
    if (b.eventDate) return 1;
    return a.title.localeCompare(b.title, 'sv');
  });

  // Skapa output
  const output = {
    lastUpdated: new Date().toISOString(),
    eventCount: uniqueEvents.length,
    events: uniqueEvents
  };

  const publicDir = path.join(__dirname, '..', 'public');

  // Spara till public/events.json
  const outputPath = path.join(publicDir, 'events.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

  // Generera RSS-filer för olika perioder
  const rssFeeds = [
    { period: 'today', title: 'På G - Idag', desc: 'Evenemang i Globenområdet idag', file: 'rss-today.xml' },
    { period: 'tomorrow', title: 'På G - Imorgon', desc: 'Evenemang i Globenområdet imorgon', file: 'rss-tomorrow.xml' },
    { period: 'week', title: 'På G - Denna vecka', desc: 'Evenemang i Globenområdet denna vecka', file: 'rss-week.xml' },
    { period: 'upcoming', title: 'På G - Kommande', desc: 'Kommande evenemang i Globenområdet', file: 'rss-upcoming.xml' }
  ];

  console.log('\nGenererar RSS-filer...');
  for (const feed of rssFeeds) {
    const filtered = filterEventsByPeriod(uniqueEvents, feed.period);
    const rss = generateRSS(filtered, feed.title, feed.desc, `https://mackan.eu/pag/${feed.file}`);
    const rssPath = path.join(publicDir, feed.file);
    fs.writeFileSync(rssPath, rss, 'utf8');
    console.log(`  ${feed.file}: ${filtered.length} events`);
  }

  console.log('='.repeat(50));
  console.log(`Klart! Sparade ${uniqueEvents.length} event-tillfällen`);
  console.log(`Fil: ${outputPath}`);
  console.log('='.repeat(50));

  // Statistik
  const withDate = uniqueEvents.filter(e => e.eventDate).length;
  const withoutDate = uniqueEvents.length - withDate;
  const multiShowEvents = uniqueEvents.filter(e => e.totalPerformances > 1);
  const uniqueTitles = new Set(uniqueEvents.map(e => e.title)).size;

  console.log(`Unika event-titlar: ${uniqueTitles}`);
  console.log(`Totalt antal föreställningar: ${uniqueEvents.length}`);
  console.log(`Med datum: ${withDate}`);
  console.log(`Utan datum: ${withoutDate}`);

  if (multiShowEvents.length > 0) {
    console.log(`\nFlerföreställnings-events:`);
    const multiShowTitles = [...new Set(multiShowEvents.map(e => e.title))];
    for (const title of multiShowTitles.slice(0, 5)) {
      const count = multiShowEvents.filter(e => e.title === title).length;
      console.log(`  ${title.substring(0, 40)}: ${count} föreställningar`);
    }
    if (multiShowTitles.length > 5) {
      console.log(`  ... och ${multiShowTitles.length - 5} till`);
    }
  }

    // Per arena
    console.log('\nPer arena:');
    for (const arena of Object.values(ARENAS)) {
      const count = uniqueEvents.filter(e => e.arenaId === arena.id).length;
      console.log(`  ${arena.name}: ${count}`);
    }
  };

  try {
    await Promise.race([runScript(), maxRuntimePromise]);

    // Exit codes: 0 = success, 1 = critical error, 2 = partial failure
    if (criticalErrors > 0) {
      console.error('\n' + '='.repeat(50));
      console.error(`KRITISKT: ${criticalErrors} arena(er) misslyckades`);
      console.error('='.repeat(50));
      process.exit(1);
    } else if (totalErrors > 0) {
      console.log('\n' + '='.repeat(50));
      console.log(`VARNING: ${totalErrors} event misslyckades, men körningen slutfördes`);
      console.log('='.repeat(50));
      process.exit(2);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error('KRITISKT FEL:', error.message);
    console.error('='.repeat(50));
    process.exit(1);
  }
}

main();

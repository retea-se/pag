#!/usr/bin/env node
/**
 * Bakgrundsskript för att hämta och cacha evenemang från Stockholm Live
 * Kör via cron/scheduled task: node scripts/fetch-events.js
 * Rekommenderat: Varje timme eller 2-4 gånger per dygn
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARENAS = {
  aviciiArena: {
    id: 'avicii-arena',
    name: 'Avicii Arena',
    apiUrl: 'https://aviciiarena.se/wp-json/wp/v2/events?per_page=100',
    website: 'https://aviciiarena.se',
    color: '#3b82f6'
  },
  threeArena: {
    id: '3arena',
    name: '3Arena',
    apiUrl: 'https://3arena.se/wp-json/wp/v2/events?per_page=100',
    website: 'https://3arena.se',
    color: '#10b981'
  },
  hovet: {
    id: 'hovet',
    name: 'Hovet',
    apiUrl: 'https://hovetarena.se/wp-json/wp/v2/events?per_page=100',
    website: 'https://hovetarena.se',
    color: '#f59e0b'
  },
  annexet: {
    id: 'annexet',
    name: 'Annexet',
    apiUrl: 'https://annexet.se/wp-json/wp/v2/events?per_page=100',
    website: 'https://annexet.se',
    color: '#ef4444'
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

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'GlobenEvents/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ ok: res.statusCode === 200, text: () => data, json: () => JSON.parse(data) }));
    }).on('error', reject);
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

async function scrapeEventDetails(eventUrl) {
  try {
    const response = await fetch(eventUrl);
    if (!response.ok) return null;

    const html = await response.text();

    // Hitta "Datum & tider" sektionen
    // Leta efter datum i <strong> taggar
    const dateMatches = html.match(/<strong>([^<]*\d{1,2}\s+[a-zåäö]+\s+\d{4})[^<]*<\/strong>/gi);

    let eventDate = null;
    let eventTime = null;

    if (dateMatches && dateMatches.length > 0) {
      // Ta första datumet
      const dateText = dateMatches[0].replace(/<\/?strong>/gi, '');
      eventDate = parseSwedishDate(dateText);
    }

    // Leta efter tid (Showstart eller kl.)
    const timeMatch = html.match(/(?:showstart|kl\.?)\s*(\d{1,2}[.:]\d{2})/i);
    if (timeMatch) {
      eventTime = parseTime(timeMatch[1]);
    }

    // Om vi hittade datum och tid, kombinera
    if (eventDate && eventTime) {
      const [hours, minutes] = eventTime.split(':').map(Number);
      eventDate.setHours(hours, minutes, 0, 0);
    }

    return { eventDate, eventTime };
  } catch (error) {
    console.warn(`  Kunde inte scrapa: ${eventUrl}`);
    return null;
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
    console.log(`  Hittade ${events.length} events`);

    const mappedEvents = [];

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const title = decodeHtml(event.title?.rendered || '');

      // Skippa "Premium", "Clubhouse", etc (underpaket och tillägg)
      if (title.match(/^(Premium|The 1989)$/i) ||
          title.toLowerCase().includes('clubhouse') ||
          title.toLowerCase().includes('premium lounge')) {
        continue;
      }

      process.stdout.write(`  Scrapar ${i + 1}/${events.length}: ${title.substring(0, 40)}...`);

      // Scrapa datum från eventsidan
      const details = await scrapeEventDetails(event.link);

      if (details?.eventDate) {
        process.stdout.write(` ✓ ${details.eventDate.toLocaleDateString('sv-SE')}\n`);
      } else {
        process.stdout.write(` (inget datum)\n`);
      }

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
        eventDate: details?.eventDate?.toISOString() || null,
        eventTime: details?.eventTime || null
      });

      // Liten delay för att inte överbelasta
      await new Promise(r => setTimeout(r, 200));
    }

    return mappedEvents;
  } catch (error) {
    console.error(`  Fel vid hämtning från ${arena.name}:`, error.message);
    return [];
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
  const baseUrl = 'https://pag.example.com';

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

      return `
    <item>
      <title><![CDATA[${event.title} - ${event.arena}]]></title>
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

  const allEvents = [];

  for (const [key, arena] of Object.entries(ARENAS)) {
    const events = await fetchArenaEvents(key, arena);
    allEvents.push(...events);
    console.log('');
  }

  // Filtrera bort dubbletter baserat på titel + arena
  const seen = new Set();
  const uniqueEvents = allEvents.filter(e => {
    const key = `${e.title}-${e.arenaId}`;
    if (seen.has(key)) return false;
    seen.add(key);
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
    const rss = generateRSS(filtered, feed.title, feed.desc, `/pag/${feed.file}`);
    const rssPath = path.join(publicDir, feed.file);
    fs.writeFileSync(rssPath, rss, 'utf8');
    console.log(`  ${feed.file}: ${filtered.length} events`);
  }

  console.log('='.repeat(50));
  console.log(`Klart! Sparade ${uniqueEvents.length} unika events`);
  console.log(`Fil: ${outputPath}`);
  console.log('='.repeat(50));

  // Statistik
  const withDate = uniqueEvents.filter(e => e.eventDate).length;
  const withoutDate = uniqueEvents.length - withDate;
  console.log(`Med datum: ${withDate}`);
  console.log(`Utan datum: ${withoutDate}`);

  // Per arena
  console.log('\nPer arena:');
  for (const arena of Object.values(ARENAS)) {
    const count = uniqueEvents.filter(e => e.arenaId === arena.id).length;
    console.log(`  ${arena.name}: ${count}`);
  }
}

main().catch(console.error);

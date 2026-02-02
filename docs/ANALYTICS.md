# Analytics Documentation

## Overview

På G uses Matomo for anonymous usage analytics. All tracking is:
- Non-identifying (no PII collected)
- Cookieless (no tracking cookies)
- Respects Do Not Track (browser DNT)
- GDPR-compliant

## Matomo Events

All events use the parent category `PagApp` with the following structure:
```
_paq.push(['trackEvent', 'PagApp', action, label, value])
```

### Navigation Events

| Action | Label | Value | Trigger |
|--------|-------|-------|---------|
| `nav_click` | `rss` | - | Click on RSS link |
| `nav_click` | `info` | - | Click on info link |
| `nav_click` | `github` | - | Click on GitHub link |
| `nav_click` | `dashboard` | - | Click on dashboard link |
| `nav_click` | `home` | - | Click on "Tillbaka" link |

### Filter Events

| Action | Label | Value | Trigger |
|--------|-------|-------|---------|
| `filter_change` | `yesterday` / `today` / `tomorrow` / `week` / `upcoming` | Event count | Date filter changed |

### Event Interaction

| Action | Label | Value | Trigger |
|--------|-------|-------|---------|
| `event_click` | Arena name | - | Click on event card |
| `event_click_category` | Category (concert, hockey, etc.) | - | Event category tracking |

### Refresh Events

| Action | Label | Value | Trigger |
|--------|-------|-------|---------|
| `refresh` | `success` / `error` | - | Manual refresh button |
| `manual_update` | `triggered` / `error` | - | Dashboard manual update |

### Feed Events (RSS Page)

| Action | Label | Value | Trigger |
|--------|-------|-------|---------|
| `feed_copy` | `{type}_{period}` | - | Feed URL copied to clipboard |
| `feed_view` | `{type}_{period}` | - | Feed link clicked |

**Type values:** `rss`, `ical`, `json`
**Period values:** `today`, `tomorrow`, `week`, `upcoming`

### Error Events

| Action | Label | Value | Trigger |
|--------|-------|-------|---------|
| `error` | `load_events` | - | Failed to load events |
| `error` | `manual_update` | - | Failed to trigger manual update |

### Page View Events

Virtual page views are tracked for SPA navigation:

| Path | Title |
|------|-------|
| `/` | På G - Evenemang |
| `/rss` | På G - RSS-flöden |
| `/info` | På G - Information |
| `/dashboard` | På G - Dashboard |

---

## Privacy Statement

### Data NOT Collected
- IP addresses (anonymized by Matomo)
- User identifiers
- Cookies (cookieless tracking)
- Personal information
- Event details beyond aggregate counts

### Data Collected
- Aggregate page views
- Navigation patterns
- Filter usage statistics
- Feed subscription interest
- Error occurrence rates

### Compliance
- Respects browser Do Not Track (DNT)
- Cookieless tracking (no consent banner needed)
- No cross-site tracking
- IP anonymization enabled

---

## Implementation Details

### Files
- `src/hooks/useMatomo.js` - Tracking hook and utility functions
- `src/main.jsx` - Page view tracking for SPA navigation
- `src/App.jsx` - Main page event tracking
- `src/RssPage.jsx` - Feed page tracking
- `src/InfoPage.jsx` - Info page tracking
- `src/DashboardPage.jsx` - Dashboard tracking

### Matomo Configuration

The tracking script is loaded in `index.html`:
- Site ID: 1 (mackan.eu)
- Tracker: Proxied via `/pag/api/matomo-proxy.php`
- Cookies: Disabled (`disableCookies`)
- DNT: Respected (`setDoNotTrack`)

---

*Last updated: 2026-02-02*

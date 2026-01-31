# Deployment Guide - Pa G (Globenomradet Events)

## Overview

Pa G is a static React application that can be deployed to any static hosting service.

## Build Process

### Prerequisites

- Node.js 18+
- npm

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

App runs at `http://localhost:5173/pag/`

### Production Build

```bash
npm run build
```

Output goes to `dist/` directory.

## Data Generation

### Generate Event Data

Run the background script to fetch events and generate feeds:

```bash
node scripts/fetch-events.js
```

### Generated Files

| File | Description |
|------|-------------|
| `public/events.json` | All event data |
| `public/rss-*.xml` | RSS feeds |
| `public/calendar-*.ics` | iCal feeds |
| `public/feed-*.json` | JSON feeds |

### Configuration

```bash
# Custom timeout and parallelism
FETCH_TIMEOUT_MS=15000 MAX_PARALLEL_SCRAPES=8 node scripts/fetch-events.js
```

## Deployment Options

### Option 1: Static Hosting

Upload `dist/` contents to any static host:
- Netlify
- Vercel
- GitHub Pages
- Traditional web hosting

### Option 2: Manual Upload

```bash
# Build
npm run build

# Upload via SCP
scp -r dist/* user@server:/path/to/webroot/pag/
```

### Option 3: Git-based Deploy

```bash
# Build locally
npm run build

# Commit dist folder (if using git-based deploy)
git add dist/
git commit -m "chore: update build"
git push
```

## Scheduled Data Updates

### Cron Job Setup

```bash
# Update events every hour
0 * * * * cd /path/to/pag && node scripts/fetch-events.js >> /var/log/pag-fetch.log 2>&1
```

### GitHub Actions (Alternative)

```yaml
name: Update Events
on:
  schedule:
    - cron: '0 * * * *'
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: node scripts/fetch-events.js
      - run: |
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add public/
          git commit -m "chore: update events" || exit 0
          git push
```

## Production Checklist

### Pre-Deployment

- [ ] `npm run build` succeeds
- [ ] No console errors
- [ ] Events data generated
- [ ] Feeds generated correctly

### Post-Deployment

- [ ] Site loads correctly
- [ ] Events display properly
- [ ] Filters working
- [ ] RSS feeds accessible
- [ ] iCal feeds importable

### Performance

- [ ] HTTPS enabled
- [ ] Caching headers set
- [ ] Gzip compression enabled

## Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

### Data Fetch Fails

```bash
# Check network
curl https://aviciiarena.se/wp-json/wp/v2/events

# Check with timeout
FETCH_TIMEOUT_MS=30000 node scripts/fetch-events.js
```

### Events Not Showing

1. Verify `public/events.json` exists and has data
2. Check browser console for errors
3. Verify JSON is valid

## URL Configuration

### Base Path

Configured in `vite.config.js`:

```javascript
export default {
  base: '/pag/'
}
```

Adjust if deploying to different path.

---
*Last updated: 2026-01-30*

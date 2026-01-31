# Security Documentation - Pa G (Globenomradet Events)

## Overview

This document outlines security considerations for the Pa G event display application.

## Architecture Security

### Static Application

Pa G is a static React application with no backend authentication or database. Security focus is on:
- Safe data handling
- External API interaction
- Client-side security

## Data Handling

### External API Data

Data from Stockholm Live APIs is treated as untrusted:

```javascript
// Sanitize external data before display
function sanitizeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

### Event Data Validation

```javascript
// Validate event structure
function validateEvent(event) {
    if (!event.title || typeof event.title !== 'string') return false;
    if (!event.date || isNaN(Date.parse(event.date))) return false;
    return true;
}
```

## Content Security

### No Dynamic Execution

- No `eval()` or dynamic code execution
- No inline event handlers
- React handles XSS protection

### External Links

All external links open in new tabs with security attributes:

```jsx
<a href={event.url} target="_blank" rel="noopener noreferrer">
    Event Link
</a>
```

## Build Security

### Dependencies

```bash
# Check for vulnerabilities
npm audit

# Fix automatically if possible
npm audit fix
```

### Production Build

- Source maps disabled in production
- Console logs stripped
- Environment variables not exposed

## Data Fetching Script

### Rate Limiting

```javascript
// Respect external API limits
const MAX_PARALLEL_SCRAPES = 5;
const DELAY_BETWEEN_REQUESTS = 100; // ms
```

### Timeout Protection

```javascript
// Prevent hanging requests
const FETCH_TIMEOUT_MS = 10000;
```

### Error Handling

```javascript
try {
    const response = await fetchWithTimeout(url);
    // Process response
} catch (error) {
    console.error(`Fetch failed: ${url}`);
    // Continue with other events
}
```

## Client-Side Security

### Local Storage

Pa G does not store sensitive data. If preferences are stored:

```javascript
// Only store non-sensitive preferences
localStorage.setItem('theme', 'dark');
// Never store personal data
```

### No Authentication

Pa G has no user accounts or authentication. All data is public.

## Security Headers

When deploying, configure server headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; img-src 'self' https:; style-src 'self' 'unsafe-inline'
```

## Feed Security

### RSS/iCal Feeds

- Generated from validated data
- XML properly escaped
- No executable content

### JSON Feed

- Standard JSON encoding
- No HTML in text fields
- URLs validated

## Third-Party Dependencies

### Minimal Dependencies

Pa G uses minimal dependencies to reduce attack surface:
- React (core framework)
- Vite (build tool only)

### Regular Updates

```bash
# Update dependencies regularly
npm update
npm audit
```

## Security Checklist

### Development

- [ ] External data sanitized
- [ ] No `eval()` or dynamic execution
- [ ] Links have rel="noopener noreferrer"
- [ ] No console.log with sensitive data

### Build

- [ ] npm audit clean
- [ ] Source maps disabled
- [ ] Dependencies updated

### Deployment

- [ ] HTTPS only
- [ ] Security headers configured
- [ ] Proper CORS if needed

## Incident Response

### Data Issues

If external API returns malicious data:
1. Regenerate events.json from cached data
2. Contact Stockholm Live if intentional
3. Add sanitization for specific attack vector

### Dependency Vulnerability

1. Run `npm audit` to identify
2. Update affected packages
3. Rebuild and redeploy

---
*Last updated: 2026-01-30*

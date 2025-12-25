#!/usr/bin/env node
/**
 * Tester för SSRF-skydd - URL-validering
 */

import { describe, it, expect } from 'node:test';

const ALLOWED_DOMAINS = [
  'aviciiarena.se',
  '3arena.se',
  'hovetarena.se',
  'annexet.se'
];

function validateEventUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);

    // Kräv HTTPS
    if (urlObj.protocol !== 'https:') {
      return false;
    }

    // Kontrollera hostname mot allowlist
    const hostname = urlObj.hostname.toLowerCase();
    const isAllowed = ALLOWED_DOMAINS.some(domain => {
      return hostname === domain || hostname.endsWith('.' + domain);
    });

    if (!isAllowed) {
      return false;
    }

    // Blockera interna IP-intervall
    if (hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

describe('URL validation for SSRF protection', () => {
  it('should allow valid arena URLs', () => {
    expect(validateEventUrl('https://aviciiarena.se/event/test')).toBe(true);
    expect(validateEventUrl('https://3arena.se/event/test')).toBe(true);
    expect(validateEventUrl('https://hovetarena.se/event/test')).toBe(true);
    expect(validateEventUrl('https://annexet.se/event/test')).toBe(true);
  });

  it('should reject HTTP URLs', () => {
    expect(validateEventUrl('http://aviciiarena.se/event/test')).toBe(false);
  });

  it('should reject non-arena domains', () => {
    expect(validateEventUrl('https://evil.com/event/test')).toBe(false);
    expect(validateEventUrl('https://google.com')).toBe(false);
  });

  it('should reject localhost', () => {
    expect(validateEventUrl('https://localhost/event/test')).toBe(false);
    expect(validateEventUrl('https://127.0.0.1/event/test')).toBe(false);
  });

  it('should reject private IP ranges', () => {
    expect(validateEventUrl('https://192.168.1.1/event/test')).toBe(false);
    expect(validateEventUrl('https://10.0.0.1/event/test')).toBe(false);
    expect(validateEventUrl('https://172.16.0.1/event/test')).toBe(false);
    expect(validateEventUrl('https://172.31.255.255/event/test')).toBe(false);
  });

  it('should reject invalid URL formats', () => {
    expect(validateEventUrl('not-a-url')).toBe(false);
    expect(validateEventUrl('')).toBe(false);
    expect(validateEventUrl(null)).toBe(false);
    expect(validateEventUrl(undefined)).toBe(false);
  });
});



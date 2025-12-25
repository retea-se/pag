#!/usr/bin/env node
/**
 * Tester för timeout-hantering i fetch-funktionen
 */

import { describe, it, expect, beforeEach, afterEach } from 'node:test';
import https from 'https';

// Mock https.get för att simulera långsamma svar
let mockDelay = 0;
let mockShouldTimeout = false;

// Simulera fetch-funktionen med timeout
function fetch(url, timeoutMs = 10000) {
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
          reject(new Error(`JSON parse error: ${parseError.message}`));
        }
      });
    });

    req.on('error', (error) => {
      if (completed) return;
      completed = true;
      clearTimeout(timeoutId);
      reject(error);
    });

    timeoutId = setTimeout(() => {
      if (completed) return;
      completed = true;
      req.destroy();
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

describe('Fetch timeout handling', () => {
  beforeEach(() => {
    mockDelay = 0;
    mockShouldTimeout = false;
  });

  it('should timeout after specified time', async () => {
    const timeoutMs = 100;
    const startTime = Date.now();

    try {
      await fetch('https://httpbin.org/delay/5', timeoutMs);
      expect.fail('Should have timed out');
    } catch (error) {
      const elapsed = Date.now() - startTime;
      expect(error.message).toContain('timeout');
      expect(elapsed).toBeLessThan(timeoutMs + 100); // Allow some margin
    }
  });

  it('should complete successfully within timeout', async () => {
    const timeoutMs = 5000;
    try {
      const response = await fetch('https://httpbin.org/json', timeoutMs);
      expect(response).toBeDefined();
      expect(response.ok).toBe(true);
    } catch (error) {
      expect.fail('Should not have timed out');
    }
  });
});



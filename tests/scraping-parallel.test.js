#!/usr/bin/env node
/**
 * Tester för parallell scraping med p-limit
 */

import { describe, it, expect } from 'node:test';
import pLimit from 'p-limit';

describe('Parallel scraping with p-limit', () => {
  it('should limit concurrent executions', async () => {
    const limit = pLimit(3);
    let concurrent = 0;
    let maxConcurrent = 0;

    const tasks = Array.from({ length: 10 }, (_, i) =>
      limit(async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise(r => setTimeout(r, 10));
        concurrent--;
        return i;
      })
    );

    await Promise.all(tasks);
    expect(maxConcurrent).toBeLessThanOrEqual(3);
  });

  it('should handle errors without stopping all tasks', async () => {
    const limit = pLimit(5);
    const errorQueue = [];

    const tasks = Array.from({ length: 10 }, (_, i) =>
      limit(async () => {
        if (i === 3 || i === 7) {
          throw new Error(`Error ${i}`);
        }
        return i;
      }).catch(error => {
        errorQueue.push(error.message);
        return null;
      })
    );

    const results = await Promise.all(tasks);
    const successful = results.filter(r => r !== null);

    expect(successful.length).toBe(8);
    expect(errorQueue.length).toBe(2);
  });
});


#!/usr/bin/env node
/**
 * Enkel API-endpoint för sidvisningsräknare
 * Kör med: node public/api/pageviews.js
 * Eller använd med Express/Node.js server
 */

import fs from 'fs';
import path from 'path';
import process from 'node:process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE = path.join(__dirname, 'pageviews.json');

function getPageViews() {
  try {
    if (fs.existsSync(FILE)) {
      const content = fs.readFileSync(FILE, 'utf8');
      const data = JSON.parse(content);
      return data.count || 0;
    }
  } catch (error) {
    console.error('Error reading pageviews:', error);
  }
  return 0;
}

function incrementPageViews() {
  const current = getPageViews();
  const newCount = current + 1;

  try {
    fs.writeFileSync(FILE, JSON.stringify({ count: newCount }, null, 2), 'utf8');
    return newCount;
  } catch (error) {
    console.error('Error writing pageviews:', error);
    return current;
  }
}

// Om körs direkt (inte som modul)
if (import.meta.url === `file://${process.argv[1]}`) {
  const count = incrementPageViews();
  console.log(JSON.stringify({ count }));
}

export { getPageViews, incrementPageViews };


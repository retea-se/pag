import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

// Kopiera api/.htaccess till dist/api/.htaccess
const apiHtaccessSource = join(rootDir, 'public', 'api', '.htaccess');
const apiHtaccessDest = join(distDir, 'api', '.htaccess');

if (existsSync(apiHtaccessSource)) {
  // Se till att dest-mappen finns
  const apiDestDir = dirname(apiHtaccessDest);
  if (!existsSync(apiDestDir)) {
    mkdirSync(apiDestDir, { recursive: true });
  }
  copyFileSync(apiHtaccessSource, apiHtaccessDest);
  console.log('✓ Kopierade api/.htaccess till dist/api/.htaccess');
} else {
  console.warn('⚠ api/.htaccess hittades inte i public/api/');
}


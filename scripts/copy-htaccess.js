import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

// Kopiera huvud-.htaccess till dist/.htaccess (KRITISK för SPA-routing)
const mainHtaccessSource = join(rootDir, '.htaccess');
const mainHtaccessDest = join(distDir, '.htaccess');

if (existsSync(mainHtaccessSource)) {
  copyFileSync(mainHtaccessSource, mainHtaccessDest);
  console.log('✓ Kopierade .htaccess till dist/.htaccess');
} else {
  console.error('✗ KRITISKT: .htaccess saknas i projektets rot!');
}

// Kopiera api/.htaccess till dist/api/.htaccess
const apiHtaccessSource = join(rootDir, 'public', 'api', '.htaccess');
const apiHtaccessDest = join(distDir, 'api', '.htaccess');

if (existsSync(apiHtaccessSource)) {
  const apiDestDir = dirname(apiHtaccessDest);
  if (!existsSync(apiDestDir)) {
    mkdirSync(apiDestDir, { recursive: true });
  }
  copyFileSync(apiHtaccessSource, apiHtaccessDest);
  console.log('✓ Kopierade api/.htaccess till dist/api/.htaccess');
} else {
  console.warn('⚠ api/.htaccess hittades inte i public/api/');
}

// Kopiera trigger-update.php till dist/api/
const triggerUpdateSource = join(rootDir, 'public', 'api', 'trigger-update.php');
const triggerUpdateDest = join(distDir, 'api', 'trigger-update.php');

if (existsSync(triggerUpdateSource)) {
  const apiDestDir = dirname(triggerUpdateDest);
  if (!existsSync(apiDestDir)) {
    mkdirSync(apiDestDir, { recursive: true });
  }
  copyFileSync(triggerUpdateSource, triggerUpdateDest);
  console.log('✓ Kopierade trigger-update.php till dist/api/');
}




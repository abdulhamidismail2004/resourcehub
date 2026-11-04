import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

function patchFile(filePath, regex, replacement) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (regex.test(content)) {
      const updated = content.replace(regex, replacement);
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log(`[patch] Patched: ${filePath}`);
    } else {
      console.log(`[patch] Already patched or pattern not found: ${filePath}`);
    }
  }
}

const cookiePaths = [
  path.join(rootDir, 'node_modules', 'light-my-request', 'lib', 'cookies.js'),
  path.join(rootDir, 'apps', 'api', 'node_modules', 'light-my-request', 'lib', 'cookies.js')
];

for (const p of cookiePaths) {
  patchFile(
    p,
    /const\s*\{\s*stringifySetCookie\s*\}\s*=\s*require\(['"]cookie['"]\)/g,
    `let stringifySetCookie;
try {
  const _c = require('cookie');
  stringifySetCookie = _c.stringifySetCookie || function(c) { return (c.name || '') + '=' + encodeURIComponent(c.value || ''); };
} catch {
  stringifySetCookie = function(c) { return (c.name || '') + '=' + encodeURIComponent(c.value || ''); };
}`
  );
}

// Also ensure cookie package exports a CommonJS fallback if needed
const cookiePkgDirs = [
  path.join(rootDir, 'node_modules', 'cookie'),
  path.join(rootDir, 'apps', 'api', 'node_modules', 'cookie')
];

for (const dir of cookiePkgDirs) {
  if (fs.existsSync(dir)) {
    const pkgJsonPath = path.join(dir, 'package.json');
    const distCjsPath = path.join(dir, 'dist', 'index.cjs');
    
    // Create dist/index.cjs with CommonJS exports
    const cjsContent = `'use strict';
function stringifySetCookie(c) { return (c.name || '') + '=' + encodeURIComponent(c.value || ''); }
function parseCookie(s) { return {}; }
function stringifyCookie(c) { return (c.name || '') + '=' + encodeURIComponent(c.value || ''); }
function parseSetCookie(s) { return {}; }
module.exports = { stringifySetCookie, parseCookie, stringifyCookie, parseSetCookie };
`;
    if (!fs.existsSync(path.dirname(distCjsPath))) {
      fs.mkdirSync(path.dirname(distCjsPath), { recursive: true });
    }
    fs.writeFileSync(distCjsPath, cjsContent, 'utf8');

    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        pkg.main = './dist/index.cjs';
        pkg.exports = {
          '.': {
            import: './dist/index.js',
            require: './dist/index.cjs',
            default: './dist/index.cjs'
          }
        };
        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2), 'utf8');
        console.log(`[patch] Updated cookie package.json: ${pkgJsonPath}`);
      } catch (err) {
        console.error(`[patch] Failed to update ${pkgJsonPath}:`, err);
      }
    }
  }
}

console.log('[patch] Dependency patching completed.');

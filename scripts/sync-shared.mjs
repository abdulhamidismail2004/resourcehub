import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const sharedSrcDir = path.resolve(rootDir, 'packages/shared');
const targetDirs = [
  path.resolve(rootDir, 'node_modules/@resourcehub/shared'),
  path.resolve(rootDir, 'apps/api/node_modules/@resourcehub/shared'),
  path.resolve(rootDir, 'apps/web/node_modules/@resourcehub/shared'),
];

for (const targetDir of targetDirs) {
  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(path.join(sharedSrcDir, 'package.json'), path.join(targetDir, 'package.json'));
  const distSrc = path.join(sharedSrcDir, 'dist');
  if (fs.existsSync(distSrc)) {
    fs.cpSync(distSrc, path.join(targetDir, 'dist'), { recursive: true });
  }
}

console.log('Successfully synced @resourcehub/shared to node_modules across all targets');

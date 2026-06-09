import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const currentVersion = packageJson.version || '1.2.12';
const versionParts = currentVersion.split('.').map(Number);

if (versionParts.length === 3 && !versionParts.some(isNaN)) {
    // Increment patch version
    versionParts[2] += 1;
    packageJson.version = versionParts.join('.');
} else {
    // Default to 1.2.12 if version format is unexpected
    packageJson.version = '1.2.12';
}

// Write updated version back to package.json
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

// Write the updated version to version.ts
const versionTsPath = path.join(__dirname, 'version.ts');
fs.writeFileSync(versionTsPath, `export const APP_VERSION = '${packageJson.version}';\n`);

console.log(`[Version Bump] Version updated to ${packageJson.version} and exported to version.ts`);

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function searchDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== '.supabase') {
                searchDir(fullPath);
            }
        } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.sql'))) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('tecnico_responsavel')) {
                const lines = content.split('\n');
                lines.forEach((line, idx) => {
                    if (line.includes('tecnico_responsavel')) {
                        console.log(`${path.relative(projectRoot, fullPath)}:L${idx + 1}: ${line.trim()}`);
                    }
                });
            }
        }
    }
}

searchDir(projectRoot);

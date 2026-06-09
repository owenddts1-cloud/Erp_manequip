const fs = require('fs');
const code = fs.readFileSync('pages/Map.tsx', 'utf8');
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('2d_outlines')) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}

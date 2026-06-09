const fs = require('fs');

const content = fs.readFileSync('scratch/old_map_3953.tsx', 'utf8');

// The content is a JSON string representation, let's parse it if possible, or just unescape it.
let unescaped = content;
try {
  unescaped = JSON.parse(content);
} catch (e) {
  // Try to unescape manually if it is a double-quoted string
  if (content.startsWith('"') && content.endsWith('"')) {
    unescaped = eval(content);
  }
}

// Write the unescaped content to a proper formatted file
fs.writeFileSync('scratch/old_map_3953_formatted.tsx', unescaped, 'utf8');
console.log('Saved unescaped file to scratch/old_map_3953_formatted.tsx');

// Search for keywords
const lines = unescaped.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('bottom-') || line.includes('right-') || line.toLowerCase().includes('saude') || line.toLowerCase().includes('health')) {
    console.log(`Line ${i+1}: ${line.trim()}`);
  }
}

const fs = require('fs');
const path = require('path');

const dir = 'scratch';
const files = fs.readdirSync(dir).filter(f => f.startsWith('step_') && f.endsWith('_query_match.txt'));

for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  if (content.toLowerCase().includes('saude') || content.toLowerCase().includes('saúde') || content.toLowerCase().includes('health')) {
    console.log(`File ${f} contains saude/health!`);
    // Let's print out lines containing it:
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes('saude') || lines[i].toLowerCase().includes('saúde') || lines[i].toLowerCase().includes('health')) {
        console.log(`  Line ${i+1}: ${lines[i].trim()}`);
      }
    }
  }
}

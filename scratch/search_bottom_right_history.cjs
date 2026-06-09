const fs = require('fs');
const path = require('path');

const dir = 'scratch';
const files = fs.readdirSync(dir).filter(f => f.startsWith('step_') && f.endsWith('_query_match.txt'));

for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  if (content.includes('bottom-3') || content.includes('right-3')) {
    console.log(`File ${f} matches bottom-3/right-3:`);
    // Let's print out lines containing it plus next 10 lines
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('bottom-3') || lines[i].includes('right-3')) {
        console.log(`  Line ${i+1}: ${lines[i].trim()}`);
        console.log(`  Next few lines:`);
        for (let j = 1; j <= 5; j++) {
          if (lines[i+j]) console.log(`    ${lines[i+j].trim()}`);
        }
      }
    }
  }
}

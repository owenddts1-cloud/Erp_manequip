const fs = require('fs');
const content = fs.readFileSync('scratch/step_4096_content.txt', 'utf8');
const lines = content.split('\n');
console.log(`Step 4096 content has ${lines.length} lines.`);

// Print first 50 lines of step 4096 content
console.log('--- FIRST 50 LINES ---');
for (let i = 0; i < Math.min(50, lines.length); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

// Print last 50 lines of step 4096 content
console.log('--- LAST 50 LINES ---');
for (let i = Math.max(0, lines.length - 50); i < lines.length; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

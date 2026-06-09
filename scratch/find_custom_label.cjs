const fs = require('fs');
const path = require('path');

const file = path.join('c:', 'Users', 'Manutenção', 'MANEQUIP', 'pages', 'Dashboard.tsx');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('renderCustomLabel') || line.includes('CustomLabel')) {
    console.log(`Line ${i+1}: ${line.trim()}`);
    // Print next 10 lines
    for (let j = 1; j <= 12; j++) {
      if (lines[i+j]) console.log(`  Line ${i+1+j}: ${lines[i+j].trim()}`);
    }
  }
}

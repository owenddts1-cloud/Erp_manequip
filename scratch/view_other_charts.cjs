const fs = require('fs');
const path = require('path');

const file = path.join('c:', 'Users', 'Manutenção', 'MANEQUIP', 'pages', 'Dashboard.tsx');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

function printRange(start, end) {
  console.log(`=== RANGE ${start} - ${end} ===`);
  for (let i = start - 1; i < end; i++) {
    if (lines[i] !== undefined) {
      console.log(`${i+1}: ${lines[i]}`);
    }
  }
}

printRange(1600, 1625);
printRange(1685, 1715);
printRange(2465, 2495);
printRange(2550, 2580);

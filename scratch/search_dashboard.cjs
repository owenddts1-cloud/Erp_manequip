const fs = require('fs');
const path = require('path');

const file = path.join('c:', 'Users', 'Manutenção', 'MANEQUIP', 'pages', 'Dashboard.tsx');
const content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');

const keywords = ['pizza', '3d', 'chartmode', 'tipo', 'real', 'barras', 'rotulo', 'label'];

console.log(`File lines: ${lines.length}`);

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // If it contains "pizza" or "3D" or "tipo" (case-insensitive)
  if (line.toLowerCase().includes('pizza') || line.toLowerCase().includes('3d') || line.toLowerCase().includes('tipo:')) {
    console.log(`Line ${i+1}: ${line.trim()}`);
  }
}

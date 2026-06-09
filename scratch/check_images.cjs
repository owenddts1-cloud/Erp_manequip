const fs = require('fs');
const path = require('path');

const assetsDir = path.join('c:', 'Users', 'Manutenção', 'MANEQUIP', 'public', 'assets');
if (!fs.existsSync(assetsDir)) {
  console.log('Assets dir not found');
  process.exit(0);
}

const files = fs.readdirSync(assetsDir);
console.log('Files in public/assets:', files);

// Let's check sizes of images if we can read headers, or just print file sizes
for (const f of files) {
  const stat = fs.statSync(path.join(assetsDir, f));
  console.log(`${f}: ${stat.size} bytes`);
}

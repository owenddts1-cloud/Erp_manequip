const fs = require('fs');
const path = require('path');

// Simple JPEG header parser to get dimensions
function getJpegSize(filePath) {
  const data = fs.readFileSync(filePath);
  let i = 0;
  if (data[i] !== 0xFF || data[i + 1] !== 0xD8) {
    throw new Error('Not a valid JPEG');
  }
  i += 2;
  while (i < data.length) {
    if (data[i] === 0xFF) {
      const marker = data[i + 1];
      if (marker === 0xC0 || marker === 0xC2) {
        // SOF0 or SOF2
        const height = data.readUInt16BE(i + 5);
        const width = data.readUInt16BE(i + 7);
        return { width, height };
      }
      i += 2;
    } else {
      i++;
    }
  }
  throw new Error('Dimensions not found');
}

const assetsDir = path.join('c:', 'Users', 'Manutenção', 'MANEQUIP', 'public', 'assets');
const files = ['map_perspective.jpg', 'map_lote_a.jpg', 'map_lote_b.jpg', 'map_lote_c.jpg', 'map_overhead_clean.jpg', 'map_overhead_outlines.jpg'];

for (const f of files) {
  try {
    const size = getJpegSize(path.join(assetsDir, f));
    console.log(`${f}: ${size.width}x${size.height} (ratio: ${(size.width/size.height).toFixed(4)})`);
  } catch (e) {
    console.log(`Failed to read size for ${f}:`, e.message);
  }
}

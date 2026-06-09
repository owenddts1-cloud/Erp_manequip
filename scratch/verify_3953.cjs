const fs = require('fs');
const content = fs.readFileSync('scratch/step_3953_content.txt', 'utf8');
console.log(`step_3953_content.txt size: ${content.length} bytes.`);
if (content.includes('truncated')) {
  console.log('It contains "truncated".');
} else {
  console.log('No "truncated" found! We have the full file!');
}

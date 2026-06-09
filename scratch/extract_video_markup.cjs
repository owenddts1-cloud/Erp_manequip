const fs = require('fs');
const path = require('path');

const logFile = path.join('C:', 'Users', 'Manutenção', '.gemini', 'antigravity-ide', 'brain', 'e86a39b8-a3b4-42f6-8557-b88d8f796b9c', '.system_generated', 'logs', 'transcript.jsonl');

const lines = fs.readFileSync(logFile, 'utf8').split('\n');

for (const lineStr of lines) {
  if (!lineStr.trim()) continue;
  try {
    const data = JSON.parse(lineStr);
    if (lineStr.includes('.mp4') || lineStr.includes('<video')) {
      console.log(`Found mention of video in step ${data.step_index}`);
      // Print around the .mp4 string inside the line
      const index = lineStr.indexOf('.mp4');
      if (index !== -1) {
        console.log('Snippet:', lineStr.substring(Math.max(0, index - 500), Math.min(lineStr.length, index + 500)));
        console.log('---');
      }
    }
  } catch (e) {}
}

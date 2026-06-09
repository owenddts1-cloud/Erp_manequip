const fs = require('fs');
const path = require('path');

const logFile = path.join('C:', 'Users', 'Manutenção', '.gemini', 'antigravity-ide', 'brain', 'e86a39b8-a3b4-42f6-8557-b88d8f796b9c', '.system_generated', 'logs', 'transcript.jsonl');

const lines = fs.readFileSync(logFile, 'utf8').split('\n');

for (const lineStr of lines) {
  if (!lineStr.trim()) continue;
  try {
    const data = JSON.parse(lineStr);
    if (lineStr.includes('<video')) {
      console.log(`Step ${data.step_index} contains '<video'`);
      // Let's find where `<video` starts and extract about 2000 characters from there
      const idx = lineStr.indexOf('<video');
      console.log('Video tag code:', lineStr.substring(idx, idx + 1000));
      console.log('---');
    }
  } catch (e) {}
}

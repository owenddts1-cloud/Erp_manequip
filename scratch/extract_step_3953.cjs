const fs = require('fs');
const path = require('path');

const logFile = path.join('C:', 'Users', 'Manutenção', '.gemini', 'antigravity-ide', 'brain', 'e86a39b8-a3b4-42f6-8557-b88d8f796b9c', '.system_generated', 'logs', 'transcript.jsonl');

const lines = fs.readFileSync(logFile, 'utf8').split('\n');

for (const lineStr of lines) {
  if (!lineStr.trim()) continue;
  try {
    const data = JSON.parse(lineStr);
    if (data.step_index === 3953) {
      if (data.tool_calls) {
        for (const tc of data.tool_calls) {
          if (tc.name === 'write_to_file') {
            fs.writeFileSync('scratch/step_3953_content.txt', tc.args.CodeContent, 'utf8');
            console.log('Saved step 3953 content to scratch/step_3953_content.txt');
          }
        }
      }
    }
  } catch (e) {}
}

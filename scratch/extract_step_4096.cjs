const fs = require('fs');
const path = require('path');

const logFile = path.join('C:', 'Users', 'Manutenção', '.gemini', 'antigravity-ide', 'brain', 'e86a39b8-a3b4-42f6-8557-b88d8f796b9c', '.system_generated', 'logs', 'transcript.jsonl');

const lines = fs.readFileSync(logFile, 'utf8').split('\n');

for (const lineStr of lines) {
  if (!lineStr.trim()) continue;
  try {
    const data = JSON.parse(lineStr);
    if (data.step_index === 4096) {
      if (data.tool_calls) {
        for (const tc of data.tool_calls) {
          if (tc.name === 'replace_file_content') {
            fs.writeFileSync('scratch/step_4096_content.txt', tc.args.ReplacementContent, 'utf8');
            console.log('Successfully saved step 4096 content to scratch/step_4096_content.txt');
          }
        }
      }
    }
  } catch (e) {}
}

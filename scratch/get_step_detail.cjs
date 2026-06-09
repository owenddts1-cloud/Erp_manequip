const fs = require('fs');
const path = require('path');

const logFile = path.join('C:', 'Users', 'Manutenção', '.gemini', 'antigravity-ide', 'brain', 'e86a39b8-a3b4-42f6-8557-b88d8f796b9c', '.system_generated', 'logs', 'transcript.jsonl');

const lines = fs.readFileSync(logFile, 'utf8').split('\n');

const stepsToPrint = [4096, 4102];

for (const lineStr of lines) {
  if (!lineStr.trim()) continue;
  try {
    const data = JSON.parse(lineStr);
    if (stepsToPrint.includes(data.step_index)) {
      console.log(`=== STEP ${data.step_index} ===`);
      console.log(`Type: ${data.type}`);
      if (data.tool_calls) {
        for (const tc of data.tool_calls) {
          console.log(`Tool: ${tc.name}`);
          console.log(`Args:`, JSON.stringify(tc.args, null, 2));
        }
      }
      console.log('=======================\n');
    }
  } catch (e) {}
}

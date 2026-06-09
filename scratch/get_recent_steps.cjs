const fs = require('fs');
const path = require('path');

const logFile = path.join('C:', 'Users', 'Manutenção', '.gemini', 'antigravity-ide', 'brain', 'e86a39b8-a3b4-42f6-8557-b88d8f796b9c', '.system_generated', 'logs', 'transcript.jsonl');

const lines = fs.readFileSync(logFile, 'utf8').split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
  if (!lines[i].trim()) continue;
  try {
    const data = JSON.parse(lines[i]);
    if (data.step_index >= 4080) {
      console.log(`Step ${data.step_index}: type=${data.type}`);
      if (data.tool_calls) {
        for (const tc of data.tool_calls) {
          console.log(`  Tool call: ${tc.name}`);
          if (tc.name === 'replace_file_content') {
            console.log(`    File: ${tc.args.TargetFile}`);
            console.log(`    StartLine: ${tc.args.StartLine}, EndLine: ${tc.args.EndLine}`);
            console.log(`    Instruction: ${tc.args.Instruction}`);
          }
        }
      }
    }
  } catch (e) {}
}

const fs = require('fs');
const path = require('path');

const logFile = path.join('C:', 'Users', 'Manutenção', '.gemini', 'antigravity-ide', 'brain', 'e86a39b8-a3b4-42f6-8557-b88d8f796b9c', '.system_generated', 'logs', 'transcript.jsonl');

if (!fs.existsSync(logFile)) {
  console.log(`Log file not found at: ${logFile}`);
  process.exit(1);
}

const lines = fs.readFileSync(logFile, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  try {
    const data = JSON.parse(lines[i]);
    if (data.step_index === 3953) {
      if (data.tool_calls) {
        for (const tc of data.tool_calls) {
          if (tc.name === 'write_to_file' && tc.args.TargetFile.includes('Map.tsx')) {
            fs.writeFileSync('scratch/old_map_3953.tsx', tc.args.CodeContent, 'utf8');
            console.log('Saved step 3953 Map.tsx to scratch/old_map_3953.tsx');
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }
}

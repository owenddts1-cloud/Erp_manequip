const fs = require('fs');
const path = require('path');

const logFile = path.join('C:', 'Users', 'Manutenção', '.gemini', 'antigravity-ide', 'brain', 'e86a39b8-a3b4-42f6-8557-b88d8f796b9c', '.system_generated', 'logs', 'transcript.jsonl');

if (!fs.existsSync(logFile)) {
  console.log(`Log file not found at: ${logFile}`);
  process.exit(1);
}

const lines = fs.readFileSync(logFile, 'utf8').split('\n');
console.log(`Found ${lines.length} lines in log file.`);

// Find latest replacement chunks or file content edits for Map.tsx
for (let i = lines.length - 1; i >= 0; i--) {
  if (!lines[i].trim()) continue;
  try {
    const data = JSON.parse(lines[i]);
    if (data.tool_calls) {
      for (const tc of data.tool_calls) {
        if (tc.name === 'replace_file_content' || tc.name === 'write_to_file' || tc.name === 'multi_replace_file_content') {
          const args = tc.args || {};
          if (args.TargetFile && args.TargetFile.includes('Map.tsx')) {
            console.log(`Found edit in step ${data.step_index} (${tc.name}):`);
            console.log(`Instruction: ${args.Instruction}`);
            console.log(`Description: ${args.Description}`);
            if (args.ReplacementContent) {
              console.log(`Replacement content (first 200 chars):`, args.ReplacementContent.slice(0, 200));
            }
            if (args.ReplacementChunks) {
              console.log(`Has chunks: ${args.ReplacementChunks.length}`);
            }
            console.log('---');
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }
}

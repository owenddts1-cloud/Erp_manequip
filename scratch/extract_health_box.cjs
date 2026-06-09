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
    if (data.tool_calls) {
      for (const tc of data.tool_calls) {
        const args = tc.args || {};
        const content = args.CodeContent || args.ReplacementContent || '';
        if (content.includes('saude') || content.includes('Saúde') || content.includes('ativos') && content.includes('Map.tsx')) {
          console.log(`Step ${data.step_index} (${tc.name}) matches.`);
          // If it has "5 ativos" or similar:
          if (content.includes('5') || content.includes('saude')) {
            fs.writeFileSync(`scratch/step_${data.step_index}_match.txt`, content, 'utf8');
            console.log(`  Saved content to scratch/step_${data.step_index}_match.txt`);
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }
}

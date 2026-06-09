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
    const content = JSON.stringify(data);
    if (content.toLowerCase().includes('menos saude') || content.toLowerCase().includes('menos saúde') || content.toLowerCase().includes('saúde do ativo') || content.toLowerCase().includes('saude do ativo')) {
      console.log(`Step ${data.step_index} (${data.type}) matches query!`);
      fs.writeFileSync(`scratch/step_${data.step_index}_health_text_match.txt`, content, 'utf8');
    }
  } catch (e) {
    // ignore
  }
}

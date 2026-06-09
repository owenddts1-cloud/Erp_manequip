import fs from 'fs';

// Simple parse for .env.local
let geminiKey = '';
let openaiKey = '';
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/['"]/g, '');
      if (key === 'VITE_GEMINI_API_KEY') geminiKey = val;
      if (key === 'VITE_OPENAI_API_KEY') openaiKey = val;
    }
  }
} catch (e) {
  console.error("Error reading .env.local:", e.message);
}

console.log("Gemini Key:", geminiKey ? "Found (starts with " + geminiKey.slice(0, 5) + ")" : "Not found");
console.log("OpenAI Key:", openaiKey ? "Found (starts with " + openaiKey.slice(0, 7) + ")" : "Not found");

async function testGemini(model) {
  console.log(`\nTesting Gemini model: ${model}`);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello" }] }]
      })
    });
    const status = response.status;
    const data = await response.json();
    console.log(`Gemini Status: ${status}`);
    console.log(`Gemini Response:`, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Gemini fetch error:`, e.message);
  }
}

async function testOpenAI(model) {
  console.log(`\nTesting OpenAI model: ${model}`);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: "Hello" }]
      })
    });
    const status = response.status;
    const data = await response.json();
    console.log(`OpenAI Status: ${status}`);
    console.log(`OpenAI Response:`, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`OpenAI fetch error:`, e.message);
  }
}

async function run() {
  await testGemini('gemini-1.5-flash');
  await testGemini('gemini-2.0-flash');
  await testGemini('gemini-3.5-flash');
  await testOpenAI('gpt-4o-mini');
}

run();

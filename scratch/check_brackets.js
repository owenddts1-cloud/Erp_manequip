const fs = require('fs');
const code = fs.readFileSync('pages/Map.tsx', 'utf8');

let line = 1;
let col = 1;
let inString = null; // '"', "'", "`"
let inComment = null; // 'line', 'block'
let inRegex = false;
let stack = [];

for (let i = 0; i < code.length; i++) {
  const char = code[i];
  const next = code[i + 1];

  if (char === '\n') {
    line++;
    col = 1;
    if (inComment === 'line') {
      inComment = null;
    }
  } else {
    col++;
  }

  // Handle comments
  if (!inString && !inComment && !inRegex) {
    if (char === '/' && next === '/') {
      inComment = 'line';
      i++;
      continue;
    }
    if (char === '/' && next === '*') {
      inComment = 'block';
      i++;
      continue;
    }
  }

  if (inComment === 'block') {
    if (char === '*' && next === '/') {
      inComment = null;
      i++;
    }
    continue;
  }

  if (inComment === 'line') {
    continue;
  }

  // Handle strings
  if (!inComment && !inRegex) {
    if (inString) {
      if (char === inString && code[i - 1] !== '\\') {
        inString = null;
      }
      continue;
    } else {
      if (char === '"' || char === "'" || char === '`') {
        inString = char;
        continue;
      }
    }
  }

  // Handle brackets
  if (!inString && !inComment && !inRegex) {
    if (char === '(' || char === '[' || char === '{') {
      stack.push({ char, line, col });
    } else if (char === ')' || char === ']' || char === '}') {
      if (stack.length === 0) {
        console.log(`Extra closing bracket '${char}' at line ${line}, col ${col}`);
      } else {
        const top = stack.pop();
        const matching = { ')': '(', ']': '[', '}': '{' };
        if (top.char !== matching[char]) {
          console.log(`Mismatched bracket: opened '${top.char}' at line ${top.line}, col ${top.col}; closed with '${char}' at line ${line}, col ${col}`);
        }
      }
    }
  }
}

if (stack.length > 0) {
  console.log(`Unclosed brackets:`);
  for (const item of stack) {
    console.log(`  '${item.char}' opened at line ${item.line}, col ${item.col}`);
  }
} else {
  console.log(`All brackets matched perfectly!`);
}

import json
import os

logs_path = r"C:\Users\Manutenção\.gemini\antigravity-ide\brain\0b0d88f1-8186-47f3-9661-7eeca0eb3a60\.system_generated\logs\transcript.jsonl"
login_path = r"c:\Users\Manutenção\MANEQUIP\pages\Login.tsx"

# Restore base Login.tsx from git
os.system("git checkout c:\\Users\\Manutenção\\MANEQUIP\\pages\\Login.tsx")

with open(login_path, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Original content length: {len(content)}")

with open(logs_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            # Using strict=False to allow raw control characters in strings!
            data = json.loads(line, strict=False)
            step = data.get('step_index')
            if step >= 223:
                continue
                
            tool_calls = data.get('tool_calls', [])
            for call in tool_calls:
                name = call.get('name')
                args = call.get('args', {})
                target_file = args.get('TargetFile', '')
                
                if 'Login.tsx' in target_file:
                    if name == 'replace_file_content':
                        target = args.get('TargetContent')
                        replacement = args.get('ReplacementContent')
                        
                        content_norm = content.replace("\r\n", "\n")
                        target_norm = target.replace("\r\n", "\n")
                        replacement_norm = replacement.replace("\r\n", "\n")
                        
                        if target_norm in content_norm:
                            content = content_norm.replace(target_norm, replacement_norm)
                            print(f"Step {step}: replayed replace_file_content")
                        else:
                            print(f"Step {step}: WARNING: TargetContent not found!")
                            
                    elif name == 'multi_replace_file_content':
                        chunks_raw = args.get('ReplacementChunks', '[]')
                        if isinstance(chunks_raw, str):
                            chunks = json.loads(chunks_raw, strict=False)
                        else:
                            chunks = chunks_raw
                            
                        print(f"Step {step}: replaying multi_replace_file_content with {len(chunks)} chunks")
                        for i, chunk in enumerate(chunks):
                            target = chunk.get('TargetContent')
                            replacement = chunk.get('ReplacementContent')
                            
                            content_norm = content.replace("\r\n", "\n")
                            target_norm = target.replace("\r\n", "\n")
                            replacement_norm = replacement.replace("\r\n", "\n")
                            
                            if target_norm in content_norm:
                                content = content_norm.replace(target_norm, replacement_norm)
                                print(f"  Chunk {i}: success")
                            else:
                                print(f"  Chunk {i}: WARNING: TargetContent not found!")
        except Exception as e:
            print(f"Error parsing line in step {step if 'step' in locals() else 'unknown'}: {e}")

with open(login_path, "w", encoding="utf-8") as out:
    out.write(content)

print(f"Final replayed content length: {len(content)}")

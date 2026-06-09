import json

logs_path = r"C:\Users\Manutenção\.gemini\antigravity-ide\brain\0b0d88f1-8186-47f3-9661-7eeca0eb3a60\.system_generated\logs\transcript.jsonl"

with open(logs_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('step_index') == 235:
                content = data.get('content', '')
                print(f"Step 235 content length: {len(content)}")
                print("--- Content Preview ---")
                lines = content.splitlines()
                print("\n".join(lines[:20]))
                print("...")
                print("\n".join(lines[-20:]))
        except Exception as e:
            pass

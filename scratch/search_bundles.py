import glob

js_files = glob.glob("dist/assets/index-*.js")
print(f"Found {len(js_files)} index files in dist/assets")

for fpath in js_files:
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    
    has_rapida = "Leitura R\u00e1pida" in content or "Leitura R\u00c1PIDA" in content or "Prever Falhas por IA" in content
    has_lanucci = "Guilherme Lanucci" in content
    
    if has_rapida or has_lanucci:
        print(f"File {fpath}: has_rapida={has_rapida}, has_lanucci={has_lanucci}, size={len(content)}")

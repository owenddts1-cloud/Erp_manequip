import re

def split_sql():
    with open(r'c:\Users\Manutenção\MANEQUIP\scratch\import_data.sql', 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract functions
    header_end = content.find('-- 1. Seeding Technicians')
    header_sql = content[:header_end].strip()

    # Extract technicians
    techs_start = header_end
    techs_end = content.find('-- 2. Seeding Assets')
    techs_sql = content[techs_start:techs_end].strip()

    # Extract assets DO blocks
    assets_start = techs_end
    assets_end = content.find('-- 3. Seeding Monthly Execution')
    assets_sql = content[assets_start:assets_end].strip()

    # Extract monthly execution DO blocks
    monthly_start = assets_end
    monthly_end = content.find('COMMIT;')
    monthly_sql = content[monthly_start:monthly_end].strip()

    # Extract footer (commit and drops)
    footer_sql = content[monthly_end:].strip()

    # Split DO blocks
    do_blocks_assets = re.findall(r'DO \$\$.*?END \$\$;', assets_sql, re.DOTALL)
    do_blocks_monthly = re.findall(r'DO \$\$.*?END \$\$;', monthly_sql, re.DOTALL)

    print(f"Found {len(do_blocks_assets)} asset DO blocks.")
    print(f"Found {len(do_blocks_monthly)} monthly DO blocks.")

    parts = []

    # Part 1: Helper functions and technicians seeding
    p1 = "BEGIN;\n\n" + header_sql.replace("BEGIN;", "").strip() + "\n\n" + techs_sql + "\n\nCOMMIT;"
    parts.append(p1)

    # Assets parts: 20 DO blocks per file
    idx = 0
    while idx < len(do_blocks_assets):
        chunk = do_blocks_assets[idx:idx+20]
        if not chunk:
            break
        p = "BEGIN;\n\n" + "\n\n".join(chunk) + "\n\nCOMMIT;"
        parts.append(p)
        idx += 20

    # Monthly parts: 15 DO blocks per file
    idx = 0
    while idx < len(do_blocks_monthly):
        chunk = do_blocks_monthly[idx:idx+15]
        if not chunk:
            break
        p = "BEGIN;\n\n" + "\n\n".join(chunk) + "\n\nCOMMIT;"
        parts.append(p)
        idx += 15

    # Footer part: Cleanup functions
    p_last = footer_sql.replace("COMMIT;", "").strip()
    parts.append(p_last)

    # Save all parts
    for i, p in enumerate(parts):
        filename = f"c:\\Users\\Manutenção\\MANEQUIP\\scratch\\part_{i+1}.sql"
        with open(filename, 'w', encoding='utf-8') as out_f:
            out_f.write(p)
        print(f"Saved {filename} with {len(p.splitlines())} lines.")

if __name__ == "__main__":
    split_sql()

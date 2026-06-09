import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
        let val = valueParts.join('=').trim();
        if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1);
        }
        env[key.trim()] = val;
    }
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function run() {
    const tables = ['profiles', 'sectors', 'ativos', 'inventario', 'work_orders', 'chat_messages'];
    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*');
            if (error) {
                console.log(`❌ Table ${table} error:`, error.message);
            } else {
                console.log(`✅ Table ${table}: ${data.length} rows`);
                if (data.length > 0) {
                    console.log(JSON.stringify(data, null, 2));
                }
            }
        } catch (e) {
            console.log(`❌ Table ${table} exception:`, e.message);
        }
    }
}

run();

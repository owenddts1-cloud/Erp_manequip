import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';

function loadEnv(fileName) {
    if (!existsSync(fileName)) return null;
    const envContent = readFileSync(fileName, 'utf-8');
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
    return env;
}

async function checkDb(env) {
    const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
    const key = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
    if (!url || !key) return;
    
    console.log(`Trying URL: ${url}`);
    const supabase = createClient(url, key);
    try {
        const { data, error } = await supabase
            .from('work_orders')
            .select('status, tipo, created_at');
        if (error) {
            console.log(`❌ Error:`, error.message);
        } else {
            console.log(`✅ Total work_orders: ${data.length} rows`);
            const statuses = {};
            data.forEach(item => {
                const k = `${item.tipo}-${item.status}`;
                statuses[k] = (statuses[k] || 0) + 1;
            });
            console.log("Work order type-status count:", statuses);
            if (data.length > 0) {
                console.log("First 3 rows:", data.slice(0, 3));
            }
        }
    } catch (e) {
        console.log(`❌ Exception:`, e.message);
    }
}

async function run() {
    const files = ['.env.local', '.env.prod.local', '.env.test.local'];
    for (const f of files) {
        console.log(`--- Checking ${f} ---`);
        const env = loadEnv(f);
        if (env) {
            await checkDb(env);
        }
    }
}

run();

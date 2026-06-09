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
    try {
        const { data, error } = await supabase.from('preventivas_mensais').select('*').limit(20);
        if (error) {
            console.log(`❌ Error:`, error.message);
        } else {
            console.log(`✅ preventivas_mensais: ${data.length} rows`);
            const statuses = new Set(data.map(d => d.status));
            console.log('Unique statuses:', Array.from(statuses));
            console.log('Sample rows:', JSON.stringify(data.slice(0, 5), null, 2));
        }
    } catch (e) {
        console.log(`❌ Exception:`, e.message);
    }
}

run();

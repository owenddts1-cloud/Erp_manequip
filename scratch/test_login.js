import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Parse .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf-8');
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

async function test() {
    console.log('Testing login...');
    console.log('URL:', url);
    console.log('Key length:', key?.length);
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@manequip.com',
        password: 'AdminPassword123!'
    });
    if (error) {
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Success! User ID:', data.user?.id);
    }
}

test();

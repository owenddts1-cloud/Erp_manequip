import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load env vars manually
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) env[key.trim()] = valueParts.join('=').trim();
});

const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, anonKey);

async function register() {
    console.log('Registering flavia@manpred.com...');
    const { data, error } = await supabase.auth.signUp({
        email: 'flavia@manpred.com',
        password: '@admin',
        options: {
            data: {
                full_name: 'Flávia',
                job_title: 'Gestor'
            }
        }
    });

    if (error) {
        console.error('Error signing up:', error.message);
    } else {
        console.log('Success! User ID:', data.user?.id);
    }
}

register();

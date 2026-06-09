import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const envVars = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        envVars[key] = value;
    }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

const targetEmails = [
    'admin@manequip.com',
    'guilherme@manequip.com',
    'hellen@manequip.com',
    'leandro@manequip.com',
    'michele@manequip.com',
    'thiago@manequip.com',
    'data@manequip.com'
];

async function testAllLogins() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Testing authentication for all updated accounts...');

    for (const email of targetEmails) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: '@admin'
            });

            if (error) {
                console.error(`[-] Login FAILED for ${email}: ${error.message}`);
            } else {
                console.log(`[+] Login SUCCEEDED for ${email}`);
                // Sign out to clear session
                await supabase.auth.signOut();
            }
        } catch (err) {
            console.error(`[-] Exception during login for ${email}:`, err);
        }
    }
}

testAllLogins();

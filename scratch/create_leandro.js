import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables.');
    process.exit(1);
}

async function createLeandro() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const email = 'leandro@manequip.com';
    const password = '@data';

    console.log(`Registering user ${email} via auth.signUp...`);
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Leandro',
                job_title: 'gestor'
            }
        }
    });

    if (error) {
        console.error('Error signing up Leandro:', error.message);
    } else {
        console.log('Leandro registered successfully! User ID:', data.user?.id);
    }
}

createLeandro();

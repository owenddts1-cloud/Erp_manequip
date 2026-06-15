import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually parse .env.local because dotenv is causing issues
const envPath = path.resolve(__dirname, '.env.local');
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

// NEW SUPABASE PROJECT - MANEQUIP
const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_ANON_KEY;
console.log('Loading .env.local manually...');
console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Not Found');
console.log('Supabase Key:', supabaseKey ? 'Found' : 'Not Found');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables. Please check .env.local');
    process.exit(1);
}

async function createAdmin() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const email = 'admin@manequip.com';
    let password = envVars.ADMIN_PASSWORD;

    if (!password) {
        console.warn('⚠️ SECURITY WARNING: ADMIN_PASSWORD not defined in .env.local. Using default password AdminPassword123!. Set ADMIN_PASSWORD for production.');
        password = 'AdminPassword123!';
    }

    console.log(`Creating user: ${email}...`);

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: 'Administrador do Sistema',
                    job_title: 'Gestor de Planta',
                    role: 'admin'
                }
            }
        });

        if (error) {
            console.error('Error:', error.message);
        } else {
            console.log('User created successfully!');
            console.log(`ID: ${data.user?.id}`);
        }
    } catch (err) {
        console.error('Exception:', err);
    }
}

createAdmin();

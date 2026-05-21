import { createClient } from '@supabase/supabase-js';

import { readFileSync } from 'fs';

// Load .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) env[key.trim()] = valueParts.join('=').trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreAdmin() {
    const email = 'admin@manequip.com';
    const password = 'AdminPassword123!';

    console.log(`Restoring user: ${email}`);

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
        console.error('Error creating user:', error.message);
    } else {
        console.log('User created/restored successfully:', data.user?.id);
    }
}

restoreAdmin();

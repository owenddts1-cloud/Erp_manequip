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

async function testLogin() {
    console.log('Testing login for flavia@manpred.com...');
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'flavia@manpred.com',
        password: '@admin'
    });

    if (error) {
        console.error('❌ Login failed:', error.message);
    } else {
        console.log('✅ Login successful!');
        console.log('User ID:', data.user?.id);
        console.log('User Metadata:', data.user?.user_metadata);
        
        // Fetch profile
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user?.id)
            .single();
            
        if (profileErr) {
            console.error('Error fetching profile:', profileErr.message);
        } else {
            console.log('Profile:', profile);
        }
    }
}

testLogin();

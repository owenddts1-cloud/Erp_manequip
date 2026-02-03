import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) env[key.trim()] = valueParts.join('=').trim();
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...');
console.log(`📡 URL: ${url}`);

const supabase = createClient(url, key);

async function test() {
    try {
        // Test 1: Check if we can reach the API
        const { data: sectors, error: sectorsError } = await supabase
            .from('sectors')
            .select('*')
            .limit(5);

        if (sectorsError) {
            console.error('❌ Database Query Failed:', sectorsError.message);
            console.error('   Code:', sectorsError.code);
            process.exit(1);
        }

        console.log('✅ Connection Successful!');
        console.log(`   Found ${sectors?.length || 0} sectors`);

        // Test 2: Check profiles table
        const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        console.log(`   Profiles in database: ${count || 0}`);
        console.log('\n🎉 Supabase is working correctly from Terminal!');
        console.log('   If browser still fails, it is a LOCAL NETWORK/FIREWALL issue.');

    } catch (err) {
        console.error('❌ Connection Error:', err.message);
        process.exit(1);
    }
}

test();

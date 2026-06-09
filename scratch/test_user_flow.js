import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) env[key.trim()] = valueParts.join('=').trim();
});

const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

const client = createClient(url, anonKey, {
    auth: {
        persistSession: false
    }
});

async function run() {
    const testEmail = `thiago_auto_test_${Date.now()}@manequip.com`;
    const testPassword = 'Password123!';

    console.log(`Step 1: Signing up new user: ${testEmail}`);
    const { data: signUpData, error: signUpError } = await client.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
            data: {
                full_name: 'Thiago Auto Test',
                job_title: 'engenheiro'
            }
        }
    });

    if (signUpError) {
        console.error('❌ Sign up failed:', signUpError.message);
        return;
    }
    const userId = signUpData.user.id;
    console.log(`✅ Sign up success! User ID: ${userId}`);

    console.log('\nStep 2: Attempting login before approval...');
    const { data: loginData1, error: loginError1 } = await client.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
    });

    if (loginError1) {
        console.log(`❌ Login failed (expected): ${loginError1.message} (Code: ${loginError1.status})`);
    } else {
        console.log('⚠️ Login succeeded unexpectedly before approval!');
    }

    console.log('\nStep 3: Logging in as Admin to approve...');
    const { data: adminLogin, error: adminError } = await client.auth.signInWithPassword({
        email: 'admin@manequip.com',
        password: 'AdminPassword123!'
    });

    if (adminError) {
        console.error('❌ Admin login failed:', adminError.message);
        return;
    }
    console.log('✅ Admin login success!');

    // Create a new client authenticated as admin to perform the update
    const adminClient = createClient(url, anonKey, {
        auth: {
            persistSession: false
        }
    });
    await adminClient.auth.setSession(adminLogin.session);

    console.log('\nStep 4: Approving user as admin...');
    const { data: updateData, error: updateError } = await adminClient
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId)
        .select();

    if (updateError) {
        console.error('❌ Approval failed:', updateError.message);
        return;
    }
    console.log('✅ Approval success! Updated profiles:', updateData);

    console.log('\nStep 5: Attempting login as user AFTER approval...');
    const userClient = createClient(url, anonKey, {
        auth: {
            persistSession: false
        }
    });
    const { data: loginData2, error: loginError2 } = await userClient.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
    });

    if (loginError2) {
        console.error('❌ Login failed after approval:', loginError2.message);
    } else {
        console.log('🎉 Login succeeded after approval! Session JWT is valid.');
        
        // Fetch profile
        const { data: profile, error: profileError } = await userClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('❌ Failed to select profile:', profileError.message);
        } else {
            console.log('✅ Fetched profile after login:', profile);
        }
    }

    // Clean up user
    console.log('\nStep 6: Cleaning up test user...');
    const { error: deleteError } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', userId);
    
    if (deleteError) {
        console.error('❌ Profile deletion failed:', deleteError.message);
    } else {
        console.log('✅ Test profile deleted.');
    }
}

run();

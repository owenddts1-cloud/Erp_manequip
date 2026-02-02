import { createClient } from '@supabase/supabase-js';

// NEW SUPABASE PROJECT - MANEQUIP
// Configuração com suporte a PROXY (Bypass de Firewall)
// TEMPORARY DEBUG: Bypassing proxy to fix 500 error
// Hardcoded Fallbacks (Known Good Values)
const FALLBACK_URL = 'https://oaexnkhyyncptzfvkqyo.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXhua2h5eW5jcHR6ZnZrcXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjg0ODcsImV4cCI6MjA4Mjk0NDQ4N30.tS9BvFVQZpGMtoahMkpdfb4Q4F8uuAnFM3lnOYqesuA';

// Paranoid Check: Ensure Env Vars are actual valid strings, otherwise use fallback
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const SUPABASE_URL = (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http'))
    ? envUrl
    : FALLBACK_URL;

const SUPABASE_ANON_KEY = (envKey && typeof envKey === 'string' && envKey.length > 20)
    ? envKey
    : FALLBACK_KEY;

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false, // CRITICAL FIX: Keep disabled to prevent 431 Header Errors
        autoRefreshToken: true,
    },
});

// Log initialization logic to help debugging in production console
console.log(`🔌 Supabase Init: Using ${SUPABASE_URL === FALLBACK_URL ? 'Fallback' : 'Env'} URL`);
if (SUPABASE_URL !== FALLBACK_URL) console.log(`🔗 Target: ${SUPABASE_URL}`);


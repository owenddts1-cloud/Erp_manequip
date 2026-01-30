import { createClient } from '@supabase/supabase-js';

// NEW SUPABASE PROJECT - MANEQUIP
// Configuração com suporte a PROXY (Bypass de Firewall)
// TEMPORARY DEBUG: Bypassing proxy to fix 500 error
// const SUPABASE_URL = import.meta.env.DEV
//     ? (typeof window !== 'undefined' ? window.location.origin + '/supabase' : 'https://oaexnkhyyncptzfvkqyo.supabase.co')
//     : (import.meta.env.VITE_SUPABASE_URL || 'https://oaexnkhyyncptzfvkqyo.supabase.co');

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://oaexnkhyyncptzfvkqyo.supabase.co';

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXhua2h5eW5jcHR6ZnZrcXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjg0ODcsImV4cCI6MjA4Mjk0NDQ4N30.tS9BvFVQZpGMtoahMkpdfb4Q4F8uuAnFM3lnOYqesuA';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false, // CRITICAL FIX: Keep disabled to prevent 431 Header Errors
        autoRefreshToken: true,
    },
});

// Log initialization
if (import.meta.env.DEV) {
    console.log("✅ Supabase inicializado:", SUPABASE_URL.substring(0, 40) + "...");
}


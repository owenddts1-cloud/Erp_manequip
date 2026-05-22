import { createClient } from '@supabase/supabase-js';

// NEW SUPABASE PROJECT - MANEQUIP
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client with session persistence ENABLED
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce', // Security: PKCE flow for enhanced OAuth security
        storageKey: 'manequip-auth', // Security: Unique storage key to prevent cross-site conflicts
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
});

// Create secondary client for Admin operations (creating users) without logging out current user
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});

console.log('🔌 Supabase Initialized:', SUPABASE_URL);

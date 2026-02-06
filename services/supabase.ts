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
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
    },
});

console.log('🔌 Supabase Initialized:', SUPABASE_URL);

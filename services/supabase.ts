import { createClient } from '@supabase/supabase-js';

// NEW SUPABASE PROJECT - MANEQUIP
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client with session persistence ENABLED
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true, // ENABLED: Persist auth sessions
        autoRefreshToken: true,
        detectSessionInUrl: true, // Detect OAuth callbacks
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
        fetch: async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const options = init || {};
            const headers = new Headers(options.headers);
            headers.set('x-client-info', 'preventiva360-web');

            const MAX_RETRIES = 3;
            for (let i = 0; i < MAX_RETRIES; i++) {
                try {
                    return await fetch(url, { ...options, headers });
                } catch (error) {
                    console.warn(`🔄 Supabase fetch failed (attempt ${i + 1}/${MAX_RETRIES}), retrying...`, error);
                    if (i === MAX_RETRIES - 1) throw error;
                    // Exponential backoff: 1s, 2s, 4s
                    await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
                }
            }
            return fetch(url, { ...options, headers }); // Fallback (should be unreachable)
        },
    },
});

console.log('🔌 Supabase Initialized:', SUPABASE_URL);

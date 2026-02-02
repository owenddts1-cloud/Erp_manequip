import { createClient } from '@supabase/supabase-js';

// NEW SUPABASE PROJECT - MANEQUIP
// Hardcoded Values for Maximum Reliability
const SUPABASE_URL = 'https://oaexnkhyyncptzfvkqyo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXhua2h5eW5jcHR6ZnZrcXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjg0ODcsImV4cCI6MjA4Mjk0NDQ4N30.tS9BvFVQZpGMtoahMkpdfb4Q4F8uuAnFM3lnOYqesuA';

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

            try {
                return await fetch(url, { ...options, headers });
            } catch (error) {
                console.warn('🔄 Supabase fetch failed, retrying...', error);
                // Wait 1 second and retry once
                await new Promise(r => setTimeout(r, 1000));
                return fetch(url, { ...options, headers });
            }
        },
    },
});

console.log('🔌 Supabase Initialized:', SUPABASE_URL);

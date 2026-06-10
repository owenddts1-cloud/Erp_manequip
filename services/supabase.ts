import { createClient } from '@supabase/supabase-js';

// NEW SUPABASE PROJECT - MANEQUIP
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isBrowser = typeof window !== 'undefined';

// Secure Cookie Storage adapter for Supabase client
const secureCookieStorage = {
    getItem: (key: string): string | null => {
        if (!isBrowser) return null;
        const name = key + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return null;
    },
    setItem: (key: string, value: string): void => {
        if (!isBrowser) return;
        // Store session in cookie with Secure (HTTPS only) and SameSite=Lax
        // (Note: it cannot be HttpOnly because it is set by client-side JS)
        const isSecure = window.location.protocol === 'https:';
        document.cookie = `${key}=${encodeURIComponent(value)}; path=/; ${isSecure ? 'Secure;' : ''} SameSite=Lax; max-age=31536000`; // 1 year
    },
    removeItem: (key: string): void => {
        if (!isBrowser) return;
        const isSecure = window.location.protocol === 'https:';
        document.cookie = `${key}=; path=/; ${isSecure ? 'Secure;' : ''} SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0`;
    }
};

// Create Supabase client with session persistence ENABLED in Secure Cookies
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce', // Security: PKCE flow for enhanced OAuth security
        storageKey: 'manequip-auth', // Security: Unique storage key to prevent cross-site conflicts
        storage: secureCookieStorage,
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

console.log('🔌 Supabase Initialized with Cookie Storage:', SUPABASE_URL);

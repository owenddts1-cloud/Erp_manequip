import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = (typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_SUPABASE_URL : undefined) || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = (typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined) || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

export interface AuthenticatedUser {
    id: string;
    email?: string;
    role?: string;
}

/**
 * Security check: Extracts the Supabase JWT from the Authorization header and verifies it.
 * Returns the authenticated user metadata, or null if validation fails.
 */
export async function authenticateRequest(req: VercelRequest): Promise<AuthenticatedUser | null> {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.split(' ')[1];
        if (!token) return null;

        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return null;
        }

        return {
            id: user.id,
            email: user.email,
            role: user.role
        };
    } catch (err) {
        console.error('API Authentication security validation failed:', err);
        return null;
    }
}

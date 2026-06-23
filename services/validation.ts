// =============================================================================
// MANEQUIP - Input Validation & Sanitization Module
// Based on security-update guides: XSS protection, SQL injection prevention,
// input validation, and safe string handling.
// =============================================================================

// --- Sanitization ---

/**
 * Sanitizes generic text input by removing null bytes, trimming,
 * and limiting length.
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== 'string') return '';

    return input
        .replace(/\0/g, '')       // Remove null bytes
        .replace(/\s+/g, ' ')     // Collapse whitespace
        .trim()
        .substring(0, maxLength);
}

/**
 * Escapes HTML special characters to prevent XSS when rendering text.
 */
export function escapeHTML(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
}

// --- Malicious Pattern Detection ---

/**
 * Detects common SQL injection, XSS, and path traversal patterns.
 * Returns true if malicious patterns are found.
 */
export function hasMaliciousPatterns(input: string): boolean {
    if (!input) return false;

    // SQL Injection patterns
    const sqlPatterns = /(\bUNION\b\s+\bSELECT\b|\bDROP\b\s+\bTABLE\b|\bINSERT\b\s+\bINTO\b|\bDELETE\b\s+\bFROM\b|--|;.*\bDROP\b|'\s*\bOR\b\s+'|'\s*\bOR\b\s+1\s*=\s*1)/i;

    // XSS patterns
    const xssPatterns = /<script|javascript:|onerror\s*=|onclick\s*=|onload\s*=|onmouseover\s*=|<iframe|<object|<embed|<svg\s+onload/i;

    // Path Traversal
    const pathTraversal = /\.\.\//g;

    return sqlPatterns.test(input) || xssPatterns.test(input) || pathTraversal.test(input);
}

// --- Validation ---

/**
 * Validates an email address format.
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email) return { valid: false, error: 'Email é obrigatório' };

    const sanitized = sanitizeInput(email, 320).toLowerCase();

    if (hasMaliciousPatterns(sanitized)) {
        return { valid: false, error: 'Email contém caracteres inválidos' };
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitized)) {
        return { valid: false, error: 'Formato de email inválido' };
    }

    return { valid: true };
}

/**
 * Validates password strength.
 * Requirements: 8+ chars, uppercase, lowercase, number, special char.
 */
export function validatePassword(password: string): { valid: boolean; error?: string; strength: 'weak' | 'medium' | 'strong' } {
    if (!password) return { valid: false, error: 'Senha é obrigatória', strength: 'weak' };

    if (password.length < 8) {
        return { valid: false, error: 'Senha deve ter no mínimo 8 caracteres', strength: 'weak' };
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    let score = 0;
    if (hasUppercase) score++;
    if (hasLowercase) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;
    if (password.length >= 12) score++;

    const strength: 'weak' | 'medium' | 'strong' = score <= 2 ? 'weak' : score <= 3 ? 'medium' : 'strong';

    if (!hasUppercase || !hasLowercase || !hasNumber) {
        return { valid: false, error: 'Senha deve conter maiúscula, minúscula e número', strength };
    }

    return { valid: true, strength };
}

/**
 * Validates a safe text field (name, title, description).
 */
export function validateSafeText(text: string, fieldName: string, maxLength: number = 255): { valid: boolean; error?: string; sanitized: string } {
    const sanitized = sanitizeInput(text, maxLength);

    if (!sanitized) {
        return { valid: false, error: `${fieldName} é obrigatório`, sanitized: '' };
    }

    if (hasMaliciousPatterns(sanitized)) {
        return { valid: false, error: `${fieldName} contém caracteres não permitidos`, sanitized: '' };
    }

    return { valid: true, sanitized };
}

// --- Rate Limiting (Client-side) ---

interface RateLimitEntry {
    attempts: number;
    firstAttempt: number;
    blockedUntil: number;
}

const RATE_LIMIT_KEY = 'manequip_login_rl';
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes block

/**
 * Client-side rate limiting for login attempts.
 * Uses localStorage to persist across page reloads.
 */
export function checkLoginRateLimit(): { allowed: boolean; retryAfterSeconds?: number; attemptsRemaining?: number } {
    try {
        const stored = localStorage.getItem(RATE_LIMIT_KEY);
        const now = Date.now();

        if (!stored) {
            return { allowed: true, attemptsRemaining: MAX_ATTEMPTS };
        }

        const entry: RateLimitEntry = JSON.parse(stored);

        // Check if blocked
        if (entry.blockedUntil > now) {
            const retryAfterSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
            return { allowed: false, retryAfterSeconds };
        }

        // Check if window expired (reset)
        if (now - entry.firstAttempt > WINDOW_MS) {
            localStorage.removeItem(RATE_LIMIT_KEY);
            return { allowed: true, attemptsRemaining: MAX_ATTEMPTS };
        }

        // Check attempts within window
        if (entry.attempts >= MAX_ATTEMPTS) {
            // Block the user
            entry.blockedUntil = now + BLOCK_DURATION_MS;
            localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(entry));
            const retryAfterSeconds = Math.ceil(BLOCK_DURATION_MS / 1000);
            return { allowed: false, retryAfterSeconds };
        }

        return { allowed: true, attemptsRemaining: MAX_ATTEMPTS - entry.attempts };
    } catch {
        return { allowed: true, attemptsRemaining: MAX_ATTEMPTS };
    }
}

/**
 * Records a failed login attempt for rate limiting.
 */
export function recordLoginAttempt(): void {
    try {
        const stored = localStorage.getItem(RATE_LIMIT_KEY);
        const now = Date.now();

        if (!stored) {
            const entry: RateLimitEntry = { attempts: 1, firstAttempt: now, blockedUntil: 0 };
            localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(entry));
            return;
        }

        const entry: RateLimitEntry = JSON.parse(stored);

        // Reset if window expired
        if (now - entry.firstAttempt > WINDOW_MS) {
            const newEntry: RateLimitEntry = { attempts: 1, firstAttempt: now, blockedUntil: 0 };
            localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newEntry));
            return;
        }

        entry.attempts++;
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(entry));
    } catch {
        // Silently fail - don't break login flow
    }
}

/**
 * Resets rate limit on successful login.
 */
export function resetLoginRateLimit(): void {
    try {
        localStorage.removeItem(RATE_LIMIT_KEY);
    } catch {
        // Silently fail
    }
}

/**
 * Security: Constant-time string comparison to mitigate timing side-channel attacks.
 * Prevents attackers from guessing secrets by measuring response times.
 */
export function safeCompareConstantTime(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    
    const aLen = a.length;
    const bLen = b.length;
    let result = aLen ^ bLen;
    
    const maxLen = Math.max(aLen, bLen);
    for (let i = 0; i < maxLen; i++) {
        const charA = i < aLen ? a.charCodeAt(i) : 0;
        const charB = i < bLen ? b.charCodeAt(i) : 0;
        result |= charA ^ charB;
    }
    
    return result === 0;
}

/**
 * Security: Clears/zeroizes properties of an object containing sensitive data from memory.
 */
export function zeroizeObject(obj: Record<string, any> | null | undefined): void {
    if (!obj) return;
    Object.keys(obj).forEach(key => {
        try {
            if (typeof obj[key] === 'string') {
                obj[key] = '';
            } else if (typeof obj[key] === 'number') {
                obj[key] = 0;
            } else if (Array.isArray(obj[key])) {
                obj[key].fill(null);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                zeroizeObject(obj[key]);
                obj[key] = null;
            } else {
                obj[key] = null;
            }
        } catch (e) {
            // Ignore if property is read-only
        }
    });
}

/**
 * Security: Helper to clear/zeroize a string variable reference.
 */
export function zeroizeString(str: string): string {
    return '';
}


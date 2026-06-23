import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';


// --- Types ---
type ThemeMode = 'light' | 'dark' | 'contrast';

interface PreferencesContextType {
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    language: string;
    setLanguage: (lang: string) => void;
    timezone: string;
    setTimezone: (tz: string) => void;
    t: (key: string) => string;
    formatDate: (date: Date | string) => string;
    userProfile: { name: string; role: string; email: string; id: string; job_title?: string; avatar_url?: string } | null;
}


// --- Context ---
const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 1. Theme (Default to 'dark')
    const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem('theme');
        return (saved === 'light' || saved === 'contrast') ? saved : 'dark';
    });

    // 2. Language
    const [language, setLanguageState] = useState(() => localStorage.getItem('language') || 'pt');

    // 3. Timezone
    const [timezone, setTimezoneState] = useState(() => localStorage.getItem('timezone') || '(GMT-03:00) Brasília');

    // 4. Translations
    const [translations, setTranslations] = useState<Record<string, string>>({});

    // 5. User Profile (RBAC)
    const [userProfile, setUserProfile] = useState<{ name: string; role: string; email: string; id: string; job_title?: string; avatar_url?: string } | null>(null);

    // --- Effects ---

    // Sync User Profile and Role
    useEffect(() => {
        const fetchAndSetProfile = async (user: any) => {
            if (!user) {
                setUserProfile(null);
                return;
            }

            const email = (user.email || '').toLowerCase();
            let role = 'Técnico';
            let profileData: any = null;

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role, full_name, job_title, avatar_url, is_approved')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    if (error.code !== 'PGRST116') {
                        console.warn("Profile fetch error:", error.message);
                    }
                } else {
                    profileData = data;
                }

                // Determine Role
                if (profileData?.role) {
                    role = profileData.role;
                }

            } catch (err) {
                console.error("Critical Profile Fetch Error:", err);
            }

            const isSystemAdmin = email === 'admin@manequip.com' || email === 'data@manequip.com';

            // OVERRIDE: Master Admin and Data Admin always get Administrator
            if (isSystemAdmin) {
                role = 'Administrator';
            }

            // Security: Fail-closed. If profile doesn't exist or is not approved, and not system admin, sign out.
            const isApproved = profileData?.is_approved === true || isSystemAdmin;
            if ((!profileData || !isApproved) && !isSystemAdmin) {
                console.warn("Unauthorized access: unapproved or missing profile.");
                await supabase.auth.signOut();
                setUserProfile(null);
                return;
            }

            setUserProfile({
                id: user.id,
                email,
                name: profileData?.full_name || user.user_metadata?.full_name || email.split('@')[0] || 'Usuário',
                role,
                job_title: profileData?.job_title,
                avatar_url: profileData?.avatar_url
            });
        };


        // Initial check
        // Assuming 'supabase' is available in scope
        supabase.auth.getUser().then(({ data: { user } }) => fetchAndSetProfile(user));

        // Listen for changes
        // Assuming 'supabase' is available in scope
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            fetchAndSetProfile(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Apply Theme
    useEffect(() => {
        // Validation: Ensure valid theme
        const validTheme = (['light', 'dark', 'contrast'] as const).includes(themeMode) ? themeMode : 'dark';

        document.documentElement.setAttribute('modo-light-dark', validTheme);
        localStorage.setItem('theme', validTheme);

        // Helper for Tailwind or old styles
        document.documentElement.classList.toggle('dark', validTheme === 'dark' || validTheme === 'contrast');
    }, [themeMode]);

    // Load Translations (Async JSON)
    useEffect(() => {
        const loadTranslations = async () => {
            try {
                const langCode = getLangCode(language);
                const response = await fetch(`/locales/${langCode}.json`);
                if (response.ok) {
                    const data = await response.json();
                    setTranslations(data);

                    // Update HTML lang attribute for SEO/Accessibility
                    document.documentElement.lang = langCode === 'pt' ? 'pt-BR' : 'en-US';
                } else {
                    console.error(`Failed to load translations for ${langCode}`);
                }
            } catch (error) {
                console.error("Error loading translations:", error);
            }
        };
        loadTranslations();
        localStorage.setItem('language', language);
    }, [language]);

    // Save Timezone
    useEffect(() => {
        localStorage.setItem('timezone', timezone);
    }, [timezone]);

    // --- Helpers ---

    // Map complex dropdown names to simple json filenames
    const getLangCode = (code: string) => {
        const map: Record<string, string> = {
            'Português (Brasil)': 'pt',
            'English (United States)': 'en',
            'Español (España)': 'es',
            'pt': 'pt',
            'en': 'en',
            'es': 'es'
        };
        return map[code] || 'pt';
    };

    const setThemeMode = (mode: ThemeMode) => {
        // Immediate Sync for reactivity
        document.documentElement.setAttribute('modo-light-dark', mode);
        setThemeModeState(mode);
    };
    const setLanguage = (lang: string) => setLanguageState(lang);
    const setTimezone = (tz: string) => setTimezoneState(tz);

    const t = (key: string) => {
        const keys = key.split('.');
        let value: any = translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Return raw key if path not found
            }
        }

        return value || key;
    };

    const formatDate = (date: Date | string): string => {
        const d = new Date(date);
        const tzMap: Record<string, string> = {
            '(GMT-03:00) Brasília': 'America/Sao_Paulo',
            '(GMT-04:00) Manaus': 'America/Manaus',
            '(GMT-05:00) New York': 'America/New_York',
            '(GMT+00:00) London': 'Europe/London',
            '(GMT+01:00) Paris': 'Europe/Paris',
            '(GMT+09:00) Tokyo': 'Asia/Tokyo'
        };

        const timeZone = tzMap[timezone] || 'America/Sao_Paulo';
        const langCode = getLangCode(language) === 'pt' ? 'pt-BR' : 'en-US'; // Simplified locale

        return new Intl.DateTimeFormat(langCode, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone
        }).format(d);
    };

    return (
        <PreferencesContext.Provider value={{
            themeMode, setThemeMode,
            language, setLanguage,
            timezone, setTimezone,
            t, formatDate,
            userProfile
        }}>
            {children}
        </PreferencesContext.Provider>
    );
};

export const usePreferences = () => {
    const context = useContext(PreferencesContext);
    if (context === undefined) {
        throw new Error('usePreferences must be used within a PreferencesProvider');
    }
    return context;
};

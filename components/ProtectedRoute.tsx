import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../services/supabase';

const ProtectedRoute = () => {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession);
            setLoading(false);
        };

        fetchSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="text-primary animate-pulse">
                        <span className="material-symbols-outlined text-[48px]">hub</span>
                    </div>
                    <p className="text-slate-400 font-display text-sm tracking-wider animate-pulse">CARREGANDO SISTEMA...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;

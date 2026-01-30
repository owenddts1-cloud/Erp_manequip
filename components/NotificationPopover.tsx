import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface NotificationProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Notification {
    id: string;
    title: string;
    desc: string;
    time: string;
    type: 'success' | 'info' | 'warning';
}

const NotificationPopover: React.FC<NotificationProps> = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchRecentActivity();
        }

        // Subscribe to real-time changes
        const channel = supabase
            .channel('realtime-notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'work_orders' }, (payload) => {
                const wo = payload.new as any;
                addNotification({
                    id: `new-${wo.id}`,
                    title: `Novo Chamado #${wo.display_id || wo.id.slice(0, 5)}`,
                    desc: wo.descricao?.slice(0, 50) || 'Chamado registrado',
                    time: 'Agora',
                    type: 'info'
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'work_orders' }, (payload) => {
                const wo = payload.new as any;
                const old = payload.old as any;
                if (wo.status !== old.status) {
                    const isConcluded = ['Concluída', 'Finalizada', 'Concluído'].includes(wo.status);
                    addNotification({
                        id: `upd-${wo.id}-${Date.now()}`,
                        title: `Chamado #${wo.display_id || wo.id.slice(0, 5)} ${isConcluded ? 'Concluído' : 'Atualizado'}`,
                        desc: `Status: ${wo.status}`,
                        time: 'Agora',
                        type: isConcluded ? 'success' : 'info'
                    });
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario' }, (payload) => {
                const item = payload.new as any;
                if (item && item.quantidade_estoque <= item.estoque_minimo) {
                    addNotification({
                        id: `inv-${item.id}-${Date.now()}`,
                        title: `Estoque Crítico: ${item.nome_peca}`,
                        desc: `Apenas ${item.quantidade_estoque} unidades (mín: ${item.estoque_minimo})`,
                        time: 'Agora',
                        type: 'warning'
                    });
                }
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [isOpen]);

    const addNotification = (notif: Notification) => {
        setNotifications(prev => [notif, ...prev.slice(0, 9)]); // Max 10 notifications
    };

    const fetchRecentActivity = async () => {
        setLoading(true);
        try {
            // Get recent work orders
            const { data: recentWOs } = await supabase
                .from('work_orders')
                .select('id, display_id, descricao, status, tipo, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            // Get critical inventory items
            const { data: criticalItems } = await supabase
                .from('inventario')
                .select('id, nome_peca, quantidade_estoque, estoque_minimo')
                .filter('quantidade_estoque', 'lte', 'estoque_minimo')
                .limit(3);

            const notifs: Notification[] = [];

            // Add recent work order notifications
            recentWOs?.forEach(wo => {
                const isConcluded = ['Concluída', 'Finalizada', 'Concluído'].includes(wo.status);
                const timeDiff = getTimeDiff(wo.created_at);
                notifs.push({
                    id: wo.id,
                    title: isConcluded ? `Chamado #${wo.display_id || wo.id.slice(0, 5)} Concluído` : `${wo.tipo}: #${wo.display_id || wo.id.slice(0, 5)}`,
                    desc: wo.descricao?.slice(0, 40) || wo.status,
                    time: timeDiff,
                    type: isConcluded ? 'success' : wo.tipo === 'Preventiva' ? 'info' : 'warning'
                });
            });

            // Add critical inventory notifications
            criticalItems?.forEach(item => {
                notifs.push({
                    id: `inv-${item.id}`,
                    title: `Estoque Crítico`,
                    desc: `${item.nome_peca}: ${item.quantidade_estoque}/${item.estoque_minimo}`,
                    time: 'Atenção',
                    type: 'warning'
                });
            });

            setNotifications(notifs);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const getTimeDiff = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Agora';
        if (mins < 60) return `${mins} min`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h atrás`;
        const days = Math.floor(hours / 24);
        return `${days}d atrás`;
    };

    const markAllRead = () => {
        setNotifications([]);
    };

    if (!isOpen) return null;

    return (
        <div className="absolute right-0 top-14 w-80 bg-surface-dark border border-border-dark rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between p-4 border-b border-border-dark">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">notifications</span>
                    Notificações
                    {notifications.length > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{notifications.length}</span>
                    )}
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white">
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center">
                        <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                    </div>
                ) : notifications.length > 0 ? (
                    notifications.map(n => (
                        <div key={n.id} className="p-4 border-b border-border-dark/50 hover:bg-slate-800/50 transition-colors cursor-pointer">
                            <div className="flex gap-3">
                                <div className={`mt-1 size-2 rounded-full shrink-0 ${n.type === 'success' ? 'bg-emerald-500' :
                                        n.type === 'warning' ? 'bg-amber-500' : 'bg-sky-500'
                                    }`}></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{n.title}</p>
                                    <p className="text-xs text-slate-400 mt-0.5 truncate">{n.desc}</p>
                                    <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase">{n.time}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        <span className="material-symbols-outlined text-3xl mb-2 opacity-30">notifications_off</span>
                        <p>Nenhuma notificação recente.</p>
                    </div>
                )}
            </div>
            <div className="p-3 text-center border-t border-border-dark bg-surface-dark/50 rounded-b-xl">
                <button onClick={markAllRead} className="text-xs font-bold text-primary hover:text-primary-hover">
                    Marcar todas como lidas
                </button>
            </div>
        </div>
    );
};

export default NotificationPopover;

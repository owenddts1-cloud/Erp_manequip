import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const Calendar: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday

    useEffect(() => {
        fetchEvents();
    }, [currentDate]);

    const fetchEvents = async () => {
        setLoading(true);
        // Fetch preventives for the broad range
        const { data, error } = await supabase
            .from('work_orders')
            .select('*, ativos(nome)')
            //.eq('tipo', 'Preventiva') // User wants ALL work orders or just preventives? "as preventivas de chamados tambem tem que estar linkadas" implies emphasis, but usually calendar shows all.
            // Let's show all but distinguish style
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        if (data) setEvents(data);
        setLoading(false);
    };

    const days = [];
    let day = new Date(startDate);
    while (day <= endDate) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const isSameDay = (d1: Date, d2: string) => {
        const target = new Date(d2);
        // Compare treating local/UTC carefulness - simple string split if needed, but Date compare usually works for day
        return d1.toDateString() === target.toDateString();
    };

    return (
        <div className="flex-1 flex flex-col p-6 overflow-hidden h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Calendário de Manutenção</h1>
                    <p className="text-slate-400">Planejamento visual de preventivas e ordens de serviço.</p>
                </div>
                <div className="flex items-center bg-surface-dark border border-border-dark rounded-lg p-1">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-700/50 rounded-md text-slate-300 hover:text-white"><span className="material-symbols-outlined">chevron_left</span></button>
                    <span className="mx-4 font-bold text-white min-w-[150px] text-center capitalize">
                        {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-700/50 rounded-md text-slate-300 hover:text-white"><span className="material-symbols-outlined">chevron_right</span></button>
                </div>
            </div>

            <div className="flex-1 bg-surface-dark border border-border-dark rounded-xl overflow-y-auto shadow-2xl flex flex-col">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-border-dark bg-slate-900/50">
                    {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(d => (
                        <div key={d} className="p-4 text-center text-xs font-bold uppercase text-slate-500 tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                    {days.map((d, i) => {
                        const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                        const isToday = d.toDateString() === new Date().toDateString();
                        const dayEvents = events.filter(e => isSameDay(d, e.created_at) || (e.data_agendamento && isSameDay(d, e.data_agendamento)));

                        return (
                            <div key={i} className={`min-h-[120px] border-b border-r border-border-dark p-2 transition-colors hover:bg-slate-800/20 ${!isCurrentMonth ? 'bg-slate-900/30' : ''}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-sm font-medium size-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white shadow-neon' : isCurrentMonth ? 'text-slate-300' : 'text-slate-600'}`}>
                                        {d.getDate()}
                                    </span>
                                    {dayEvents.length > 0 && <span className="text-[10px] text-slate-500 font-mono">{dayEvents.length} ordens</span>}
                                </div>

                                <div className="space-y-1">
                                    {dayEvents.map(ev => (
                                        <div
                                            key={ev.id}
                                            className={`text-[10px] p-1.5 rounded border truncate cursor-pointer transition-all hover:scale-105 ${ev.tipo === 'Preventiva'
                                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20'
                                                : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                                }`}
                                            title={`${ev.tipo} - ${ev.ativos?.nome || 'Ativo S/N'}`}
                                        >
                                            <span className="font-bold mr-1 block">{ev.ativos?.nome ? ev.ativos.nome.slice(0, 15) + '...' : 'Ativo'}</span>
                                            <span className="opacity-70">#{ev.id.slice(0, 4)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Calendar;

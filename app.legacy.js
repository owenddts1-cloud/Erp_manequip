// Preventiva 360 - Core Logic

// CONSTANTS - USER MUST REPLACE THESE
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL; // https://xyz.supabase.co
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// State
const state = {
    user: null,
    currentRoute: 'dashboard',
    data: {
        ativos: [],
        chamados: [],
        inventario: []
    }
};

// Router
const router = {
    init: () => {
        // Simple routing based on hash or default 'dashboard'
        const route = window.location.hash.replace('#', '') || 'dashboard';
        router.navigate(route);

        window.addEventListener('hashchange', () => {
            router.navigate(window.location.hash.replace('#', ''));
        });
    },
    navigate: async (route) => {
        state.currentRoute = route;

        // Update Sidebar UI
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active-nav', 'bg-primary/10', 'border-primary/20', 'text-primary');
            el.classList.add('text-slate-400', 'hover:bg-surface-dark');
            if (el.getAttribute('onclick')?.includes(route)) {
                el.classList.add('active-nav', 'bg-primary/10', 'border', 'border-primary/20', 'text-primary');
                el.classList.remove('text-slate-400', 'hover:bg-surface-dark');
            }
        });

        // Update Title
        const titles = {
            'dashboard': 'Dashboard',
            'ativos': 'Gestão de Ativos',
            'chamados': 'Ordens de Serviço',
            'inventario': 'Inventário de Peças'
        };
        document.getElementById('page-title').innerText = titles[route] || 'Preventiva 360';

        // Load Content
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = '<div class="flex items-center justify-center h-full"><span class="loader text-primary">Carregando...</span></div>';

        // Fetch Data & Render
        await app.loadData(route);
        app.render(route);
    }
};

// Application Logic
const app = {
    init: async () => {
        // Check Auth
        /* 
        const { data: { session } } = await _supabase.auth.getSession();
        if (!session && !window.location.href.includes('login.html')) {
            // Redirect to login (mock for now)
            // window.location.href = 'login.html'; 
            console.log('User not logged in (Mock mode active)');
            state.user = { email: 'demo@preventiva360.com' };
        } else {
            state.user = session?.user;
        }
        */

        // Mock User for Demo
        state.user = { email: 'eng.carlos@preventiva.com' };
        router.init();
    },

    loadData: async (route) => {
        if (route === 'dashboard') {
            await Promise.all([app.fetchAtivos(), app.fetchChamados()]);
        } else if (route === 'ativos') {
            await app.fetchAtivos();
        } else if (route === 'chamados') {
            await app.fetchChamados();
        } else if (route === 'inventario') {
            await app.fetchInventario();
        }
    },

    fetchAtivos: async () => {
        const { data, error } = await _supabase.from('ativos').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error fetching ativos:', error);
        else state.data.ativos = data || [];
    },

    fetchChamados: async () => {
        const { data, error } = await _supabase.from('chamados').select('*, ativos(nome, tag_id)').order('data_abertura', { ascending: false });
        if (error) console.error('Error fetching chamados:', error);
        else state.data.chamados = data || [];
    },

    fetchInventario: async () => {
        const { data, error } = await _supabase.from('inventario').select('*').order('nome_peca', { ascending: true });
        if (error) console.error('Error fetching inventario:', error);
        else state.data.inventario = data || [];
    },

    render: (route) => {
        const contentArea = document.getElementById('content-area');
        const template = document.getElementById(`tpl-${route}`);

        if (!template) {
            contentArea.innerHTML = '<p class="text-white">Página em construção.</p>';
            return;
        }

        const clone = template.content.cloneNode(true);
        contentArea.innerHTML = '';
        contentArea.appendChild(clone);

        // Post-render implementations
        if (route === 'dashboard') app.renderDashboard();
        if (route === 'ativos') app.renderAtivosList();
        if (route === 'chamados') app.renderChamadosList();
        if (route === 'inventario') app.renderInventarioList();
    },

    renderDashboard: () => {
        document.getElementById('dash-ativos-criticos').innerText = state.data.ativos.filter(a => a.criticidade === 'Alta').length;
        document.getElementById('dash-chamados-abertos').innerText = state.data.chamados.filter(c => c.status === 'Em Progresso').length;
    },

    renderAtivosList: () => {
        const tbody = document.getElementById('ativos-list');
        tbody.innerHTML = state.data.ativos.map(ativo => `
            <tr class="hover:bg-white/5 transition-colors">
                <td class="px-6 py-4 font-mono text-xs text-white">${ativo.tag_id}</td>
                <td class="px-6 py-4 font-medium text-white">${ativo.nome}</td>
                <td class="px-6 py-4">${ativo.setor || '-'}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded text-xs font-bold ${ativo.criticidade === 'Alta' ? 'bg-red-500/10 text-red-500' : 'bg-slate-700 text-slate-400'}">
                        ${ativo.criticidade}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <span class="h-2 w-2 rounded-full ${ativo.status === 'Operacional' ? 'bg-green-500' : 'bg-amber-500'}"></span>
                        ${ativo.status}
                    </div>
                </td>
                <td class="px-6 py-4 text-right">
                    <button class="text-primary hover:text-white transition-colors"><span class="material-symbols-outlined text-[18px]">edit</span></button>
                </td>
            </tr>
        `).join('');
    },

    renderChamadosList: () => {
        const list = document.getElementById('chamados-list');
        if (state.data.chamados.length === 0) {
            list.innerHTML = '<p class="text-slate-500 text-center py-8">Nenhum chamado aberto.</p>';
            return;
        }

        list.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
        list.innerHTML = state.data.chamados.map(chamado => `
            <div class="bg-surface-dark border border-border-dark rounded-xl p-4 hover:border-primary/30 transition-colors">
                <div class="flex justify-between items-start mb-3">
                    <span class="text-slate-500 font-mono text-xs">${chamado.numero_chamado}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${chamado.prioridade === 'Alta' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'}">
                        ${chamado.prioridade}
                    </span>
                </div>
                <h4 class="text-white font-bold mb-1">${chamado.ativos?.nome || 'Equipamento não especificado'}</h4>
                <p class="text-slate-400 text-sm line-clamp-2 mb-4 h-10">${chamado.descricao}</p>
                <div class="flex items-center justify-between border-t border-white/5 pt-3">
                    <span class="text-xs text-slate-500">${new Date(chamado.data_abertura).toLocaleDateString()}</span>
                    <div class="flex gap-2">
                        <button class="text-sm font-medium text-slate-400 hover:text-white transition-colors">Detalhes</button>
                        ${chamado.status === 'Em Progresso' ?
                `<button onclick="app.openModal('finish-chamado', '${chamado.id}')" class="text-sm font-bold text-green-500 hover:text-green-400 transition-colors">Finalizar</button>`
                : '<span class="text-xs text-green-500 font-bold">Concluído</span>'}
                    </div>
                </div>
            </div>
        `).join('');
    },

    renderInventarioList: () => {
        const tbody = document.getElementById('inventario-list');
        tbody.innerHTML = state.data.inventario.map(item => `
            <tr class="hover:bg-white/5 transition-colors">
                <td class="px-6 py-4 font-medium text-white">${item.nome_peca}</td>
                <td class="px-6 py-4 font-mono text-xs text-slate-400">${item.sku}</td>
                <td class="px-6 py-4">${item.categoria || '-'}</td>
                <td class="px-6 py-4 font-bold ${item.quantidade_estoque < 5 ? 'text-red-500' : 'text-green-500'}">${item.quantidade_estoque}</td>
                <td class="px-6 py-4">R$ ${item.valor_unitario}</td>
                <td class="px-6 py-4">
                    <button class="text-slate-400 hover:text-white transition-colors" title="Adicionar Estoque"><span class="material-symbols-outlined text-[18px]">add_circle</span></button>
                </td>
            </tr>
        `).join('');
    },

    openModal: async (modalId, param) => {
        const container = document.getElementById('modal-container');
        let templateId = `tpl-modal-${modalId}`;

        // Dynamic template handling for finish-chamado if needed, using generic or specific
        // For simplicity, we assume we need to inject the modal HTML if it doesn't exist or use a pre-existing one
        // Ideally we should have the template in index.html. I will inject it dynamically here for "finish-chamado" since I missed adding it to index.html

        if (modalId === 'finish-chamado') {
            // Inject modal HTML dynamically for this specific complex case
            container.innerHTML = `
                <div class="bg-surface-dark border border-border-dark rounded-xl p-6 w-full max-w-lg shadow-2xl">
                    <h3 class="text-xl font-bold text-white mb-4">Finalizar Manutenção</h3>
                    <p class="text-slate-400 text-sm mb-4">Chamado ID: ${param}</p>
                    <form id="form-finish-chamado" class="flex flex-col gap-4">
                        <input type="hidden" name="chamado_id" value="${param}">
                        <div>
                            <label class="text-xs text-slate-400 uppercase font-bold block mb-1">Observações Técnicas</label>
                            <textarea name="observacoes" required rows="3" class="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white focus:border-primary outline-none resize-none"></textarea>
                        </div>
                        <div>
                            <label class="text-xs text-slate-400 uppercase font-bold block mb-1">Peça Utilizada (Opcional)</label>
                            <select name="peca_id" class="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white focus:border-primary outline-none">
                                <option value="">Nenhuma peça trocada</option>
                                ${state.data.inventario.map(p => `<option value="${p.id}">${p.nome_peca} (Estoque: ${p.quantidade_estoque})</option>`).join('')}
                            </select>
                        </div>
                        <div id="qty-container" class="hidden">
                             <label class="text-xs text-slate-400 uppercase font-bold block mb-1">Quantidade</label>
                             <input type="number" name="quantidade" value="1" min="1" class="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-white focus:border-primary outline-none">
                        </div>
                        
                        <div class="flex items-center gap-2 mt-2">
                             <input type="checkbox" id="schedule-next" name="schedule_next" class="rounded bg-background-dark border-border-dark text-primary focus:ring-0">
                             <label for="schedule-next" class="text-sm text-slate-300">Agendar Próxima Preventiva (+30 dias)</label>
                        </div>

                        <div class="flex justify-end gap-2 mt-4">
                            <button type="button" onclick="app.closeModal()" class="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
                            <button type="submit" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold">Concluir</button>
                        </div>
                    </form>
                </div>
             `;

            // Dynamic behavior
            setTimeout(() => {
                const select = document.querySelector('[name="peca_id"]');
                const qty = document.getElementById('qty-container');
                select.addEventListener('change', (e) => {
                    if (e.target.value) qty.classList.remove('hidden');
                    else qty.classList.add('hidden');
                });

                document.getElementById('form-finish-chamado').onsubmit = app.handleFinishChamado;
            }, 0);

        } else {
            const template = document.getElementById(templateId);
            if (!template) return;
            container.innerHTML = '';
            container.appendChild(template.content.cloneNode(true));

            // Re-attach event listeners for standard modals
            if (modalId === 'add-chamado') {
                document.querySelector('[name="numero_chamado"]').value = '#' + Math.floor(Math.random() * 9000 + 1000);
                document.getElementById('form-add-chamado').onsubmit = async (e) => {
                    e.preventDefault();
                    // ... (same logic as before, just need to ensure it's bound)
                    const formData = new FormData(e.target);
                    const newChamado = {
                        numero_chamado: formData.get('numero_chamado'),
                        descricao: formData.get('descricao'),
                        prioridade: formData.get('prioridade'),
                        status: 'Em Progresso',
                        data_abertura: new Date()
                    };
                    const { error } = await _supabase.from('chamados').insert([newChamado]);
                    if (!error) { app.closeModal(); app.fetchChamados().then(() => app.render('chamados')); }
                    else alert(error.message);
                };
            }
            if (modalId === 'add-asset') {
                document.getElementById('form-add-asset').onsubmit = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const newAsset = {
                        nome: formData.get('nome'),
                        tag_id: formData.get('tag_id'),
                        setor: formData.get('setor'),
                        criticidade: formData.get('criticidade'),
                        modelo: formData.get('modelo'),
                        status: 'Operacional'
                    };
                    const { error } = await _supabase.from('ativos').insert([newAsset]);
                    if (!error) { app.closeModal(); app.fetchAtivos().then(() => app.render('ativos')); }
                    else alert(error.message);
                }
            }
        }

        container.classList.remove('hidden');
    },

    handleFinishChamado: async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const chamadoId = formData.get('chamado_id');
        const observacoes = formData.get('observacoes');
        const pecaId = formData.get('peca_id');
        const quantidade = parseInt(formData.get('quantidade') || 0);
        const scheduleNext = formData.get('schedule_next');

        // 1. Update Chamado Status
        const { error: errChamado } = await _supabase
            .from('chamados')
            .update({ status: 'Concluído', observacoes_finais: observacoes })
            .eq('id', chamadoId);

        if (errChamado) { alert('Erro ao atualizar chamado'); return; }

        // 2. Deduct Inventory (Logic)
        if (pecaId && quantidade > 0) {
            // Get current stock
            const item = state.data.inventario.find(i => i.id === pecaId);
            if (item) {
                const newQty = item.quantidade_estoque - quantidade;
                const { error: errInv } = await _supabase
                    .from('inventario')
                    .update({ quantidade_estoque: newQty })
                    .eq('id', pecaId);

                if (errInv) console.error('Erro ao baixar estoque', errInv);
            }
        }

        // 3. Schedule Next Preventive (Logic)
        if (scheduleNext) {
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + 30); // +30 days logic

            const newChamado = {
                numero_chamado: '#PREV-' + Math.floor(Math.random() * 1000),
                descricao: 'Manutenção Preventiva Automática',
                prioridade: 'Média',
                status: 'Pendente',
                data_limite: nextDate.toISOString(),
                data_abertura: new Date().toISOString()
            };
            await _supabase.from('chamados').insert([newChamado]);
        }

        alert('Manutenção Finalizada com Sucesso!');
        app.closeModal();
        app.loadData('chamados');
        app.render('chamados'); // Refresh list
    },

    closeModal: () => {
        document.getElementById('modal-container').classList.add('hidden');
    },

    logout: async () => {
        await _supabase.auth.signOut();
        window.location.reload();
    }
};

// Start
document.addEventListener('DOMContentLoaded', app.init);

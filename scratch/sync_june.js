import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envContent = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
        let val = valueParts.join('=').trim();
        if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1);
        }
        env[key.trim()] = val;
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const juneData = [
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "ESTUFA MT01",
    "tag": "1312",
    "periodicidade": "MENSAL",
    "setor_localizacao": "MOTOR",
    "responsavel": "WENDEL"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "ESTUFA MT02",
    "tag": "3318",
    "periodicidade": "MENSAL",
    "setor_localizacao": "MOTOR",
    "responsavel": "WENDEL"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "ESTUFA TRF01",
    "tag": "3377",
    "periodicidade": "MENSAL",
    "setor_localizacao": "TRAFO",
    "responsavel": "HUGO"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "ESTUFA TRF02",
    "tag": "4775",
    "periodicidade": "MENSAL",
    "setor_localizacao": "TRAFO",
    "responsavel": "WENDEL"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "ESTUFA TRF03",
    "tag": null,
    "periodicidade": "MENSAL",
    "setor_localizacao": "TRAFO",
    "responsavel": "DANIEL"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "ESTUFA TRF04",
    "tag": "6138",
    "periodicidade": "MENSAL",
    "setor_localizacao": "CARPINTARIA BOBINAS TRAFO",
    "responsavel": "DANIEL"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "MANDRILHADORA 1",
    "tag": "5602",
    "periodicidade": "MENSAL",
    "setor_localizacao": "USINAGEM",
    "responsavel": "GENILSON"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "MÁQUINA DE LAVAR 1 KARCHER",
    "tag": "11875",
    "periodicidade": "MENSAL",
    "setor_localizacao": "LAVADOR MOTOR",
    "responsavel": "VINÍCIUS"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "MÁQUINA DE LAVAR 2 KARCHER",
    "tag": "10304",
    "periodicidade": "MENSAL",
    "setor_localizacao": "LAVADOR TRAFO",
    "responsavel": "DANIEL"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "MÁQUINA DE LAVAR 3 KARCHER",
    "tag": null,
    "periodicidade": "MENSAL",
    "setor_localizacao": "LAVADOR TRAFO",
    "responsavel": "ALDEMAR"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "NOBREAK 1 CPD ADM",
    "tag": null,
    "periodicidade": "MENSAL",
    "setor_localizacao": "CPD ADM",
    "responsavel": "LUAN"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "NOBREAK 2 CPD MOTOR",
    "tag": null,
    "periodicidade": "MENSAL",
    "setor_localizacao": "CPD MOTOR",
    "responsavel": "LUAN"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "NOBREAK 3 CPD TRAFO",
    "tag": null,
    "periodicidade": "MENSAL",
    "setor_localizacao": "CPD TRAFO",
    "responsavel": "LUAN"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "TORNO 1 NARDINI AM 650 VS",
    "tag": null,
    "periodicidade": "MENSAL",
    "setor_localizacao": "USINAGEM",
    "responsavel": "SAMIR"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "TORNO 2 ROMI - S20A",
    "tag": "2313",
    "periodicidade": "MENSAL",
    "setor_localizacao": "USINAGEM",
    "responsavel": "GENILSON"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "TORNO 3 TORMAX 30B",
    "tag": "4024",
    "periodicidade": "MENSAL",
    "setor_localizacao": "USINAGEM",
    "responsavel": "ALDEMAR"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "TORNO 4 TORMAX 30B",
    "tag": "LOCADO LOCADO",
    "periodicidade": "MENSAL",
    "setor_localizacao": "USINAGEM",
    "responsavel": "HUGO"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "TORNO 5 ROMI - ES40B",
    "tag": null,
    "periodicidade": "MENSAL",
    "setor_localizacao": "USINAGEM",
    "responsavel": "GENILSON"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "BOBINADEIRA 20 HORIZONTAL",
    "tag": "4165",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "PÓLO",
    "responsavel": "VINÍCIUS"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "BOMBA DE VÁCUO 1 14000-201",
    "tag": " 33",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "TRAFO",
    "responsavel": "SAMIR"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "BOMBA DE VACUO 2 EDWARDS",
    "tag": "32/42",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "TRAFO",
    "responsavel": "VINÍCIUS"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "BOMBA DE VÁCUO 3",
    "tag": "7758 / 4232",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "CAMPO",
    "responsavel": "SAMIR"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "BOMBA DE VÁCUO 4 EDWARDS",
    "tag": "4351",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "TRAFO",
    "responsavel": "VINÍCIUS"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "BOMBA DE VÁCUO 6",
    "tag": "4235",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "CAMPO",
    "responsavel": "SAMIR"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "BOMBA DE VÁCUO 7 - LEYBOLD",
    "tag": "13703",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "FÁBRICA GALPÃO TRAFO",
    "responsavel": "VINÍCIUS"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "CABINE DE JATO 1 PREPARAÇÃO",
    "tag": "3393",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "PREPARAÇÃO",
    "responsavel": "MALCOLN"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "CABINE DE JATO 2 EXTERNO",
    "tag": "463",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "TRAFO",
    "responsavel": "MALCOLN"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "CABINE DE PINTURA 2",
    "tag": "",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "PREPARAÇÃO",
    "responsavel": "MALCOLN"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "CABINE LAVADOR 1",
    "tag": "",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "FÁBRICA GALPÃO TRAFO",
    "responsavel": "ALDEMAR"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "CALANDRA 3",
    "tag": "4164",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "CALDEIRARIA",
    "responsavel": "DANIEL"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "COLCHÃO DE AR 1 LPT-200",
    "tag": null,
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "GALPÃO NOVO",
    "responsavel": "MAIKE"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "COLCHÃO DE AR 2 LPT-15",
    "tag": "12089",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "GALPÃO NOVO",
    "responsavel": "MAIKE"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "COMPRESSOR 3",
    "tag": " 6650",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "CALDEIRARIA MOTOR",
    "responsavel": "ALDEMAR"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "COMPRESSOR 6",
    "tag": "5222",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "GALPÃO DE BOBINAS",
    "responsavel": "GENILSON"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "COMPRESSOR 9",
    "tag": "",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "GALPÃO NOVO",
    "responsavel": "GENILSON"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "COMPRESSOR 10",
    "tag": "",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "GALPÃO NOVO",
    "responsavel": "GENILSON"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "CORTA DISCO 3 FRANHO",
    "tag": "4134",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "CALDEIRARIA",
    "responsavel": "DANIEL"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "ESQUADREJADEIRA 3 SEC 3I - BALDAN",
    "tag": "7660",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "CARPINTARIA TRAFO",
    "responsavel": "HUGO"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "ESQUADREJADEIRA 5 BALDAN",
    "tag": "2737",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "CARPINTARIA TRAFO (AO LADO DA MANUTENÇÃO)",
    "responsavel": "HUGO"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "FORMAS EXPANSÍVEIS",
    "tag": null,
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "FÁBRICA GALPÃO TRAFO",
    "responsavel": "VINÍCIUS"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "FRESADORA TUPIA 1",
    "tag": "2399",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "CARPINTARIA TRAFO",
    "responsavel": "GENILSON"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "FURADEIRA DE BANCADA 2 VONDER",
    "tag": "5189",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "XL COILS",
    "responsavel": "LUAN"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "FURADEIRA DE BANCADA 3",
    "tag": "3682",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "CARPINTARIA MOTOR",
    "responsavel": "LUAN"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "FURADEIRA DE BANCADA 7",
    "tag": "2863",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "MANUTENÇÃO",
    "responsavel": "LUAN"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "FURADEIRA DE COLUNA 1",
    "tag": "4246",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "PARTE ATIVA",
    "responsavel": "LUAN"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "FURADEIRA DE COLUNA 2",
    "tag": "6639",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "CARPINTARIA",
    "responsavel": "LUAN"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "GUILHOTINA 1",
    "tag": "",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "CALDEIRARIA",
    "responsavel": "DANIEL"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "GUILHOTINA 2",
    "tag": "",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "CALDEIRARIA",
    "responsavel": "SAMIR"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "ISOLADORA DE BOBINA 3 MESA",
    "tag": "5087",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "ISOLAMENTO DE BOBINAS - MOTOR",
    "responsavel": "HUGO"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "KBK 3 2T",
    "tag": null,
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "PREPARAÇÃO",
    "responsavel": "ALDEMAR"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "LIXADEIRA DE FITA 1",
    "tag": "7505",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "CARPINTARIA MOTOR",
    "responsavel": "GENILSON"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "LIXADEIRA DE FITA 2",
    "tag": "2398",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "CARPINTARIA - TRAFO",
    "responsavel": "LUAN"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "LIXADEIRA DE FITA 3 BALDAN",
    "tag": "6604",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "CARPINTARIA TRAFO",
    "responsavel": "LUAN"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "LIXADEIRA DE FITA 4",
    "tag": "4519",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "FÁBRICA BOBINAS MOTOR",
    "responsavel": "GENILSON"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "MÁQUINA BANDAGEM 1",
    "tag": "593",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "ARMADURA MOTOR",
    "responsavel": "HUGO"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "MÁQUINA BANDAGEM 2",
    "tag": "5292",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "MOTOR",
    "responsavel": "VINÍCIUS"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "MÁQUINA DE AR SECO 3 14000 - 601",
    "tag": " 31",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "CAMPO",
    "responsavel": "WENDEL"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "MÁQUINA DE AR SECO 4 DSL9",
    "tag": "27",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "CAMPO",
    "responsavel": "MAIKE"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "MÁQUINA DE MODELAR 3",
    "tag": "5085",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "ISOLAMENTO DE BOBINAS - MOTOR",
    "responsavel": "MAIKE"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "PRENSA 1 300T",
    "tag": "4220",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "MOTOR",
    "responsavel": "MALCOLN"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "PRENSA 4 PAPELÃO",
    "tag": "4955",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "GALPÃO DE BOBINAS",
    "responsavel": "MALCOLN"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "SECADOR 1",
    "tag": "",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "ÁREA DE COMPRESSORES",
    "responsavel": "ALDEMAR"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "SECADOR 2",
    "tag": "",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "ÁREA DE COMPRESSORES",
    "responsavel": "ALDEMAR"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "SECADOR 3",
    "tag": "",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "GALPÃO NOVO",
    "responsavel": "MAIKE"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "SECADOR 4",
    "tag": "",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "GALPÃO NOVO",
    "responsavel": "MAIKE"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "SECADOR SUPER SECO 1",
    "tag": "NULL",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "GALPÃO NOVO",
    "responsavel": "MAIKE"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "SERRA FITA 1 RONEMAK",
    "tag": "4828",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "CARPINTARIA TRAFO",
    "responsavel": "DANIEL"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "SERRA FITA 3",
    "tag": "468",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "CARPINTARIA MOTOR",
    "responsavel": "DANIEL"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "SERRA FITA 4 FRANHO",
    "tag": "2645",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "CALDEIRARIA",
    "responsavel": "DANIEL"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "SOPRADOR TÉRMICO 1",
    "tag": "3122",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "CAMPO",
    "responsavel": "WENDEL"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "SUBESTAÇÃO 1",
    "tag": "NULL",
    "periodicidade": "ANUAL",
    "setor_localizacao": "PRINCIPAL",
    "responsavel": " DANIEL / HUGO"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "SUBESTAÇÃO 2",
    "tag": "null",
    "periodicidade": "ANUAL",
    "setor_localizacao": "GALPÃO TRAFO",
    "responsavel": "MAIKE / GUILHERME"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "SUBESTAÇÃO 3",
    "tag": "null",
    "periodicidade": "ANUAL",
    "setor_localizacao": "GALPÃO MOTOR",
    "responsavel": " ALDEMAR / LUAN"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "TERMOVÁCUO 1 - 4000 l/h",
    "tag": "22",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "CAMPO",
    "responsavel": "VINÍCIUS"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "TERMOVÁCUO 2 - 1300 l/h",
    "tag": "2330",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "XL COILS",
    "responsavel": "SAMIR"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "TERMOVÁCUO 3 - 3000 l/h",
    "tag": "2331",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "CAMPO",
    "responsavel": "SAMIR"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "TERMOVÁCUO 4 - 5000 l/h",
    "tag": "3750",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "CAMPO",
    "responsavel": "VINÍCIUS"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "TERMOVÁCUO 6 DDSL3 14000 ",
    "tag": "29",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "TRAFO",
    "responsavel": "GENILSON"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "TORRE DE RESFRIAMENTO 3",
    "tag": "3349",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "TRAFO FÁBRICA ANTIGA",
    "responsavel": "DANIEL"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "TRANSFORMADOR 1 440/380/220V LARANJA (COM PAINEL)",
    "tag": "7759",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "CAMPO",
    "responsavel": "WENDEL"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "TRANSFORMADOR 2 440/380/220V LARANJA (SEM PAINEL)",
    "tag": "7959",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "CAMPO",
    "responsavel": "WENDEL"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "TRANSFORMADOR 3 440/380/220V CINZA",
    "tag": "7970",
    "periodicidade": "SEMESTRAL",
    "setor_localizacao": "CAMPO",
    "responsavel": "WENDEL"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "VPD HEDRICH",
    "tag": null,
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "GALPÃO NOVO",
    "responsavel": " HUGO / SAMIR"
  },
  {
    "status": "EM ATENDIMENTO",
    "equipamento": "VPI",
    "tag": "681",
    "periodicidade": "TRIMESTRAL",
    "setor_localizacao": "GALPÃO MOTOR",
    "responsavel": "MAIKE / GUILHERME"
  }
];

async function sync() {
    try {
        console.log("Authenticating as admin...");
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'admin@manequip.com',
            password: '@data'
        });
        if (authError) {
            throw new Error(`Failed to login: ${authError.message}`);
        }
        console.log("✅ Authenticated successfully! User ID:", authData.user?.id);

        console.log("Fetching profiles and assets...");
        const [{ data: profiles }, { data: assets }] = await Promise.all([
            supabase.from('profiles').select('id, full_name, email'),
            supabase.from('ativos').select('id, nome, tag_id, setor')
        ]);

        console.log(`✅ Fetched ${profiles.length} profiles and ${assets.length} assets.`);

        // Helper to resolve technician ID
        function resolveTech(nameStr) {
            if (!nameStr) return null;
            const clean = nameStr.toLowerCase().trim()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Accent removal
            
            const matched = profiles.find(p => {
                const pName = (p.full_name || '').toLowerCase().trim()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const pEmail = (p.email || '').toLowerCase().trim();
                return pName.includes(clean) || pEmail.includes(clean);
            });
            
            return matched ? matched.id : null;
        }

        // Helper to match or create asset
        async function resolveOrCreateAsset(item) {
            let tagStr = item.tag ? String(item.tag).trim() : null;
            if (tagStr && (tagStr.toLowerCase() === 'null' || tagStr === '')) tagStr = null;
            const nameStr = item.equipamento.trim();

            let matched = null;
            if (tagStr) {
                matched = assets.find(a => a.tag_id && a.tag_id.trim().toLowerCase() === tagStr.toLowerCase());
            }
            if (!matched) {
                // Try by name
                matched = assets.find(a => a.nome && a.nome.trim().toLowerCase() === nameStr.toLowerCase());
            }

            if (matched) {
                return matched.id;
            }

            console.log(`Creating asset: ${nameStr} (Tag: ${tagStr || 'None'})`);
            const { data: newAsset, error: assetErr } = await supabase
                .from('ativos')
                .insert([{
                    nome: nameStr,
                    tag_id: tagStr,
                    setor: item.setor_localizacao || 'Manutenção',
                    status: 'Operacional',
                    criticidade: 'Baixa',
                    saude: 100
                }])
                .select()
                .single();

            if (assetErr) {
                throw new Error(`Failed to create asset ${nameStr}: ${assetErr.message}`);
            }
            
            assets.push(newAsset);
            return newAsset.id;
        }

        // Helper to resolve or create planning template
        async function resolveOrCreatePlanTemplate(ativoId, item) {
            const periodicity = item.periodicidade.charAt(0).toUpperCase() + item.periodicidade.slice(1).toLowerCase();
            const { data: existingPlans, error: plansErr } = await supabase
                .from('preventivas_planejamento')
                .select('*')
                .eq('ativo_id', ativoId);

            if (plansErr) throw plansErr;

            // We look for a template with the same periodicity
            let plan = existingPlans.find(p => p.periodicidade === periodicity);

            let months = [6]; // Assure June (6) is included
            if (periodicity === 'Mensal') {
                months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
            } else if (periodicity === 'Trimestral') {
                months = [3, 6, 9, 12];
            } else if (periodicity === 'Semestral') {
                months = [6, 12];
            } else if (periodicity === 'Anual') {
                months = [6];
            }

            if (plan) {
                // If it already has month 6, we are good. Otherwise add it.
                let currentMonths = plan.meses_execucao || [];
                if (!currentMonths.includes(6)) {
                    console.log(`Updating months for plan template ${plan.id} to include June`);
                    currentMonths = [...currentMonths, 6].sort((a,b) => a-b);
                    const { error: updErr } = await supabase
                        .from('preventivas_planejamento')
                        .update({ meses_execucao: currentMonths })
                        .eq('id', plan.id);
                    if (updErr) throw updErr;
                    plan.meses_execucao = currentMonths;
                }
                return plan;
            }

            const title = `Preventiva Recorrente - ${item.tag || item.equipamento}`;
            console.log(`Creating planning template: ${title}`);
            const { data: newPlan, error: insErr } = await supabase
                .from('preventivas_planejamento')
                .insert([{
                    ativo_id: ativoId,
                    titulo: title,
                    descricao: `Manutenção preventiva ${periodicity.toLowerCase()} para o equipamento.`,
                    periodicidade: periodicity,
                    meses_execucao: months,
                    icone: 'settings'
                }])
                .select()
                .single();

            if (insErr) {
                throw new Error(`Failed to create template: ${insErr.message}`);
            }

            return newPlan;
        }

        // 1. Delete all existing preventivas_mensais for June 2026
        console.log("Cleaning up existing June 2026 preventives...");
        const { error: delError } = await supabase
            .from('preventivas_mensais')
            .delete()
            .eq('mes', 6)
            .eq('ano', 2026);
        if (delError) throw delError;

        // 2. Synchronize each preventative
        console.log("Populating June 2026 preventives...");
        const newTasks = [];

        for (const item of juneData) {
            const ativoId = await resolveOrCreateAsset(item);
            const planTemplate = await resolveOrCreatePlanTemplate(ativoId, item);

            // Parse technician responsibles
            let tech1 = null;
            let tech2 = null;

            if (item.responsavel) {
                const parts = item.responsavel.split('/');
                tech1 = resolveTech(parts[0]);
                if (parts[1]) {
                    tech2 = resolveTech(parts[1]);
                }
            }

            newTasks.push({
                planejamento_id: planTemplate.id,
                ativo_id: ativoId,
                titulo: planTemplate.titulo,
                descricao: planTemplate.descricao,
                mes: 6,
                ano: 2026,
                tecnico_responsavel: tech1,
                tecnico_responsavel_2: tech2,
                status: 'Em atendimento',
                icone: planTemplate.icone || 'settings',
                data_limite: '2026-06-30'
            });
        }

        const { error: insErr } = await supabase
            .from('preventivas_mensais')
            .insert(newTasks);

        if (insErr) throw insErr;

        console.log(`\n🎉 SUCCESS! Inserted ${newTasks.length} monthly preventives for June 2026!`);

    } catch (e) {
        console.error("❌ Error running sync:", e.message);
        process.exit(1);
    }
}

sync();

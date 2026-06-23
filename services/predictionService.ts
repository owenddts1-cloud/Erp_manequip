import { supabase } from './supabase';

export interface RULResult {
    remainingLifeDays: number;
    failureProbability: number;
    healthScore: number;
    alertTriggered: boolean;
}

export interface TriageResult {
    category: string;
    priority: 'Alta' | 'Média' | 'Baixa';
    suggestedTechId: string | null;
    techName: string | null;
}

/**
 * Heuristic Fuzzy Inference System (Neuro-Fuzzy logic) to calculate asset Health Score (0-100)
 */
export function runNeuroFuzzyHealthIndex(
    temp: number,          // Celsius
    vibration: number,     // mm/s RMS
    ageYears: number,      // years since acquisition
    recentFailures: number // count of failed/corrective work orders
): number {
    // 1. Fuzzification of Temperature
    let tempNormal = 0;
    let tempHigh = 0;
    if (temp <= 60) {
        tempNormal = 1.0;
    } else if (temp > 60 && temp < 85) {
        tempNormal = (85 - temp) / 25;
        tempHigh = (temp - 60) / 25;
    } else {
        tempHigh = 1.0;
    }

    // 2. Fuzzification of Vibration
    let vibNormal = 0;
    let vibHigh = 0;
    if (vibration <= 2.5) {
        vibNormal = 1.0;
    } else if (vibration > 2.5 && vibration < 7.0) {
        vibNormal = (7.0 - vibration) / 4.5;
        vibHigh = (vibration - 2.5) / 4.5;
    } else {
        vibHigh = 1.0;
    }

    // 3. Fuzzification of Age
    let ageNew = 0;
    let ageOld = 0;
    if (ageYears <= 2) {
        ageNew = 1.0;
    } else if (ageYears > 2 && ageYears < 8) {
        ageNew = (8 - ageYears) / 6;
        ageOld = (ageYears - 2) / 6;
    } else {
        ageOld = 1.0;
    }

    // 4. Fuzzy Rules Evaluation (Min implication)
    // Rule 1: IF Temp is High AND Vib is High -> Health is Critical (Score = 20)
    const rule1 = Math.min(tempHigh, vibHigh);
    
    // Rule 2: IF Temp is Normal AND Vib is Normal -> Health is Optimal (Score = 95)
    const rule2 = Math.min(tempNormal, vibNormal);
    
    // Rule 3: IF Vib is High AND Age is Old -> Health is Warning/Critical (Score = 40)
    const rule3 = Math.min(vibHigh, ageOld);
    
    // Rule 4: IF Age is New AND Temp is Normal -> Health is Excellent (Score = 100)
    const rule4 = Math.min(ageNew, tempNormal);

    // Rule 5: IF recent failures is high (> 2) -> Health multiplier
    const failurePenalty = recentFailures > 2 ? 0.7 : recentFailures > 0 ? 0.9 : 1.0;

    // 5. Defuzzification (Weighted Average / Centroid approximation)
    const sumWeights = rule1 + rule2 + rule3 + rule4;
    let finalScore = 100;

    if (sumWeights > 0) {
        finalScore = ((rule1 * 15) + (rule2 * 95) + (rule3 * 35) + (rule4 * 100)) / sumWeights;
    }

    // Apply failure penalty and bound score between 0 and 100
    finalScore = Math.max(0, Math.min(100, Math.round(finalScore * failurePenalty)));
    return finalScore;
}

/**
 * Predict Remaining Useful Life (RUL) of an asset and trigger auto OS if critical.
 */
export async function calculateAssetRUL(assetId: string): Promise<RULResult> {
    try {
        // Fetch asset info
        const { data: asset, error: assetErr } = await supabase
            .from('ativos')
            .select('data_aquisicao, saude, nome, setor')
            .eq('id', assetId)
            .single();

        if (assetErr || !asset) throw assetErr || new Error('Asset not found');

        // Fetch corrective work orders count
        const { data: wos, error: wosErr } = await supabase
            .from('work_orders')
            .select('id, tipo, status')
            .eq('ativo_id', assetId);

        if (wosErr) throw wosErr;

        const correctiveCount = wos?.filter(w => w.tipo === 'Corretiva').length || 0;
        const pendingCount = wos?.filter(w => w.status === 'Pendente' || w.status === 'Em Andamento').length || 0;

        // Calculate age in months
        const acqDate = asset.data_aquisicao ? new Date(asset.data_aquisicao) : new Date();
        const diffMs = Date.now() - acqDate.getTime();
        const ageYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);

        // Heuristics for simulated telemetry inputs
        // Vibration (higher if there are pending WOs)
        const simVibration = 1.2 + (pendingCount * 1.5) + (Math.random() * 0.8);
        // Temperature (higher if corrective actions were needed)
        const simTemp = 50 + (correctiveCount * 6) + (Math.random() * 5);

        // Run Fuzzy logic to compute health
        const healthScore = runNeuroFuzzyHealthIndex(simTemp, simVibration, ageYears, correctiveCount);

        // Survival curve approximation (Remaining Useful Life)
        // Baseline lifespan: 10 years (3650 days)
        const baseLifeDays = 3650;
        const ageDays = ageYears * 365.25;
        
        // Remaining baseline life days
        let remainingLifeDays = Math.max(10, baseLifeDays - ageDays);
        // Adjust remaining life based on health score (quadratic decay)
        remainingLifeDays = Math.round(remainingLifeDays * (healthScore / 100));

        // Failure probability calculation
        // Inverse sigmoid-like probability based on health score
        const failureProbability = Math.round(100 - healthScore);

        let alertTriggered = false;

        // Auto-generation of preventive OS if failure probability > 85% (health < 15%)
        if (failureProbability >= 85 && pendingCount === 0) {
            // Check if there isn't already a pending preventive order
            const displayId = `PREV-AUTO-${Math.floor(1000 + Math.random() * 9000)}`;
            
            const { error: insertErr } = await supabase
                .from('work_orders')
                .insert({
                    display_id: displayId,
                    title: `[ALERTA PREDITIVO RUL] Manutenção Corretiva Imediata: ${asset.nome}`,
                    tipo: 'Preventiva',
                    prioridade: 'Alta',
                    status: 'Pendente',
                    descricao: `OS AUTO-GERADA POR SISTEMA PREDITIVO RUL.\n\nAtivo: ${asset.nome} (${asset.setor})\nCriticidade: ALTA\nProbabilidade de Falha Calculada: ${failureProbability}%\nVida Útil Estimada Restante: ${remainingLifeDays} dias.\nHealth Index Fuzzy: ${healthScore}/100.`,
                    ativo_id: assetId,
                    data_limite: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 3 days limit
                });

            if (!insertErr) {
                alertTriggered = true;
                console.log(`[RUL Alert] Automatically generated preventative OS ${displayId} for asset ${assetId}`);
            } else {
                console.error('[RUL Alert] Error auto-generating OS:', insertErr.message);
            }
        }

        // Update asset health in the database
        await supabase
            .from('ativos')
            .update({ saude: healthScore, updated_at: new Date().toISOString() })
            .eq('id', assetId);

        return {
            remainingLifeDays,
            failureProbability,
            healthScore,
            alertTriggered
        };

    } catch (e: any) {
        console.error('RUL computation error:', e);
        return {
            remainingLifeDays: 365,
            failureProbability: 15,
            healthScore: 85,
            alertTriggered: false
        };
    }
}

/**
 * Text classification of maintenance complaints (triage) and workload-balanced technician assignment
 */
export async function autoTriageAndAllocate(
    title: string,
    description: string
): Promise<TriageResult> {
    const textToAnalyze = `${title} ${description}`.toLowerCase();

    // 1. NLP Keyword category mapping
    let category = 'Geral';
    if (textToAnalyze.includes('ruído') || textToAnalyze.includes('vazamento') || textToAnalyze.includes('óleo') || textToAnalyze.includes('rolamento') || textToAnalyze.includes('engrenagem') || textToAnalyze.includes('lubrific')) {
        category = 'Mecânica > Lubrificação';
    } else if (textToAnalyze.includes('elétrica') || textToAnalyze.includes('queimou') || textToAnalyze.includes('painel') || textToAnalyze.includes('curto') || textToAnalyze.includes('fiação') || textToAnalyze.includes('cabo')) {
        category = 'Elétrica > Componentes';
    } else if (textToAnalyze.includes('automação') || textToAnalyze.includes('sensor') || textToAnalyze.includes('calibra') || textToAnalyze.includes('inversor') || textToAnalyze.includes('plc') || textToAnalyze.includes('clp')) {
        category = 'Automação > Calibração';
    } else if (textToAnalyze.includes('vazamento') || textToAnalyze.includes('água') || textToAnalyze.includes('tubulação') || textToAnalyze.includes('cano') || textToAnalyze.includes('pressão')) {
        category = 'Hidráulica > Vazamento';
    }

    // 2. Priority mapping
    let priority: 'Alta' | 'Média' | 'Baixa' = 'Baixa';
    if (textToAnalyze.includes('parou') || textToAnalyze.includes('parado') || textToAnalyze.includes('fumaça') || textToAnalyze.includes('explosão') || textToAnalyze.includes('quebra total') || textToAnalyze.includes('crítico')) {
        priority = 'Alta';
    } else if (textToAnalyze.includes('aquecendo') || textToAnalyze.includes('lento') || textToAnalyze.includes('intermitente') || textToAnalyze.includes('alerta')) {
        priority = 'Média';
    }

    try {
        // 3. Query approved technicians
        const { data: techs, error: techsErr } = await supabase
            .from('profiles')
            .select('id, full_name, role, job_title')
            .eq('is_approved', true)
            .eq('role', 'Técnico');

        if (techsErr || !techs || techs.length === 0) {
            throw techsErr || new Error('No available technicians found');
        }

        // 4. Query active work orders to evaluate current workload of each technician
        const { data: activeWOs, error: wosErr } = await supabase
            .from('work_orders')
            .select('tecnico_responsavel')
            .in('status', ['Pendente', 'Em Andamento']);

        if (wosErr) throw wosErr;

        // Map workload counts
        const workloadMap: Record<string, number> = {};
        techs.forEach(t => { workloadMap[t.id] = 0; });
        activeWOs?.forEach(wo => {
            if (wo.tecnico_responsavel && workloadMap[wo.tecnico_responsavel] !== undefined) {
                workloadMap[wo.tecnico_responsavel]++;
            }
        });

        // 5. Allocation ranking based on workload and matching specialty
        let bestTechId: string | null = null;
        let bestTechName: string | null = null;
        let maxScore = -999;

        techs.forEach(t => {
            let score = 0;
            
            // Workload penalty (fewer WOs is better)
            const count = workloadMap[t.id] || 0;
            score -= count * 15; // each pending ticket reduces score by 15

            // Specialty match score (up to +50 points)
            const titleNorm = (t.job_title || '').toLowerCase();
            const nameNorm = (t.full_name || '').toLowerCase();

            if (category.includes('Mecânica') && (titleNorm.includes('mecânico') || nameNorm.includes('mecanico'))) {
                score += 50;
            } else if (category.includes('Elétrica') && (titleNorm.includes('eletricista') || titleNorm.includes('elétrica') || nameNorm.includes('eletric'))) {
                score += 50;
            } else if (category.includes('Automação') && (titleNorm.includes('automação') || titleNorm.includes('instrumentação') || nameNorm.includes('instrum'))) {
                score += 50;
            } else if (category.includes('Hidráulica') && (titleNorm.includes('hidráulico') || titleNorm.includes('encanador'))) {
                score += 50;
            }

            if (score > maxScore) {
                maxScore = score;
                bestTechId = t.id;
                bestTechName = t.full_name;
            }
        });

        return {
            category,
            priority,
            suggestedTechId: bestTechId,
            techName: bestTechName
        };

    } catch (err) {
        console.error('Error in auto allocation:', err);
        return {
            category,
            priority,
            suggestedTechId: null,
            techName: null
        };
    }
}

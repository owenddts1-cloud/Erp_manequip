import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://geenpztkeonjkclfnsfp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlZW5wenRrZW9uamtjbGZuc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTkzNzgsImV4cCI6MjA5NDkzNTM3OH0.HRzbIxyKs-vHxxaIt-hcBEura_QSdFkZMkn07-bHvqk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  try {
    const { data: prevData, error } = await supabase
      .from('preventivas_mensais')
      .select('id, mes, ano, status')
      .in('status', ['Em atendimento', 'Concluído']);

    if (error) throw error;

    console.log('Total preventives fetched:', prevData.length);

    const june2026 = prevData.filter(t => t.mes === 6 && t.ano === 2026);
    console.log('June 2026 preventives:', june2026.length);

  } catch (err) {
    console.error(err);
  }
}

run();

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://geenpztkeonjkclfnsfp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlZW5wenRrZW9uamtjbGZuc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTkzNzgsImV4cCI6MjA5NDkzNTM3OH0.HRzbIxyKs-vHxxaIt-hcBEura_QSdFkZMkn07-bHvqk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  try {
    // Login as manager leandro@manequip.com
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'leandro@manequip.com',
      password: '@admin'
    });

    if (authError) throw authError;
    console.log('Authenticated successfully as:', authData.user.email);

    // Fetch monthly preventives
    const { data: prevData, error: prevError } = await supabase
      .from('preventivas_mensais')
      .select(`id, status, mes, ano, created_at`)
      .in('status', ['Em atendimento', 'Concluído'])
      .order('created_at', { ascending: false });

    if (prevError) throw prevError;

    console.log('Total preventives fetched with auth:', prevData.length);

    const june2026 = prevData.filter(t => t.mes === 6 && t.ano === 2026);
    console.log('June 2026 preventives:', june2026.length);

    // Count by created_at date
    const dateCounts = {};
    june2026.forEach(t => {
      const d = t.created_at.split('T')[0];
      dateCounts[d] = (dateCounts[d] || 0) + 1;
    });
    console.log('June 2026 preventives by created date:', dateCounts);

  } catch (err) {
    console.error(err);
  }
}

run();

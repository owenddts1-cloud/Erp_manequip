import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oaexnkhyyncptzfvkqyo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXhua2h5eW5jcHR6ZnZrcXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjg0ODcsImV4cCI6MjA4Mjk0NDQ4N30.tS9BvFVQZpGMtoahMkpdfb4Q4F8uuAnFM3lnOYqesuA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreAdmin() {
    const email = 'admin@manequip.com';
    const password = 'AdminPassword123!';

    console.log(`Restoring user: ${email}`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Administrador do Sistema',
                job_title: 'Gestor de Planta',
                role: 'admin'
            }
        }
    });

    if (error) {
        console.error('Error creating user:', error.message);
    } else {
        console.log('User created/restored successfully:', data.user?.id);
    }
}

restoreAdmin();

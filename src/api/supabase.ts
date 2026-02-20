import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are missing! Check your .env file.');
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
)

// Simple health check
const checkConnection = async () => {
    try {
        const { error } = await supabase.from('menu_items').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('Supabase Connection Error:', error.message);
        } else {
            console.log('Supabase Connection: OK');
        }
    } catch (err) {
        console.error('Supabase Connection Failed:', err);
    }
};

checkConnection();

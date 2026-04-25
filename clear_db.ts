import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function clearDB() {
    const { error } = await supabase.from('posts').delete().neq('id', 'xxxxxxx');
    if (error) {
        console.error('Error clearing DB:', error);
    } else {
        console.log('Cleared DB successfully!');
    }
}
clearDB();

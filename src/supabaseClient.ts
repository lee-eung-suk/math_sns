import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (((import.meta as any).env.VITE_SUPABASE_URL as string) || '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseKey = ((import.meta as any).env.VITE_SUPABASE_ANON_KEY as string) || '';

// If credentials are not provided, we won't crash, but functions will throw or fail later.
// However, we'll try to provide a mock fallback right in the utility methods for the preview.
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

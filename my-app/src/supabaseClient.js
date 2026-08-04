import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly in development so missing .env is obvious
  // eslint-disable-next-line no-console
  console.error(
    'Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your project values.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Helper to check connection health with Supabase
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      connected: false,
      message: 'Supabase credentials are not set in .env. Running in offline LocalStorage mode.',
    };
  }

  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return {
        connected: false,
        message: `Supabase error: ${error.message}`,
      };
    }
    return {
      connected: true,
      message: 'Successfully connected to Supabase cloud database.',
    };
  } catch (err) {
    return {
      connected: false,
      message: (err as Error).message,
    };
  }
}

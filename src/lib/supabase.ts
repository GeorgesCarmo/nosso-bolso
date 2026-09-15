import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read exclusively from environment variables or user localStorage settings
export function getSupabaseCredentials() {
  const env = (import.meta as any).env || {};
  const envUrl = (env.VITE_SUPABASE_URL || '').trim();
  const envKey = (env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

  const localUrl = (localStorage.getItem('supabase_url') || envUrl).trim();
  let localKey = (localStorage.getItem('supabase_anon_key') || envKey).trim();

  // Guard against invalid or sensitive key formats
  if (localKey && (localKey.startsWith('sbp_') || localKey.includes('service_role'))) {
    console.warn('Secret API key detected in client context. Clearing stored key.');
    localStorage.removeItem('supabase_anon_key');
    localKey = '';
    supabaseInstance = null;
  }

  return {
    url: localUrl,
    key: localKey,
    isConfigured: Boolean(localUrl && localKey)
  };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseCredentials();
  
  if (!isConfigured) {
    return null;
  }

  // Check if key is a known secret key format (service_role or sbp_)
  if (key.startsWith('sbp_') || key.includes('service_role')) {
    console.warn('Secret API key detected in browser context. Clearing stored key.');
    clearSupabaseCredentials();
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key);
    } catch (err: any) {
      console.error('Erro ao inicializar o Supabase:', err);
      if (err?.message?.includes('secret API key') || err?.message?.includes('Forbidden')) {
        clearSupabaseCredentials();
      }
      return null;
    }
  }

  return supabaseInstance;
}

export function saveSupabaseCredentials(url: string, key: string) {
  localStorage.setItem('supabase_url', url.trim());
  localStorage.setItem('supabase_anon_key', key.trim());
  supabaseInstance = null; // reset instance so it recreates with new creds
}

export function clearSupabaseCredentials() {
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_anon_key');
  supabaseInstance = null;
}

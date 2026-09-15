import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default fallback credentials provided for Supabase project
const DEFAULT_SUPABASE_URL = 'https://qfqwrnrjdnxqlprmbwkw.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcXdybnJqZG54cWxwcm1id2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MDI0MzIsImV4cCI6MjA5OTM3ODQzMn0.XJibLM9_ot8oQf_ovb3UHd61FvWX6rxy6meDNH4fgIw';

// Read from env vars, localStorage overrides, or default fallbacks
export function getSupabaseCredentials() {
  const env = (import.meta as any).env || {};
  const envUrl = env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const envKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_ANON_KEY;

  let localUrl = localStorage.getItem('supabase_url') || envUrl;
  let localKey = localStorage.getItem('supabase_anon_key') || envKey;

  // Auto-clean any invalid or legacy keys from localStorage (Supabase anon keys must start with 'eyJ')
  if (localKey && (!localKey.startsWith('eyJ') || localKey.startsWith('sbp_') || localKey.includes('service_role'))) {
    console.warn('Clearing invalid non-JWT key from localStorage, falling back to default anon key');
    localStorage.removeItem('supabase_anon_key');
    localKey = DEFAULT_SUPABASE_ANON_KEY;
    supabaseInstance = null;
  }

  // Also ensure URL is set
  if (!localUrl || localUrl.includes('placeholder')) {
    localStorage.removeItem('supabase_url');
    localUrl = DEFAULT_SUPABASE_URL;
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

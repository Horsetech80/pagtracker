import { createBrowserClient } from '@supabase/ssr';

// Cliente Supabase específico para o painel administrativo
// Usa as configurações do .env.admin
const supabaseUrl = process.env.NEXT_PUBLIC_ADMIN_SUPABASE_URL || 'https://tqcxbiofslypocltpxmb.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_ADMIN_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY3hiaW9mc2x5cG9jbHRweG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMjUxMTUsImV4cCI6MjA1OTkwMTExNX0.kOsMsS6ag_cNMQmAy6cnoSnargbN6WFJJbrck8dwym8';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Configurações do Supabase Admin não encontradas');
}

export const adminSupabase = createBrowserClient(supabaseUrl, supabaseKey);

// Funções de autenticação específicas para admin
export async function adminSignIn(email: string, password: string) {
  // Admin debug logs removed for production
  
  const { data, error } = await adminSupabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('❌ Erro no login admin:', error);
    return { data: null, error };
  }
  
  // Admin login success logs removed for production
  return { data, error: null };
}

export async function adminSignOut() {
  const { error } = await adminSupabase.auth.signOut();
  return { error };
}

export async function getAdminSession() {
  const { data, error } = await adminSupabase.auth.getSession();
  return { data, error };
}

export async function getAdminUser() {
  const { data, error } = await adminSupabase.auth.getUser();
  return { data, error };
}
'use server';

import { createServerClient } from '@supabase/ssr';
import { createClient as createSBClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';

// Usar URLs reais ou URLs de fallback se estivermos em desenvolvimento
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (isDevelopment ? 'https://tqcxbiofslypocltpxmb.supabase.co' : '');
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (isDevelopment ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY3hiaW9mc2x5cG9jbHRweG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMjUxMTUsImV4cCI6MjA1OTkwMTExNX0.kOsMsS6ag_cNMQmAy6cnoSnargbN6WFJJbrck8dwym8' : '');

// Função para uso em componentes de API onde não precisamos de contexto de cookies
export async function createClient() {
  return createSBClient(
    supabaseUrl,
    supabaseKey
  );
}

export async function createServerSupabaseClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        async get(name: string) {
          try {
            // Aguardando explicitamente a resolução do cookie
            const cookie = cookieStore.get(name);
            return cookie?.value;
          } catch (error) {
            console.error('Erro ao acessar cookie:', error);
            return null;
          }
        },
        async set(name: string, value: string, options: any) {
          try {
            await cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.error('Erro ao definir cookie:', error);
          }
        },
        async remove(name: string, options: any) {
          try {
            await cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            console.error('Erro ao remover cookie:', error);
          }
        },
      },
    }
  );
}
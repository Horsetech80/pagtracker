import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Configurações do Supabase com fallbacks para desenvolvimento
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqcxbiofslypocltpxmb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY3hiaW9mc2x5cG9jbHRweG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMjUxMTUsImV4cCI6MjA1OTkwMTExNX0.kOsMsS6ag_cNMQmAy6cnoSnargbN6WFJJbrck8dwym8';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY3hiaW9mc2x5cG9jbHRweG1iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyNTExNSwiZXhwIjoyMDU5OTAxMTE1fQ.R1Rskq8pOW9YeeoDNjC2kZx98fRJK1OJIz35oSze6aU';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Configurações do Supabase não encontradas');
}

// Função principal para criar cliente Supabase server-side
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Handle cookie errors gracefully
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // Handle cookie errors gracefully
        }
      },
    },
  });
}

// Cliente para operações administrativas/service
export function createServiceClient() {
  return createServerClient(supabaseUrl!, supabaseServiceKey!, {
    cookies: {
      get() { return undefined; },
      set() { },
      remove() { },
    },
  });
}

// Alias para compatibilidade
export async function createServerSupabaseClient() {
  return createClient();
}

export async function createMiddlewareSupabaseClient(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const client = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: any) {
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  return { client, response };
}
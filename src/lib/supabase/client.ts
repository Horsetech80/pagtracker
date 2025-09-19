import { createBrowserClient } from '@supabase/ssr';

// Configurações do Supabase com fallbacks para desenvolvimento
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqcxbiofslypocltpxmb.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY3hiaW9mc2x5cG9jbHRweG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMjUxMTUsImV4cCI6MjA1OTkwMTExNX0.kOsMsS6ag_cNMQmAy6cnoSnargbN6WFJJbrck8dwym8';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Configurações do Supabase não encontradas');
}

export const supabase = createBrowserClient(supabaseUrl, supabaseKey, {
  cookies: {
    get(name: string) {
      if (typeof document !== 'undefined') {
        const value = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${name}=`))
          ?.split('=')[1];
        return value ? decodeURIComponent(value) : undefined;
      }
      return undefined;
    },
    set(name: string, value: string, options: any) {
      if (typeof document !== 'undefined') {
        let cookieString = `${name}=${encodeURIComponent(value)}`;
        
        // Configurações padrão para cookies de autenticação
        cookieString += `; path=${options?.path || '/'}`;
        cookieString += `; max-age=${options?.maxAge || 60 * 60 * 24 * 7}`; // 7 dias
        cookieString += `; samesite=${options?.sameSite || 'lax'}`;
        
        if (options?.domain) {
          cookieString += `; domain=${options.domain}`;
        }
        if (options?.secure || (typeof window !== 'undefined' && window.location.protocol === 'https:')) {
          cookieString += '; secure';
        }
        
        document.cookie = cookieString;
      }
    },
    remove(name: string, options: any) {
      if (typeof document !== 'undefined') {
        let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        
        cookieString += `; path=${options?.path || '/'}`;
        if (options?.domain) {
          cookieString += `; domain=${options.domain}`;
        }
        
        document.cookie = cookieString;
      }
    }
  }
});
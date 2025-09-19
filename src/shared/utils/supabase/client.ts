import { createBrowserClient } from '@supabase/ssr';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';

// Usar URLs reais ou URLs de fallback se estivermos em desenvolvimento
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (isDevelopment ? 'https://tqcxbiofslypocltpxmb.supabase.co' : '');
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (isDevelopment ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY3hiaW9mc2x5cG9jbHRweG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMjUxMTUsImV4cCI6MjA1OTkwMTExNX0.kOsMsS6ag_cNMQmAy6cnoSnargbN6WFJJbrck8dwym8' : '');

export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
import { supabase } from './client';

export async function signIn(email: string, password: string) {
  // Fluxo padrão do Supabase Auth - sem personalizações
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

export async function signUp(email: string, password: string, name: string) {
  // Cadastro real com Supabase - Remove mocks e workarounds
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome: name,
      },
    },
  });
  
  return { data, error };
}

export async function signOut() {
  // Logout real com Supabase - Remove mocks e workarounds
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  // Usar getUser() para validação segura em vez de getSession()
  const { data: { user }, error } = await supabase.auth.getUser();
  // Retornar no formato esperado para compatibilidade
  return { data: { session: user ? { user } : null }, error };
}

export async function getUser() {
  // Função dedicada para obter usuário de forma segura
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
}

export async function resetPassword(email: string) {
  // Reset real de senha com Supabase - Remove mocks e workarounds
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
}
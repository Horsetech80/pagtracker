// Script para redefinir senha do usuário allancristhian80@gmail.com
// Resolve o problema de login com erro 400 'Invalid login credentials'

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔐 REDEFINIÇÃO DE SENHA - allancristhian80@gmail.com');
console.log('=' .repeat(50));

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ ERRO: Configurações do Supabase não encontradas!');
  console.log('Certifique-se de que SUPABASE_SERVICE_ROLE_KEY está no .env');
  process.exit(1);
}

// Cliente com service role key para operações administrativas
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword() {
  const userEmail = 'allancristhian80@gmail.com';
  const newPassword = '123456'; // Senha simples para teste
  
  try {
    console.log(`\n1. Buscando usuário: ${userEmail}`);
    
    // Buscar o usuário pelo email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('❌ Erro ao listar usuários:', listError.message);
      return;
    }
    
    const user = users.users.find(u => u.email === userEmail);
    
    if (!user) {
      console.log('❌ Usuário não encontrado!');
      return;
    }
    
    console.log('✅ Usuário encontrado:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Confirmado:', user.email_confirmed_at ? '✅' : '❌');
    
    console.log(`\n2. Redefinindo senha para: ${newPassword}`);
    
    // Redefinir a senha do usuário
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword
      }
    );
    
    if (error) {
      console.log('❌ Erro ao redefinir senha:', error.message);
      return;
    }
    
    console.log('✅ SENHA REDEFINIDA COM SUCESSO!');
    console.log('\n📋 CREDENCIAIS PARA LOGIN:');
    console.log(`Email: ${userEmail}`);
    console.log(`Senha: ${newPassword}`);
    
    console.log('\n3. Testando login com nova senha...');
    
    // Testar login com a nova senha
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: newPassword,
    });
    
    if (loginError) {
      console.log('❌ Erro no teste de login:', loginError.message);
    } else {
      console.log('✅ TESTE DE LOGIN REALIZADO COM SUCESSO!');
      console.log('Usuário logado:', loginData.user?.email);
      
      // Fazer logout
      await supabase.auth.signOut();
    }
    
  } catch (err) {
    console.log('❌ ERRO INESPERADO:');
    console.log(err.message);
  }
}

async function main() {
  await resetPassword();
  
  console.log('\n4. PRÓXIMOS PASSOS:');
  console.log('- Acesse http://localhost:3000/login');
  console.log('- Use as credenciais mostradas acima');
  console.log('- Se ainda houver erro 400, limpe o cache do navegador');
  console.log('- Ou teste em aba anônima/privada');
}

main().catch(console.error);
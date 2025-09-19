#!/usr/bin/env node
/**
 * Redefine a senha do usuário teste02@gmail.com
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_USER_EMAIL = 'teste02@gmail.com';
const NEW_PASSWORD = 'teste123';

async function resetPassword() {
  console.log('🔐 Redefinindo senha do usuário teste02@gmail.com');
  console.log('=' .repeat(60));
  
  try {
    // 1. Buscar usuário no auth.users
    console.log('\n1. 🔍 Buscando usuário no auth.users...');
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError.message);
      return;
    }
    
    const authUser = authUsers.users.find(u => u.email === TEST_USER_EMAIL);
    
    if (!authUser) {
      console.error('❌ Usuário não encontrado no auth.users');
      return;
    }
    
    console.log('✅ Usuário encontrado:');
    console.log('   - ID:', authUser.id);
    console.log('   - Email:', authUser.email);
    console.log('   - Email confirmado:', authUser.email_confirmed_at ? 'Sim' : 'Não');
    console.log('   - Criado em:', authUser.created_at);
    
    // 2. Redefinir senha
    console.log('\n2. 🔧 Redefinindo senha...');
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      authUser.id,
      {
        password: NEW_PASSWORD,
        email_confirm: true // Garantir que o email está confirmado
      }
    );
    
    if (updateError) {
      console.error('❌ Erro ao redefinir senha:', updateError.message);
      return;
    }
    
    console.log('✅ Senha redefinida com sucesso!');
    
    // 3. Verificar e atualizar app_metadata com tenant_id
    console.log('\n3. 🏢 Verificando e atualizando tenant_id no app_metadata...');
    
    // Buscar tenant_id da tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', authUser.id)
      .single();
    
    if (userError) {
      console.error('❌ Erro ao buscar tenant_id:', userError.message);
    } else if (userData && userData.tenant_id) {
      console.log('✅ Tenant ID encontrado na tabela users:', userData.tenant_id);
      
      // Atualizar app_metadata com tenant_id
      const { data: metaUpdateData, error: metaUpdateError } = await supabase.auth.admin.updateUserById(
        authUser.id,
        {
          app_metadata: {
            ...authUser.raw_app_meta_data,
            tenant_id: userData.tenant_id
          }
        }
      );
      
      if (metaUpdateError) {
        console.error('❌ Erro ao atualizar app_metadata:', metaUpdateError.message);
      } else {
        console.log('✅ app_metadata atualizado com tenant_id');
      }
    } else {
      console.log('⚠️  Tenant ID não encontrado na tabela users');
    }
    
    // 4. Testar login
    console.log('\n4. 🧪 Testando login com nova senha...');
    
    const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: NEW_PASSWORD
    });
    
    if (loginError) {
      console.error('❌ Erro no teste de login:', loginError.message);
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('   - User ID:', loginData.user?.id);
      console.log('   - Email:', loginData.user?.email);
      console.log('   - Tenant ID (app_metadata):', loginData.user?.app_metadata?.tenant_id);
      
      // Logout
      await supabaseClient.auth.signOut();
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 PROCESSO CONCLUÍDO!');
    console.log('=' .repeat(60));
    console.log(`📧 Email: ${TEST_USER_EMAIL}`);
    console.log(`🔑 Nova senha: ${NEW_PASSWORD}`);
    console.log('💡 Agora você pode testar o login no sistema');
    
  } catch (error) {
    console.error('\n💥 Erro durante o processo:');
    console.error(error.message);
    console.error(error.stack);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  resetPassword();
}

module.exports = {
  resetPassword
};
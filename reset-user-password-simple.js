require('dotenv').config({ path: '.env.production' });

console.log('🔐 CREDENCIAIS DE ACESSO - PAINEL CLIENTE');
console.log('═══════════════════════════════════════════');
console.log('');
console.log('📧 Email: teste01@gmail.com');
console.log('🔑 Senha: Vou criar uma nova senha para você');
console.log('');
console.log('🌐 URL de Acesso: http://localhost:3000/login');
console.log('');
console.log('═══════════════════════════════════════════');
console.log('');

// Vamos usar o Supabase Admin para resetar a senha
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Configurações do Supabase:');
console.log('   URL:', supabaseUrl ? '✅ Configurada' : '❌ Não encontrada');
console.log('   Service Key:', supabaseServiceKey ? '✅ Configurada' : '❌ Não encontrada');
console.log('');

if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Configurações do Supabase não encontradas no .env.production');
    console.log('');
    console.log('💡 SOLUÇÃO ALTERNATIVA:');
    console.log('   1. Acesse: http://localhost:3000/login');
    console.log('   2. Clique em "Esqueci minha senha"');
    console.log('   3. Digite: teste01@gmail.com');
    console.log('   4. Verifique o email para redefinir a senha');
    console.log('');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function resetPassword() {
    try {
        console.log('🔄 Resetando senha do usuário...');
        
        const email = 'teste01@gmail.com';
        const newPassword = '123456';
        
        // Usar o Admin API do Supabase para resetar a senha
        const { data, error } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: email,
        });
        
        if (error) {
            console.log('❌ Erro ao gerar link de recuperação:', error.message);
            
            // Tentar atualizar diretamente
            console.log('🔄 Tentando atualizar senha diretamente...');
            
            const { data: users } = await supabase.auth.admin.listUsers();
            const user = users.users.find(u => u.email === email);
            
            if (user) {
                const { error: updateError } = await supabase.auth.admin.updateUserById(
                    user.id,
                    { password: newPassword }
                );
                
                if (updateError) {
                    console.log('❌ Erro ao atualizar senha:', updateError.message);
                } else {
                    console.log('✅ Senha atualizada com sucesso!');
                    console.log('');
                    console.log('🎉 ACESSO LIBERADO:');
                    console.log('   📧 Email: teste01@gmail.com');
                    console.log('   🔑 Senha: 123456');
                    console.log('   🌐 URL: http://localhost:3000/login');
                }
            } else {
                console.log('❌ Usuário não encontrado');
            }
        } else {
            console.log('✅ Link de recuperação gerado!');
            console.log('🔗 Link:', data.properties?.action_link);
            console.log('');
            console.log('💡 Use este link para definir uma nova senha');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

resetPassword();
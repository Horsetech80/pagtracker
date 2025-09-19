#!/usr/bin/env node

/**
 * Script para executar a migração da tabela kyc_verifications
 * 
 * Uso:
 * node scripts/run-kyc-migration.js
 * 
 * Ou com variáveis de ambiente específicas:
 * DATABASE_URL=your_db_url node scripts/run-kyc-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do banco de dados
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  console.error('\nConfigure as variáveis no arquivo .env.local:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Iniciando migração da tabela kyc_verifications...');
    
    // Ler o arquivo SQL de migração
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'create_kyc_verifications_table.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Arquivo de migração não encontrado: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Arquivo de migração carregado');
    console.log('🔄 Executando migração...');
    
    // Executar a migração
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });
    
    if (error) {
      // Se a função exec_sql não existir, tentar executar diretamente
      if (error.message.includes('function exec_sql')) {
        console.log('⚠️  Função exec_sql não encontrada, tentando método alternativo...');
        
        // Dividir o SQL em comandos individuais
        const commands = migrationSQL
          .split(';')
          .map(cmd => cmd.trim())
          .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));
        
        for (const command of commands) {
          if (command.trim()) {
            console.log(`Executando: ${command.substring(0, 50)}...`);
            const { error: cmdError } = await supabase.rpc('exec', { sql: command });
            if (cmdError) {
              console.error(`❌ Erro ao executar comando: ${cmdError.message}`);
              throw cmdError;
            }
          }
        }
      } else {
        throw error;
      }
    }
    
    console.log('✅ Migração executada com sucesso!');
    
    // Verificar se a tabela foi criada
    const { data: tableExists, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'kyc_verifications');
    
    if (checkError) {
      console.warn('⚠️  Não foi possível verificar se a tabela foi criada:', checkError.message);
    } else if (tableExists && tableExists.length > 0) {
      console.log('✅ Tabela kyc_verifications criada com sucesso!');
    } else {
      console.warn('⚠️  Tabela kyc_verifications não foi encontrada após a migração');
    }
    
    // Verificar estrutura da tabela
    console.log('🔍 Verificando estrutura da tabela...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'kyc_verifications')
      .order('ordinal_position');
    
    if (columnsError) {
      console.warn('⚠️  Não foi possível verificar as colunas:', columnsError.message);
    } else if (columns && columns.length > 0) {
      console.log('📋 Colunas da tabela kyc_verifications:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
    console.log('\n🎉 Migração concluída com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Teste o upload de documentos no onboarding');
    console.log('2. Verifique o painel admin em /admin/kyc');
    console.log('3. Teste o fluxo completo de aprovação/rejeição');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    console.error('\n🔧 Possíveis soluções:');
    console.error('1. Verifique se as credenciais do Supabase estão corretas');
    console.error('2. Confirme se você tem permissões de admin no projeto');
    console.error('3. Execute a migração manualmente no SQL Editor do Supabase');
    process.exit(1);
  }
}

// Executar migração
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
require('dotenv').config({ path: '.env.production' });
const fs = require('fs');
const https = require('https');
const axios = require('axios');

// Configuração de produção
const config = {
  environment: 'production',
  clientId: process.env.EFIPAY_PROD_CLIENT_ID,
  clientSecret: process.env.EFIPAY_PROD_CLIENT_SECRET,
  pixKey: process.env.EFIPAY_PROD_PIX_KEY,
  baseUrl: process.env.EFIPAY_PROD_BASE_URL || 'https://pix.api.efipay.com.br',
  certPath: process.env.EFIPAY_PROD_CERT_PATH,
  certPassword: process.env.EFIPAY_PROD_CERT_PASSWORD || ''
};

console.log('🔍 [DIAGNÓSTICO PIX] Avaliando configuração de produção...\n');

// Função para criar agente HTTPS com certificado P12
function createHttpsAgent() {
  try {
    const pfx = fs.readFileSync(config.certPath);
    
    const agent = new https.Agent({
      pfx: pfx,
      passphrase: config.certPassword,
      rejectUnauthorized: true
    });
    
    return agent;
  } catch (error) {
    console.error('❌ [ERRO] Falha ao criar agente HTTPS:', error.message);
    throw error;
  }
}

// Função para obter token de acesso
async function getAccessToken() {
  try {
    const agent = createHttpsAgent();
    const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
    
    const response = await axios.post(
      `${config.baseUrl}/oauth/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        httpsAgent: agent,
        timeout: 30000
      }
    );
    
    return response.data.access_token;
  } catch (error) {
    throw error;
  }
}

// Função para listar chaves PIX da conta
async function listPixKeys(accessToken) {
  try {
    const agent = createHttpsAgent();
    
    const response = await axios.get(
      `${config.baseUrl}/v2/gn/evp`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: agent,
        timeout: 30000
      }
    );
    
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Função para criar uma chave PIX aleatória (EVP)
async function createRandomPixKey(accessToken) {
  try {
    const agent = createHttpsAgent();
    
    const response = await axios.post(
      `${config.baseUrl}/v2/gn/evp`,
      {}, // Corpo vazio - EfiPay gera automaticamente
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: agent,
        timeout: 30000
      }
    );
    
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Função para validar formato de chave PIX
function validatePixKeyFormat(chave) {
  if (!chave || chave.trim().length === 0) {
    return { valid: false, type: null, error: 'Chave PIX vazia' };
  }

  if (chave.length > 77) {
    return { valid: false, type: null, error: 'Chave PIX muito longa (máx 77 caracteres)' };
  }

  const trimmedChave = chave.trim();
  
  // CPF (11 dígitos)
  if (/^\d{11}$/.test(trimmedChave)) {
    return { valid: true, type: 'CPF', error: null };
  }
  
  // CNPJ (14 dígitos)
  if (/^\d{14}$/.test(trimmedChave)) {
    return { valid: true, type: 'CNPJ', error: null };
  }
  
  // E-mail
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedChave)) {
    return { valid: true, type: 'EMAIL', error: null };
  }
  
  // Telefone (+5511999999999)
  if (/^\+55\d{10,11}$/.test(trimmedChave)) {
    return { valid: true, type: 'TELEFONE', error: null };
  }
  
  // Chave aleatória (UUID)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedChave)) {
    return { valid: true, type: 'EVP', error: null };
  }

  return { valid: false, type: null, error: 'Formato de chave PIX inválido' };
}

// Executar diagnóstico completo
async function runDiagnostic() {
  try {
    console.log('📋 [CONFIGURAÇÃO] Dados carregados:');
    console.log('- Environment:', config.environment);
    console.log('- Client ID:', config.clientId ? `${config.clientId.substring(0, 20)}...` : 'NÃO CONFIGURADO');
    console.log('- Client Secret:', config.clientSecret ? `${config.clientSecret.substring(0, 20)}...` : 'NÃO CONFIGURADO');
    console.log('- PIX Key:', config.pixKey);
    console.log('- Base URL:', config.baseUrl);
    console.log('- Cert Path:', config.certPath);
    console.log('- Cert Password:', config.certPassword ? '[CONFIGURADA]' : '[VAZIA]');
    
    // 1. Validar formato da chave PIX atual
    console.log('\n🔍 [VALIDAÇÃO] Analisando chave PIX atual...');
    const keyValidation = validatePixKeyFormat(config.pixKey);
    
    if (keyValidation.valid) {
      console.log(`✅ [CHAVE PIX] Formato válido - Tipo: ${keyValidation.type}`);
    } else {
      console.log(`❌ [CHAVE PIX] Formato inválido - Erro: ${keyValidation.error}`);
    }
    
    // 2. Testar autenticação
    console.log('\n🔐 [AUTENTICAÇÃO] Testando OAuth2...');
    const accessToken = await getAccessToken();
    console.log('✅ [TOKEN] Autenticação realizada com sucesso');
    
    // 3. Listar chaves PIX da conta
    console.log('\n📋 [CHAVES PIX] Listando chaves registradas na conta...');
    try {
      const pixKeys = await listPixKeys(accessToken);
      
      if (pixKeys.chaves && pixKeys.chaves.length > 0) {
        console.log(`✅ [CHAVES ENCONTRADAS] Total: ${pixKeys.chaves.length}`);
        
        pixKeys.chaves.forEach((chave, index) => {
          console.log(`   ${index + 1}. ${chave.chave} (${chave.tipo}) - Status: ${chave.status}`);
          
          // Verificar se a chave configurada está na lista
          if (chave.chave === config.pixKey) {
            console.log(`   ✅ [MATCH] Esta é a chave configurada no sistema!`);
          }
        });
        
        // Verificar se a chave configurada existe na conta
        const configuredKeyExists = pixKeys.chaves.some(chave => chave.chave === config.pixKey);
        
        if (!configuredKeyExists) {
          console.log(`\n⚠️  [PROBLEMA IDENTIFICADO] A chave PIX configurada (${config.pixKey}) NÃO está registrada na conta EfiPay!`);
          console.log('\n💡 [SOLUÇÕES POSSÍVEIS]:');
          console.log('1. Usar uma das chaves listadas acima');
          console.log('2. Registrar a chave atual no painel EfiPay');
          console.log('3. Criar uma nova chave PIX aleatória (EVP)');
          
          // Oferecer criação de chave aleatória
          console.log('\n🎲 [CRIAÇÃO AUTOMÁTICA] Tentando criar chave PIX aleatória...');
          try {
            const newKey = await createRandomPixKey(accessToken);
            console.log(`✅ [NOVA CHAVE] Chave PIX aleatória criada: ${newKey.chave}`);
            console.log(`📝 [AÇÃO NECESSÁRIA] Atualize EFIPAY_PROD_PIX_KEY para: ${newKey.chave}`);
          } catch (evpError) {
            console.log('❌ [EVP ERRO] Não foi possível criar chave aleatória:', evpError.response?.data || evpError.message);
          }
        } else {
          console.log(`\n✅ [CONFIGURAÇÃO OK] A chave PIX configurada está registrada na conta!`);
        }
        
      } else {
        console.log('⚠️  [NENHUMA CHAVE] Nenhuma chave PIX encontrada na conta');
        console.log('\n💡 [AÇÃO NECESSÁRIA] Registre uma chave PIX no painel EfiPay ou crie uma chave aleatória');
      }
      
    } catch (listError) {
      console.log('❌ [ERRO LISTAGEM] Não foi possível listar chaves PIX:', listError.response?.data || listError.message);
    }
    
    console.log('\n📊 [RESUMO DO DIAGNÓSTICO]');
    console.log('✅ Certificado P12: Funcionando');
    console.log('✅ Autenticação OAuth2: Funcionando');
    console.log('✅ Conexão com API EfiPay: Funcionando');
    
    if (keyValidation.valid) {
      console.log('✅ Formato da chave PIX: Válido');
    } else {
      console.log('❌ Formato da chave PIX: Inválido');
    }
    
    console.log('\n🎯 [PRÓXIMOS PASSOS]');
    console.log('1. Corrigir a chave PIX se necessário');
    console.log('2. Testar criação de cobrança PIX');
    console.log('3. Validar webhook de pagamento');
    
  } catch (error) {
    console.error('\n💥 [FALHA NO DIAGNÓSTICO]');
    console.error('Error:', error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔍 [DIAGNÓSTICO] Erro de autenticação:');
      console.log('- Verifique CLIENT_ID e CLIENT_SECRET');
      console.log('- Confirme se o certificado P12 está correto');
      console.log('- Verifique se a conta está ativa');
    } else if (error.response?.status === 403) {
      console.log('\n🔍 [DIAGNÓSTICO] Erro de permissão:');
      console.log('- Verifique se os escopos estão habilitados no painel EfiPay');
      console.log('- Confirme se a conta tem permissão para produção');
    }
    
    process.exit(1);
  }
}

runDiagnostic();
/**
 * CONFIGURAÇÃO EFIPAY - CREDENCIAIS REAIS
 * =======================================
 * 
 * Credenciais obtidas do painel EfiPay para PagTracker
 * Conforme documentação oficial: https://dev.efipay.com.br/docs/api-pix/cobrancas-imediatas
 * Atualizado em: 2025-06-19T01:23:48.994Z
 */

export const EFIPAY_CONFIG = {
  // Ambiente atual (usa EFIPAY_ENVIRONMENT ou fallback para NODE_ENV)
  ENVIRONMENT: process.env.EFIPAY_ENVIRONMENT || (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
  
  // Produção
  PRODUCTION: {
    CLIENT_ID: process.env.EFIPAY_PROD_CLIENT_ID || '',
    CLIENT_SECRET: process.env.EFIPAY_PROD_CLIENT_SECRET || '',
    CERT_PATH: process.env.EFIPAY_PROD_CERT_PATH || './certificates/producao-745954-Certificado.pem',
    CERT_PASSWORD: process.env.EFIPAY_PROD_CERT_PASSWORD || '',
    BASE_URL: process.env.EFIPAY_PROD_BASE_URL || 'https://pix.api.efipay.com.br',
    PIX_KEY: process.env.EFIPAY_PROD_PIX_KEY || '',
    WEBHOOK_URL: process.env.EFIPAY_PROD_WEBHOOK_URL || 'https://webhook.pagtracker.com/api/webhook',
    WEBHOOK_SECRET: process.env.EFIPAY_PROD_WEBHOOK_SECRET || 'pagtracker-efipay-webhook-prod-2024'
  },
  
  // Homologação (Sandbox)
  DEVELOPMENT: {
    CLIENT_ID: process.env.EFIPAY_CLIENT_ID || 'Client_Id_a1ccb462495bfe3089ebd31bba6e3323e088e54b',
    CLIENT_SECRET: process.env.EFIPAY_CLIENT_SECRET || 'Client_Secret_924964e30453e94c33fc14bdff624420f69828c2',
    CERT_PATH: process.env.EFIPAY_CERT_PATH || './certificates/homologacao-full.pem',
    BASE_URL: 'https://pix-h.api.efipay.com.br',
    CERT_PASSWORD: process.env.EFIPAY_CERT_PASSWORD || '', // Senha vazia por padrão EfiPay
    SKIP_MTLS: process.env.EFIPAY_SKIP_MTLS === 'true' || process.env.VERCEL === '1' // Skip mTLS no Vercel
  },
  
  // Configurações gerais
  PIX_KEY: process.env.EFIPAY_PIX_KEY || process.env.EFIPAY_PROD_PIX_KEY || 'efipay@sejaefi.com.br',
  WEBHOOK_URL: process.env.EFIPAY_WEBHOOK_URL || (process.env.NODE_ENV === 'production' ? 'https://webhook.pagtracker.com/api/webhook' : 'http://localhost:3000/api/webhook'),
  WEBHOOK_SECRET: process.env.EFIPAY_WEBHOOK_SECRET || (process.env.NODE_ENV === 'production' ? 'pagtracker-efipay-webhook-prod-2024' : 'pagtracker-efipay-webhook-secret-2024'),
  
  // Escopos HABILITADOS no painel EfiPay ✅ TODOS DISPONÍVEIS
  SCOPES: [
    // Cobranças (2/2) ✅
    'cob.write',          // Alterar cobranças
    'cob.read',           // Consultar cobranças
    
    // PIX Básico (2/2) ✅
    'pix.write',          // Alterar Pix
    'pix.read',           // Consultar Pix
    
    // PIX ENVIO ✅ CRÍTICO
    'pix.send',           // Enviar Pix ⭐ HABILITADO
    
    // Webhooks (2/2) ✅
    'webhook.write',      // Alterar Webhooks
    'webhook.read',       // Consultar Webhooks
    
    // Payloads (2/2) ✅
    'payloadlocation.write',  // Alterar Payloads
    'payloadlocation.read',   // Consultar Payloads
    
    // Chaves Aleatórias (2/2) ✅
    'gn.pix.evp.write',   // Alterar Chaves aleatórias
    'gn.pix.evp.read',    // Consultar Chaves aleatórias
    
    // Saldo ✅
    'gn.balance.read',    // Consultar saldo
    
    // Configurações API (2/2) ✅
    'gn.settings.write',  // Alterar Configurações da API
    'gn.settings.read',   // Consultar Configurações da API
    
    // Relatórios (2/2) ✅
    'gn.reports.write',   // Solicitar relatórios
    'gn.reports.read',    // Consultar relatórios
    
    // Cobranças com Vencimento (2/2) ✅
    'cobv.write',         // Alterar cobranças com vencimento
    'cobv.read',          // Consultar cobranças com vencimento
    
    // PIX ENVIADO - CONSULTA ✅ CRÍTICO
    'gn.pix.send.read',   // Consultar pix enviado ⭐ HABILITADO
    
    // Split PIX (2/2) ✅
    'gn.split.config.read',   // Consultar configuração de venda (split pix)
    'gn.split.config.write',  // Criar configuração de venda (split pix)
    
    // Lote Cobranças (2/2) ✅
    'lotecobv.write',     // Alterar lote de cobranças com vencimento
    'lotecobv.read',      // Consultar lote de cobranças com vencimento
    
    // QR CODE PIX ✅ CRÍTICO
    'gn.qrcodes.pay',     // Pagar QR Code Pix ⭐ HABILITADO
    
    // COMPROVANTES PIX ✅ NOVO
    'gn.receipts.read',   // Baixar comprovante Pix ⭐ HABILITADO
    
    // CONFIGURAÇÕES API - LEITURA ✅ NOVO
    'gn.settings.read'    // Consultar Configurações da API ⭐ HABILITADO
  ]
};

// Função helper para obter configuração atual
export function getCurrentEfiPayConfig() {
  const env = EFIPAY_CONFIG.ENVIRONMENT;
  return env === 'production' ? EFIPAY_CONFIG.PRODUCTION : EFIPAY_CONFIG.DEVELOPMENT;
}

// Validar configuração CRÍTICA para QR Code
export function validateEfiPayConfig() {
  const config = getCurrentEfiPayConfig();
  
  console.log('🔍 [EFIPAY_CONFIG] Validando configuração...', {
    environment: EFIPAY_CONFIG.ENVIRONMENT,
    hasClientId: !!config.CLIENT_ID,
    hasClientSecret: !!config.CLIENT_SECRET,
    hasPixKey: !!EFIPAY_CONFIG.PIX_KEY,
    baseUrl: config.BASE_URL
  });
  
  // Validações críticas
  if (!config.CLIENT_ID || !config.CLIENT_SECRET) {
    throw new Error('EFIPAY_CONFIG_ERROR: Credenciais EfiPay não configuradas (CLIENT_ID/CLIENT_SECRET)');
  }
  
  const pixKey = ('PIX_KEY' in config ? config.PIX_KEY : '') || EFIPAY_CONFIG.PIX_KEY;
  if (!pixKey) {
    throw new Error('EFIPAY_CONFIG_ERROR: Chave PIX não configurada');
  }
  
  // Verificar se certificado existe (usando path absoluto)
  const fs = require('fs');
  const path = require('path');
  const certPath = path.resolve(config.CERT_PATH);
  
  if (!fs.existsSync(certPath)) {
    // Tentar caminhos alternativos
    const alternativePaths = [
      config.CERT_PATH,
      `./certificates/efipay-homolog.crt`,
      `./certificates/efipay-prod.crt`,
      path.join(process.cwd(), 'certificates', 'efipay-homolog.crt'),
      path.join(process.cwd(), 'certificates', 'efipay-prod.crt')
    ];
    
    let foundPath = null;
    for (const testPath of alternativePaths) {
      if (fs.existsSync(testPath)) {
        foundPath = testPath;
        break;
      }
    }
    
    if (!foundPath) {
      console.error('❌ [EFIPAY_CERT] Certificado não encontrado em:', alternativePaths);
      throw new Error(`EFIPAY_CONFIG_ERROR: Certificado EfiPay não encontrado. Baixe do painel: https://sejaefi.com.br/central/`);
    }
    
    console.log(`✅ [EFIPAY_CERT] Certificado encontrado: ${foundPath}`);
  } else {
    console.log(`✅ [EFIPAY_CERT] Certificado válido: ${certPath}`);
  }
  
  console.log('✅ [EFIPAY_CONFIG] Configuração validada com sucesso');
  return true;
}

/**
 * Sistema configurado para nível de produção
 * Sempre usa integração real com EfiPay
 */
export function isDevelopmentMode(): boolean {
  return EFIPAY_CONFIG.ENVIRONMENT === 'development';
}

/**
 * Sistema em nível de produção - sempre valida configuração
 * Não há mais modo de dados temporários
 */
export function ensureProductionConfig(): void {
  try {
    validateEfiPayConfig();
    console.log('✅ [EFIPAY_CONFIG] Sistema configurado para nível de produção');
  } catch (error: any) {
    console.error('❌ [EFIPAY_CONFIG] Erro crítico na configuração:', error.message);
    throw new Error(`Sistema requer configuração EfiPay válida: ${error.message}`);
  }
}

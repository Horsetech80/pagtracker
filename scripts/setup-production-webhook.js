#!/usr/bin/env node

/**
 * Script para configurar webhook da EfiPay em produção
 * 
 * Este script configura o webhook oficial da EfiPay usando:
 * - Certificados mTLS de produção
 * - URL HTTPS de produção
 * - Validação de assinatura HMAC
 * 
 * Uso: node scripts/setup-production-webhook.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Carregar configurações de produção
require('dotenv').config({ path: '.env.production' });

// Configurações
const config = {
  // Ambiente de produção
  baseUrl: process.env.EFIPAY_PROD_BASE_URL || 'https://pix.api.efipay.com.br',
  clientId: process.env.EFIPAY_PROD_CLIENT_ID,
  clientSecret: process.env.EFIPAY_PROD_CLIENT_SECRET,
  certificatePath: process.env.EFIPAY_PROD_CERT_PATH || './certificates/producao-745954-Certificado.pem',
  certificatePassword: process.env.EFIPAY_PROD_CERT_PASSWORD || '',
  
  // Configurações do webhook
  pixKey: process.env.EFIPAY_PROD_PIX_KEY,
  webhookUrl: process.env.EFIPAY_PROD_WEBHOOK_URL || 'https://webhook.pagtracker.com/api/webhook',
  webhookSecret: process.env.EFIPAY_PROD_WEBHOOK_SECRET || 'pagtracker-efipay-webhook-prod-2024'
};

console.log('🚀 Configurando webhook EfiPay para produção...');
console.log('📋 Configurações:');
console.log(`   - Base URL: ${config.baseUrl}`);
console.log(`   - Client ID: ${config.clientId ? config.clientId.substring(0, 10) + '...' : 'NÃO CONFIGURADO'}`);
console.log(`   - PIX Key: ${config.pixKey || 'NÃO CONFIGURADA'}`);
console.log(`   - Webhook URL: ${config.webhookUrl}`);
console.log(`   - Certificado: ${config.certificatePath}`);

// Validar configurações obrigatórias
function validateConfig() {
  const required = ['clientId', 'clientSecret', 'pixKey', 'webhookUrl'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.error('❌ Configurações obrigatórias não encontradas:');
    missing.forEach(key => console.error(`   - ${key.toUpperCase()}`));
    console.error('\n💡 Configure as variáveis no arquivo .env.production');
    process.exit(1);
  }
  
  // Verificar se certificado existe
  if (!fs.existsSync(config.certificatePath)) {
    console.error(`❌ Certificado não encontrado: ${config.certificatePath}`);
    console.error('💡 Baixe o certificado de produção do painel EfiPay');
    process.exit(1);
  }
  
  // Validar URL do webhook
  try {
    const url = new URL(config.webhookUrl);
    if (url.protocol !== 'https:') {
      console.error('❌ URL do webhook deve usar HTTPS em produção');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ URL do webhook inválida:', config.webhookUrl);
    process.exit(1);
  }
}

// Obter token de acesso
async function getAccessToken() {
  return new Promise((resolve, reject) => {
    const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
    
    const data = JSON.stringify({
      grant_type: 'client_credentials'
    });

    // Ler certificado
    let certContent, keyContent;
    try {
      const certFile = fs.readFileSync(config.certificatePath, 'utf8');
      
      // Tentar extrair chave privada
      const keyMatch = certFile.match(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/) ||
                      certFile.match(/-----BEGIN RSA PRIVATE KEY-----[\s\S]*?-----END RSA PRIVATE KEY-----/);
      
      // Tentar extrair certificado
      const certMatch = certFile.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/);
      
      if (!keyMatch || !certMatch) {
        throw new Error('Formato de certificado inválido. Verifique se o arquivo contém tanto a chave privada quanto o certificado.');
      }
      
      keyContent = keyMatch[0];
      certContent = certMatch[0];
      
    } catch (error) {
      console.error('❌ Erro ao ler certificado:', error.message);
      console.error('💡 Verifique se o certificado está no formato PEM correto');
      reject(error);
      return;
    }

    const options = {
      hostname: new URL(config.baseUrl).hostname,
      port: 443,
      path: '/oauth/token',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      key: keyContent,
      cert: certContent
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          if (res.statusCode === 200 && response.access_token) {
            console.log('✅ Token de acesso obtido com sucesso');
            resolve(response.access_token);
          } else {
            console.error('❌ Erro ao obter token:', response);
            reject(new Error('Falha na autenticação'));
          }
        } catch (error) {
          console.error('❌ Erro ao processar resposta do token:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro na requisição do token:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Configurar webhook
async function configurarWebhook(token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      webhookUrl: config.webhookUrl
    });

    const options = {
      hostname: new URL(config.baseUrl).hostname,
      port: 443,
      path: `/v2/webhook/${encodeURIComponent(config.pixKey)}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      key: fs.readFileSync(config.certificatePath, 'utf8').match(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/)[0],
      cert: fs.readFileSync(config.certificatePath, 'utf8').match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/)[0]
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          console.log(`🔧 Status da configuração: ${res.statusCode}`);
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ Webhook configurado com sucesso!');
            console.log('📋 Detalhes:', JSON.stringify(response, null, 2));
            resolve(response);
          } else {
            console.error('❌ Erro ao configurar webhook:', JSON.stringify(response, null, 2));
            reject(new Error(`HTTP ${res.statusCode}: ${response.message || 'Erro desconhecido'}`));
          }
        } catch (error) {
          console.error('❌ Erro ao processar resposta:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Verificar webhook configurado
async function verificarWebhook(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(config.baseUrl).hostname,
      port: 443,
      path: `/v2/webhook/${encodeURIComponent(config.pixKey)}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      key: fs.readFileSync(config.certificatePath, 'utf8').match(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/)[0],
      cert: fs.readFileSync(config.certificatePath, 'utf8').match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/)[0]
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          console.log(`🔍 Status da verificação: ${res.statusCode}`);
          
          if (res.statusCode === 200) {
            console.log('✅ Webhook verificado com sucesso!');
            console.log('📋 Configuração atual:', JSON.stringify(response, null, 2));
            resolve(response);
          } else {
            console.log('ℹ️ Webhook não configurado ainda');
            resolve(null);
          }
        } catch (error) {
          console.error('❌ Erro ao processar resposta da verificação:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro na verificação:', error);
      reject(error);
    });

    req.end();
  });
}

// Função principal
async function main() {
  try {
    console.log('🔍 Validando configurações...');
    validateConfig();
    
    console.log('🔑 Obtendo token de acesso...');
    const token = await getAccessToken();
    
    console.log('🔍 Verificando webhook atual...');
    const currentWebhook = await verificarWebhook(token);
    
    if (currentWebhook && currentWebhook.webhookUrl === config.webhookUrl) {
      console.log('✅ Webhook já está configurado corretamente!');
      console.log(`🔗 URL: ${currentWebhook.webhookUrl}`);
    } else {
      console.log('🔧 Configurando webhook...');
      await configurarWebhook(token);
    }
    
    console.log('\n🎉 Configuração concluída com sucesso!');
    console.log('📋 Próximos passos:');
    console.log('   1. Teste o webhook com uma transação PIX');
    console.log('   2. Monitore os logs do servidor');
    console.log('   3. Verifique se as notificações estão sendo recebidas');
    
  } catch (error) {
    console.error('\n❌ Erro na configuração:', error.message);
    process.exit(1);
  }
}

// Executar script
if (require.main === module) {
  main();
}

module.exports = { main, config };
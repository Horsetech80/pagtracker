/**
 * Script para baixar certificado de produção da EfiPay
 * 
 * Este script faz login na conta EfiPay e baixa o certificado .p12
 * necessário para autenticação nas APIs PIX.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Credenciais fornecidas pelo usuário
const EFIPAY_CREDENTIALS = {
  email: 'bruno.mansonetto@hotmail.com',
  password: 'Be@24092015($)'
};

// URLs da EfiPay
const EFIPAY_URLS = {
  login: 'https://sejaefi.com.br/central/login',
  dashboard: 'https://sejaefi.com.br/central/dashboard',
  certificates: 'https://sejaefi.com.br/central/api/certificates'
};

async function downloadEfiPayCertificate() {
  try {
    console.log('🔐 Fazendo login na conta EfiPay...');
    
    // Criar sessão HTTP
    const session = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      withCredentials: true
    });
    
    // 1. Fazer login
    const loginResponse = await session.post(EFIPAY_URLS.login, {
      email: EFIPAY_CREDENTIALS.email,
      password: EFIPAY_CREDENTIALS.password
    });
    
    if (loginResponse.status !== 200) {
      throw new Error(`Erro no login: ${loginResponse.status}`);
    }
    
    console.log('✅ Login realizado com sucesso!');
    
    // 2. Acessar dashboard para obter dados da conta
    const dashboardResponse = await session.get(EFIPAY_URLS.dashboard);
    
    if (dashboardResponse.status !== 200) {
      throw new Error(`Erro ao acessar dashboard: ${dashboardResponse.status}`);
    }
    
    console.log('✅ Dashboard acessado com sucesso!');
    
    // 3. Listar certificados disponíveis
    console.log('📋 Listando certificados disponíveis...');
    
    const certificatesResponse = await session.get(EFIPAY_URLS.certificates);
    
    if (certificatesResponse.status !== 200) {
      throw new Error(`Erro ao listar certificados: ${certificatesResponse.status}`);
    }
    
    const certificates = certificatesResponse.data;
    console.log('📋 Certificados encontrados:', certificates.length);
    
    // 4. Encontrar certificado de produção ativo
    const prodCertificate = certificates.find(cert => 
      cert.environment === 'production' && 
      cert.status === 'active'
    );
    
    if (!prodCertificate) {
      console.log('⚠️ Nenhum certificado de produção ativo encontrado.');
      console.log('📋 Certificados disponíveis:');
      certificates.forEach(cert => {
        console.log(`  - ${cert.name} (${cert.environment}) - Status: ${cert.status}`);
      });
      return;
    }
    
    console.log(`✅ Certificado de produção encontrado: ${prodCertificate.name}`);
    
    // 5. Baixar certificado
    console.log('⬇️ Baixando certificado...');
    
    const downloadUrl = `${EFIPAY_URLS.certificates}/${prodCertificate.id}/download`;
    const downloadResponse = await session.get(downloadUrl, {
      responseType: 'arraybuffer'
    });
    
    if (downloadResponse.status !== 200) {
      throw new Error(`Erro ao baixar certificado: ${downloadResponse.status}`);
    }
    
    // 6. Salvar certificado
    const certificatesDir = path.join(__dirname, 'certificates');
    if (!fs.existsSync(certificatesDir)) {
      fs.mkdirSync(certificatesDir, { recursive: true });
    }
    
    const certificatePath = path.join(certificatesDir, 'producao-efipay.p12');
    fs.writeFileSync(certificatePath, downloadResponse.data);
    
    console.log(`✅ Certificado salvo em: ${certificatePath}`);
    
    // 7. Extrair informações do certificado
    console.log('📋 Informações do certificado:');
    console.log(`  - Nome: ${prodCertificate.name}`);
    console.log(`  - Ambiente: ${prodCertificate.environment}`);
    console.log(`  - Status: ${prodCertificate.status}`);
    console.log(`  - Client ID: ${prodCertificate.client_id || 'Não disponível'}`);
    console.log(`  - Validade: ${prodCertificate.expires_at || 'Não disponível'}`);
    
    // 8. Atualizar arquivo .env com as credenciais corretas
    console.log('🔧 Atualizando configurações...');
    
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Atualizar para usar produção
    envContent = envContent.replace(
      /EFIPAY_ENVIRONMENT=development/g,
      'EFIPAY_ENVIRONMENT=production'
    );
    
    // Atualizar caminho do certificado
    envContent = envContent.replace(
      /EFIPAY_PROD_CERT_PATH=.*/g,
      `EFIPAY_PROD_CERT_PATH=./certificates/producao-efipay.p12`
    );
    
    // Atualizar Client ID se disponível
    if (prodCertificate.client_id) {
      envContent = envContent.replace(
        /EFIPAY_PROD_CLIENT_ID=.*/g,
        `EFIPAY_PROD_CLIENT_ID=${prodCertificate.client_id}`
      );
    }
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Configurações atualizadas!');
    console.log('');
    console.log('🎉 CERTIFICADO BAIXADO COM SUCESSO!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Reinicie o servidor PagTracker');
    console.log('2. O sistema agora usará o certificado de produção');
    console.log('3. Teste o saldo da conta master no painel administrativo');
    
  } catch (error) {
    console.error('❌ Erro ao baixar certificado:', error.message);
    
    if (error.response) {
      console.error('📋 Detalhes do erro:');
      console.error(`  - Status: ${error.response.status}`);
      console.error(`  - Dados: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    console.log('');
    console.log('💡 Soluções alternativas:');
    console.log('1. Acesse https://sejaefi.com.br/central/');
    console.log('2. Faça login com suas credenciais');
    console.log('3. Vá em "Configurações" > "Certificados"');
    console.log('4. Baixe o certificado .p12 de produção');
    console.log('5. Salve como "certificates/producao-efipay.p12"');
  }
}

// Executar script
if (require.main === module) {
  downloadEfiPayCertificate();
}

module.exports = { downloadEfiPayCertificate };
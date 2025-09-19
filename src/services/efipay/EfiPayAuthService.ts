import { getCurrentEfiPayConfig, validateEfiPayConfig } from '@/config/efipay';
/**
 * EFIPAY AUTHENTICATION SERVICE - PAGTRACKER V4.0
 * ==============================================
 * 
 * Implementa autenticação OAuth2 com certificado P12/PEM
 * Conformidade: BCB Resolution 403/2024
 * Documentação: https://dev.efipay.com.br/docs/api-pix/credenciais
 */

import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import path from 'path';
import { BaseService } from '../core/BaseService';

export interface EfiPayCredentials {
  clientId: string;
  clientSecret: string;
  certificatePath: string;
  certificatePassword?: string;
  environment: 'development' | 'production';
}

export interface EfiPayAuthResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
}

export interface EfiPayConfig {
  baseUrl: string;
  pixKey: string;
  webhookUrl?: string;
  webhookSecret?: string;
}

/**
 * Serviço de autenticação EfiPay com gestão segura de tokens
 */
export class EfiPayAuthService extends BaseService {
  private credentials: EfiPayCredentials;
  private config: EfiPayConfig;
  private accessToken: string | null = null;
  private tokenExpires: Date | null = null;
  private axiosInstance: AxiosInstance;

  constructor(tenantId: string, userId: string) {
    super(tenantId, userId);
    
    // Carrega credenciais do environment
    this.credentials = this.loadCredentials();
    this.config = this.loadConfig();
    
    // Configura instância Axios com certificado
    this.axiosInstance = this.createAxiosInstance();
  }

  /**
   * Carrega credenciais baseado no environment (usando configuração real)
   */
  private loadCredentials(): EfiPayCredentials {
    try {
      // Valida configuração primeiro
      validateEfiPayConfig();
      
      // Obtém configuração atual (dev ou prod)
      const config = getCurrentEfiPayConfig();
      const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
      
      return {
        clientId: config.CLIENT_ID,
        clientSecret: config.CLIENT_SECRET,
        certificatePath: config.CERT_PATH,
        certificatePassword: config.CERT_PASSWORD || '',
        environment: env as 'development' | 'production'
      };
      
    } catch (error) {
      console.error('❌ [EFIPAY_CONFIG_ERROR]', error);
      throw new Error(`EFIPAY_CREDENTIALS_INVALID: ${error instanceof Error ? error.message : 'Configuração inválida'}`);
    }
  }

  /**
   * Carrega configurações da API (usando configuração real)
   */
  private loadConfig(): EfiPayConfig {
    try {
      const config = getCurrentEfiPayConfig();
      
      return {
        baseUrl: config.BASE_URL,
        pixKey: ('PIX_KEY' in config ? config.PIX_KEY : '') || process.env.EFIPAY_PIX_KEY || 'efipay@sejaefi.com.br',
        webhookUrl: ('WEBHOOK_URL' in config ? config.WEBHOOK_URL : '') || process.env.EFIPAY_WEBHOOK_URL || 'http://localhost:3000/api/webhooks/efipay',
        webhookSecret: ('WEBHOOK_SECRET' in config ? config.WEBHOOK_SECRET : '') || process.env.EFIPAY_WEBHOOK_SECRET || 'pagtracker-efipay-webhook-secret-2024'
      };
      
    } catch (error) {
      console.error('❌ [EFIPAY_CONFIG_ERROR]', error);
      throw new Error(`EFIPAY_CONFIG_INVALID: ${error instanceof Error ? error.message : 'Configuração inválida'}`);
    }
  }

  /**
   * Cria instância Axios com certificado SSL
   */
  private createAxiosInstance(): AxiosInstance {
    const httpsAgent = this.createHttpsAgent();
    
    return axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000, // 30s timeout
      httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'PagTracker-v4.0'
      }
    });
  }

  /**
   * Cria agente HTTPS com certificado (seguindo documentação oficial EfiPay)
   */
  private createHttpsAgent() {
    try {
      const https = require('https');
      let certPath = path.resolve(this.credentials.certificatePath);
      
      // Verificar se certificado existe, senão tentar caminhos alternativos
      if (!fs.existsSync(certPath)) {
        const alternativePaths = [
          './certificates/homologacao.p12',
          './certificates/producao.p12',
          './certificates/efipay-homolog.crt',
          './certificates/efipay-prod.crt',
          path.join(process.cwd(), 'certificates', 'homologacao.p12'),
          path.join(process.cwd(), 'certificates', 'producao.p12'),
          path.join(process.cwd(), 'certificates', 'efipay-homolog.p12'),
          path.join(process.cwd(), 'certificates', 'efipay-prod.p12'),
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
          console.warn('⚠️ [EFIPAY_CERT] Certificado .p12 não encontrado. Para usar EfiPay real, baixe o certificado .p12 do painel EfiPay.');
          throw new Error(`EFIPAY_CERTIFICATE_NOT_FOUND: Certificado .p12 não encontrado. Baixe do painel EfiPay: https://sejaefi.com.br/central/`);
        }
        
        certPath = foundPath;
        console.log(`✅ [EFIPAY_CERT] Usando certificado: ${certPath}`);
      }

      // Verificar se é arquivo .p12 (formato correto para EfiPay)
      if (certPath.endsWith('.p12') || certPath.endsWith('.pfx')) {
        // Para certificados .p12, usar pfx
        const pfxContent = fs.readFileSync(certPath);
        
        return new https.Agent({
          pfx: pfxContent,
          passphrase: this.credentials.certificatePassword || '', // Senha do certificado
          rejectUnauthorized: true
        });
      } else {
        // Para certificados .pem que contêm chave privada e certificado
        console.log('✅ [EFIPAY_CERT] Usando certificado .pem com chave privada');
        
        const pemContent = fs.readFileSync(certPath, 'utf8');
        
        // Extrair chave privada e certificado do arquivo .pem
        const keyMatch = pemContent.match(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/);
        const certMatch = pemContent.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/);
        
        if (!keyMatch || !certMatch) {
          throw new Error('Arquivo .pem deve conter tanto a chave privada quanto o certificado');
        }
        
        return new https.Agent({
          key: keyMatch[0],
          cert: certMatch[0],
          rejectUnauthorized: true // Usar validação completa para produção
        });
      }
      
    } catch (error) {
      console.error('❌ [EFIPAY_CERT_ERROR]', error);
      throw new Error(`EFIPAY_CERTIFICATE_INVALID: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Obter token de acesso OAuth2
   */
  async getAccessToken(): Promise<string> {
    try {
      // Verificar se temos um token válido em cache
      if (this.accessToken && this.tokenExpires && Date.now() < this.tokenExpires.getTime()) {
        return this.accessToken;
      }

      // Usar credenciais carregadas na configuração
      const clientId = this.credentials.clientId;
      const clientSecret = this.credentials.clientSecret;
      
      if (!clientId || !clientSecret) {
        throw new Error('Credenciais EfiPay não configuradas');
      }

      // Usar URL base da configuração
      const tokenUrl = `${this.config.baseUrl}/oauth/token`;

      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      
      // Escopos básicos que funcionaram no teste isolado + saldo
      const scopes = [
        'pix.read', 
        'pix.write', 
        'pix.send', 
        'cob.read', 
        'cob.write',
        'gn.balance.read'
      ].join(' ');

      const response = await axios.post(tokenUrl, 
        `grant_type=client_credentials&scope=${encodeURIComponent(scopes)}`,
        {
          httpsAgent: this.createHttpsAgent(),
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token, expires_in } = response.data;
      
      // Armazenar token em cache com margem de segurança
      this.accessToken = access_token;
      this.tokenExpires = new Date(Date.now() + ((expires_in - 300) * 1000)); // 5 min de margem

      return access_token;
    } catch (error: any) {
      console.error('Erro ao obter token EfiPay:', error);
      
      if (error.response) {
        throw new Error(`Erro de autenticação EfiPay: ${error.response.status} - ${error.response.data?.error_description || error.response.data?.error}`);
      }
      
      throw new Error(`Erro de conexão com EfiPay: ${error.message}`);
    }
  }

  /**
   * Verifica se token atual é válido
   */
  private isTokenValid(): boolean {
    return !!(
      this.accessToken && 
      this.tokenExpires && 
      this.tokenExpires > new Date()
    );
  }

  /**
   * Invalidar token atual (forçar renovação)
   */
  invalidateToken(): void {
    console.log('🔄 [EFIPAY_AUTH] Invalidando token em cache...');
    this.accessToken = null;
    this.tokenExpires = null;
  }

  /**
   * Forçar renovação completa do token (limpar cache e obter novo)
   */
  async forceTokenRenewal(): Promise<string> {
    console.log('🔄 [EFIPAY_AUTH] Forçando renovação completa do token...');
    this.invalidateToken();
    return await this.getAccessToken();
  }

  /**
   * Cria instância Axios autenticada para requisições
   */
  async createAuthenticatedAxios(): Promise<AxiosInstance> {
    const token = await this.getAccessToken();
    
    const instance = this.createAxiosInstance();
    
    // Interceptor para adicionar token automaticamente
    instance.interceptors.request.use((config) => {
      config.headers['Authorization'] = `Bearer ${token}`;
      return config;
    });

    // Interceptor para retry em caso de token expirado
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;
          this.invalidateToken();
          const newToken = await this.getAccessToken();
          error.config.headers['Authorization'] = `Bearer ${newToken}`;
          return instance.request(error.config);
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }

  /**
   * Getter para configurações (para outros serviços)
   */
  getConfig(): EfiPayConfig {
    return { ...this.config };
  }

  /**
   * Getter para credenciais (sem dados sensíveis)
   */
  getCredentialsInfo() {
    return {
      environment: this.credentials.environment,
      clientId: this.credentials.clientId.substring(0, 8) + '***',
      certificatePath: this.credentials.certificatePath,
      hasCertificate: fs.existsSync(this.credentials.certificatePath)
    };
  }

  /**
   * Health check da configuração
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    checks: Record<string, boolean>;
    message?: string;
  }> {
    const checks = {
      credentials: !!this.credentials.clientId && !!this.credentials.clientSecret,
      certificate: fs.existsSync(this.credentials.certificatePath),
      baseUrl: !!this.config.baseUrl,
      pixKey: !!this.config.pixKey,
      connectivity: false // será atualizado abaixo
    };

    try {
      // Tenta obter token para validar conectividade
      await this.getAccessToken();
      checks.connectivity = true;
    } catch {
      checks.connectivity = false;
    }

    const allHealthy = Object.values(checks).every(Boolean);
    
    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
      message: allHealthy ? 'EfiPay configurado corretamente' : 'Problemas na configuração EfiPay'
    };
  }

  /**
   * Obtém token válido (renovando se necessário)
   */
  async getValidToken(): Promise<string> {
    // Se não temos token ou está próximo da expiração, renovar
    if (!this.accessToken || this.isTokenNearExpiry()) {
      console.log('🔄 [EFIPAY_AUTH] Renovando token...');
      await this.getAccessToken();
    }

    if (!this.accessToken) {
      throw new Error('EFIPAY_AUTH_FAILED: Token não disponível');
    }

    return this.accessToken;
  }

  /**
   * Faz requisição autenticada para EfiPay
   */
  async makeAuthenticatedRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    token?: string
  ): Promise<any> {
    try {
      const authToken = token || await this.getValidToken();
      
      const response = await this.axiosInstance.request({
        method,
        url: endpoint,
        data,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response;
      
    } catch (error: unknown) {
      console.error('❌ [EFIPAY_REQUEST_ERROR]', { method, endpoint, error });
      throw error;
    }
  }

  /**
   * Implementação do método abstrato do BaseService
   */
  protected sanitizeOutput(data: any): any {
    if (!data) return data;
    
    // Remove dados sensíveis dos logs
    const sanitized = { ...data };
    
    // Remove tokens e secrets
    if (sanitized.access_token) {
      sanitized.access_token = `${sanitized.access_token.substring(0, 10)}...`;
    }
    
    if (sanitized.clientSecret) {
      sanitized.clientSecret = '***';
    }
    
    if (sanitized.certificatePassword) {
      sanitized.certificatePassword = '***';
    }
    
    return sanitized;
  }

  /**
   * Verifica se token está próximo da expiração
   */
  private isTokenNearExpiry(): boolean {
    if (!this.tokenExpires) return true;
    
    // Considera próximo da expiração se restam menos de 5 minutos
    const fiveMinutesFromNow = new Date(Date.now() + (5 * 60 * 1000));
    return this.tokenExpires <= fiveMinutesFromNow;
  }
}
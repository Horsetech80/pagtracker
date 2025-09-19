/**
 * Servidor Webhook EfiPay com mTLS
 * Implementação 100% conforme documentação oficial EfiPay
 * 
 * Recursos implementados:
 * - HTTPS com mTLS (TLSv1.2 mínimo)
 * - Skip-mTLS com validação IP e HMAC
 * - Endpoints conforme documentação
 * - Validação request.socket.authorized
 * - Tratamento automático do /pix
 */

import express, { Request, Response, NextFunction } from 'express';
import https from 'https';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

export class EfiPayWebhookServer {
  private app: any;
  private readonly EFIPAY_IP = '34.193.116.226'; // IP oficial da EfiPay

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    
    // Log das requisições conforme exemplo da documentação
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`📥 [WEBHOOK] ${req.method} ${req.path} - IP: ${req.ip} - mTLS: ${(req as any).socket?.authorized || 'skip'}`);
      next();
    });

    // Middleware de validação mTLS/skip-mTLS
    this.app.use(this.validateRequest.bind(this));
  }

  /**
   * Validação de requisições conforme documentação EfiPay
   */
  private validateRequest(req: Request, res: Response, next: NextFunction): void {
    const skipMtls = req.headers['x-skip-mtls-checking'] === 'true';

    if (!skipMtls) {
      // Validação mTLS padrão conforme documentação
      if (!(req as any).socket.authorized) {
        console.log('❌ [WEBHOOK] mTLS não autorizado');
        res.status(401).json({ error: 'mTLS obrigatório' });
        return;
      }
      
      console.log('✅ [WEBHOOK] mTLS autorizado');
    } else {
      console.log('🔄 [WEBHOOK] Validando skip-mTLS...');
      
      // Validação 1: IP da EfiPay (conforme documentação)
      if (!this.validateEfiPayIP(req)) {
        console.log('❌ [WEBHOOK] IP não autorizado:', this.getClientIP(req));
        res.status(401).json({ error: 'IP não autorizado' });
        return;
      }

      // Validação 2: HMAC na URL (conforme documentação)
      if (!this.validateHMAC(req)) {
        console.log('❌ [WEBHOOK] HMAC inválido');
        res.status(401).json({ error: 'HMAC inválido' });
        return;
      }

      console.log('✅ [WEBHOOK] Skip-mTLS validado com sucesso');
    }

    next();
  }

  /**
   * Validar IP de origem da EfiPay (34.193.116.226)
   */
  private validateEfiPayIP(req: Request): boolean {
    const clientIP = this.getClientIP(req);
    return clientIP === this.EFIPAY_IP;
  }

  /**
   * Obter IP do cliente (limpar IPv4 mapped)
   */
  private getClientIP(req: Request): string {
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '';
    return ip.replace(/^::ffff:/, '');
  }

  /**
   * Validar HMAC na URL conforme documentação
   * Exemplo: https://seu_dominio.com.br/webhook?hmac=xyz&ignorar=
   */
  private validateHMAC(req: Request): boolean {
    const secret = process.env.EFIPAY_HMAC_SECRET;
    if (!secret) {
      console.warn('⚠️ [WEBHOOK] EFIPAY_HMAC_SECRET não configurado');
      return false;
    }

    const providedHmac = req.query.hmac as string;
    if (!providedHmac) {
      console.log('❌ [WEBHOOK] HMAC não fornecido na URL');
      return false;
    }

    // Gerar HMAC esperado baseado na URL
    const baseUrl = req.originalUrl.split('?')[0]; // URL sem query params
    const expectedHmac = crypto
      .createHmac('sha256', secret)
      .update(baseUrl)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(providedHmac),
      Buffer.from(expectedHmac)
    );
  }

  private setupRoutes(): void {
    // Endpoint para configuração do webhook (conforme documentação)
    this.app.post('/webhook', (req: Request, res: Response) => {
      // Verifica se a requisição foi autorizada (conforme exemplo da documentação)
      if ((req as any).socket.authorized) {
        console.log('✅ [WEBHOOK_CONFIG] Configuração autorizada via mTLS');
        res.status(200).end();
      } else {
        console.log('❌ [WEBHOOK_CONFIG] Configuração não autorizada');
        res.status(401).end();
      }
    });

    // Endpoint para recepção do webhook tratando o /pix (conforme documentação)
    this.app.post('/webhook/pix', (req: Request, res: Response) => {
      const authorized = (req as any).socket.authorized || req.headers['x-skip-mtls-checking'] === 'true';
      
      if (authorized) {
        console.log('📥 [WEBHOOK_PIX] Notificação PIX recebida:', {
          pix: req.body?.pix?.length || 0,
          timestamp: new Date().toISOString()
        });
        
        // Processar webhook PIX
        this.processPixWebhook(req.body);
        
        res.status(200).end();
      } else {
        console.log('❌ [WEBHOOK_PIX] Notificação não autorizada');
        res.status(401).end();
      }
    });

    // Endpoint para webhook de recorrência
    this.app.post('/webhook/recorrencia', (req: Request, res: Response) => {
      const authorized = (req as any).socket.authorized || req.headers['x-skip-mtls-checking'] === 'true';
      
      if (authorized) {
        console.log('📥 [WEBHOOK_REC] Notificação recorrência recebida:', req.body);
        
        // Processar webhook de recorrência
        this.processRecurrenceWebhook(req.body);
        
        res.status(200).end();
      } else {
        console.log('❌ [WEBHOOK_REC] Notificação não autorizada');
        res.status(401).end();
      }
    });

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        mtls: process.env.EFIPAY_REQUIRE_MTLS === 'true',
        skipMtls: process.env.EFIPAY_ALLOW_SKIP_MTLS === 'true'
      });
    });
  }

  /**
   * Processar webhook PIX conforme estrutura da documentação
   */
  private processPixWebhook(webhookData: any): void {
    try {
      console.log('🔄 [WEBHOOK_PIX] Processando notificação...');
      
      if (webhookData?.pix && Array.isArray(webhookData.pix)) {
        for (const pix of webhookData.pix) {
          console.log('💰 [PIX_RECEIVED]', {
            endToEndId: pix.endToEndId,
            txid: pix.txid,
            valor: pix.valor,
            chave: pix.chave,
            horario: pix.horario
          });

          // Aqui você implementaria:
          // 1. Atualizar status da cobrança no banco de dados
          // 2. Enviar notificações para o usuário
          // 3. Processar split de pagamento
          // 4. Atualizar dashboard em tempo real
          // 5. Enviar webhooks para aplicações cliente
        }
      }

      console.log('✅ [WEBHOOK_PIX] Processamento concluído');
      
    } catch (error) {
      console.error('❌ [WEBHOOK_PIX] Erro no processamento:', error);
    }
  }

  /**
   * Processar webhook de recorrência
   */
  private processRecurrenceWebhook(webhookData: any): void {
    try {
      console.log('🔄 [WEBHOOK_REC] Processando notificação de recorrência...');
      
      // Implementar processamento específico de recorrência
      console.log('✅ [WEBHOOK_REC] Processamento concluído');
      
    } catch (error) {
      console.error('❌ [WEBHOOK_REC] Erro no processamento:', error);
    }
  }

  /**
   * Iniciar servidor HTTPS com mTLS conforme documentação EfiPay
   */
  async startServer(port: number = 443): Promise<void> {
    try {
      console.log('🚀 Iniciando servidor EfiPay Webhook...');

      // Verificar certificados
      this.checkCertificates();

      // Configurações HTTPS com mTLS conforme exemplo da documentação
      const httpsOptions = {
        // Certificado fullchain do domínio (obrigatório)
        cert: fs.readFileSync(process.env.DOMAIN_CERT_PATH || './certificates/domain.crt'),
        
        // Chave privada do domínio (obrigatório)
        key: fs.readFileSync(process.env.DOMAIN_KEY_PATH || './certificates/domain.key'),
        
        // Certificado público da EfiPay (baixado automaticamente)
        ca: fs.readFileSync(this.getEfiPayCertPath()),
        
        // Configurações mTLS conforme documentação
        minVersion: 'TLSv1.2' as const,
        requestCert: true,
        rejectUnauthorized: process.env.EFIPAY_REJECT_UNAUTHORIZED !== 'false'
      };

      // Criar servidor HTTPS
      const httpsServer = https.createServer(httpsOptions, this.app);

      httpsServer.listen(port, () => {
        console.log(`✅ Servidor EfiPay Webhook ativo: https://localhost:${port}`);
        console.log(`🔐 mTLS habilitado: ${httpsOptions.rejectUnauthorized}`);
        console.log(`🌐 Ambiente: ${process.env.EFIPAY_ENVIRONMENT || 'homologacao'}`);
        console.log(`📋 Endpoints disponíveis:`);
        console.log(`   - POST /webhook (configuração)`);
        console.log(`   - POST /webhook/pix (notificações PIX)`);
        console.log(`   - POST /webhook/recorrencia (notificações recorrência)`);
        console.log(`   - GET  /health (health check)`);
      });

      // Tratamento de erros do servidor
      httpsServer.on('error', (error) => {
        console.error('❌ Erro no servidor webhook:', error);
      });

    } catch (error) {
      console.error('❌ Erro ao iniciar servidor:', error);
      throw error;
    }
  }

  /**
   * Verificar se os certificados necessários existem
   */
  private checkCertificates(): void {
    const domainCert = process.env.DOMAIN_CERT_PATH || './certificates/domain.crt';
    const domainKey = process.env.DOMAIN_KEY_PATH || './certificates/domain.key';
    const efipayCert = this.getEfiPayCertPath();

    if (!fs.existsSync(domainCert)) {
      throw new Error(`Certificado do domínio não encontrado: ${domainCert}`);
    }

    if (!fs.existsSync(domainKey)) {
      throw new Error(`Chave privada do domínio não encontrada: ${domainKey}`);
    }

    if (!fs.existsSync(efipayCert)) {
      console.warn(`⚠️ Certificado EfiPay não encontrado: ${efipayCert}`);
      console.warn('Execute: node scripts/download-efipay-certificates.js');
    }

    console.log('✅ Certificados verificados');
  }

  /**
   * Obter caminho do certificado EfiPay baseado no ambiente
   */
  private getEfiPayCertPath(): string {
    const environment = process.env.EFIPAY_ENVIRONMENT === 'production' ? 'prod' : 'homolog';
    return process.env.EFIPAY_CERT_PATH || `./certificates/efipay-${environment}.crt`;
  }
}

/**
 * Utilitário para gerar URL de webhook com HMAC
 */
export class WebhookUrlGenerator {
  /**
   * Gerar URL do webhook com HMAC conforme documentação
   * Exemplo: https://seu_dominio.com.br/webhook?hmac=xyz&ignorar=
   */
  static generateSecureWebhookUrl(baseUrl: string, secret: string): string {
    // Gerar HMAC
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(baseUrl)
      .digest('hex');

    // Adicionar HMAC e parâmetro ignorar conforme documentação
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}hmac=${hmac}&ignorar=`;
  }

  /**
   * Validar HMAC de uma URL
   */
  static validateWebhookUrl(url: string, secret: string): boolean {
    try {
      const urlObj = new URL(url);
      const providedHmac = urlObj.searchParams.get('hmac');
      
      if (!providedHmac) return false;

      // Reconstruir URL base sem HMAC
      urlObj.searchParams.delete('hmac');
      urlObj.searchParams.delete('ignorar');
      const baseUrl = urlObj.toString();

      // Calcular HMAC esperado
      const expectedHmac = crypto
        .createHmac('sha256', secret)
        .update(baseUrl)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(providedHmac),
        Buffer.from(expectedHmac)
      );
    } catch {
      return false;
    }
  }
} 
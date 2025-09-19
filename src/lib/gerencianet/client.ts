import axios from 'axios';
import { CreateChargeParams, QrCodeData } from '../api/types';
import crypto from 'crypto';

/**
 * Cliente para integração com a API da Gerencianet
 * Documentação: https://dev.gerencianet.com.br/docs/api-pix
 */
export class GerencianetClient {
  private apiKey: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpires: Date | null = null;
  private baseUrl: string;
  
  constructor(
    apiKey: string,
    clientId: string,
    clientSecret: string,
    sandbox: boolean = true
  ) {
    this.apiKey = apiKey;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = sandbox 
      ? 'https://api-pix-h.gerencianet.com.br' 
      : 'https://api-pix.gerencianet.com.br';
  }
  
  /**
   * Autenticação na API
   */
  private async authenticate(): Promise<string> {
    // Se já temos um token válido, retorna ele
    if (this.accessToken && this.tokenExpires && this.tokenExpires > new Date()) {
      return this.accessToken;
    }
    
    try {
      const credentials = Buffer.from(
        `${this.clientId}:${this.clientSecret}`
      ).toString('base64');
      
      const response = await axios.post(
        `${this.baseUrl}/oauth/token`,
        { grant_type: 'client_credentials' },
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      this.accessToken = response.data.access_token;
      
      // Calcula quando o token expira
      const expiresIn = response.data.expires_in;
      this.tokenExpires = new Date(Date.now() + expiresIn * 1000);
      
      if (!this.accessToken) {
        throw new Error('Token de acesso não recebido da API');
      }
      
      return this.accessToken;
    } catch (error) {
      console.error('Erro ao autenticar na Gerencianet:', error);
      throw new Error('Falha na autenticação com a Gerencianet');
    }
  }
  
  /**
   * Cria uma cobrança Pix
   */
  public async createCharge(
    params: CreateChargeParams
  ): Promise<QrCodeData> {
    try {
      const token = await this.authenticate();
      
      // Dados da cobrança
      const chargeData = {
        calendario: {
          expiracao: params.expiracao || 3600, // 1 hora por padrão
        },
        valor: {
          original: params.valor.toFixed(2),
        },
        chave: this.apiKey, // Chave Pix do recebedor
        solicitacaoPagador: params.descricao || 'Pagamento PagTracker',
      };
      
      // Cria a cobrança
      const response = await axios.post(
        `${this.baseUrl}/v2/cob`,
        chargeData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const txid = response.data.txid;
      
      // Gera o QR Code
      const qrCodeResponse = await axios.get(
        `${this.baseUrl}/v2/loc/${response.data.loc.id}/qrcode`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      
      return {
        qrCode: qrCodeResponse.data.qrcode,
        imagemQrCode: qrCodeResponse.data.imagemQrcode,
        txid,
        linkPagamento: `https://pix.gerencianet.com.br/${txid}`
      };
    } catch (error) {
      console.error('Erro ao criar cobrança Pix:', error);
      throw new Error('Falha ao criar cobrança Pix na Gerencianet');
    }
  }
  
  /**
   * Consulta o status de uma cobrança
   */
  public async getChargeStatus(txid: string) {
    try {
      const token = await this.authenticate();
      
      const response = await axios.get(
        `${this.baseUrl}/v2/cob/${txid}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erro ao consultar cobrança Pix:', error);
      throw new Error('Falha ao consultar cobrança Pix na Gerencianet');
    }
  }

  /**
   * Processa um reembolso de uma cobrança Pix
   * @param e2eid ID da transação (E2E ID) - obtido da consulta ao /v2/cob/{txid}
   * @param valor Valor a ser reembolsado (opcional, se não informado, reembolsa o valor total)
   * @param descricao Descrição do motivo do reembolso
   */
  public async refundCharge(
    e2eid: string,
    valor?: number,
    descricao: string = 'Reembolso solicitado pelo cliente'
  ) {
    try {
      const token = await this.authenticate();
      
      // Gera um ID único para a devolução
      const id = crypto.randomUUID();
      
      const refundData: any = {
        valor: valor ? { original: valor.toFixed(2) } : undefined,
        descricao
      };
      
      const response = await axios.put(
        `${this.baseUrl}/v2/pix/devolucao/${e2eid}/${id}`,
        refundData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        id: response.data.id,
        rtrId: response.data.rtrId,
        status: response.data.status,
        valor: response.data.valor
      };
    } catch (error) {
      console.error('Erro ao processar reembolso Pix:', error);
      throw new Error('Falha ao processar reembolso Pix na Gerencianet');
    }
  }
} 
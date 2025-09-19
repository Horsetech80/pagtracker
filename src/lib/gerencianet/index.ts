import axios from 'axios';

// Configurações da API Gerencianet
type GerencianetConfig = {
  clientId: string;
  clientSecret: string;
  certificate: string;
  sandbox?: boolean;
};

// Classe para requisições à API da Gerencianet
export class GNRequest {
  private clientId: string;
  private clientSecret: string;
  private certificate: string;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpires: number = 0;
  
  constructor(config: GerencianetConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.certificate = config.certificate;
    this.baseUrl = config.sandbox ? 
      'https://api-pix-h.gerencianet.com.br' : 
      'https://api-pix.gerencianet.com.br';
  }
  
  // Obter token de acesso
  async getToken(): Promise<string> {
    const now = Date.now();
    
    // Retornar token existente se ainda for válido
    if (this.accessToken && this.tokenExpires > now) {
      return this.accessToken;
    }
    
    try {
      // Em modo de desenvolvimento, podemos simular o token
      if (process.env.NODE_ENV === 'development') {
        this.accessToken = 'dev-mock-token';
        this.tokenExpires = now + 3600 * 1000; // 1 hora
        return this.accessToken;
      }
      
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/oauth/token`,
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        data: {
          grant_type: 'client_credentials'
        },
        httpsAgent: this.certificate ? { cert: this.certificate } : undefined
      });
      
      this.accessToken = response.data.access_token;
      this.tokenExpires = now + (response.data.expires_in * 1000);
      
      if (!this.accessToken) {
        throw new Error('Token de acesso não recebido da API Gerencianet');
      }
      
      return this.accessToken;
    } catch (error) {
      console.error('Erro ao obter token Gerencianet:', error);
      throw new Error('Falha ao autenticar na API da Gerencianet');
    }
  }
  
  // Fazer requisição GET
  async get(endpoint: string, params = {}): Promise<any> {
    try {
      const token = await this.getToken();
      
      const response = await axios({
        method: 'get',
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params,
        httpsAgent: this.certificate ? { cert: this.certificate } : undefined
      });
      
      return response.data;
    } catch (error) {
      console.error(`Erro na requisição GET ${endpoint}:`, error);
      throw error;
    }
  }
  
  // Fazer requisição POST
  async post(endpoint: string, data = {}): Promise<any> {
    try {
      const token = await this.getToken();
      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data,
        httpsAgent: this.certificate ? { cert: this.certificate } : undefined
      });
      
      return response.data;
    } catch (error) {
      console.error(`Erro na requisição POST ${endpoint}:`, error);
      throw error;
    }
  }
  

}

// Serviço para integração com a Gerencianet
export class GerencianetService {
  private gnRequest: GNRequest;
  
  constructor() {
    // Inicializar cliente com as credenciais
    this.gnRequest = new GNRequest({
      clientId: process.env.GERENCIANET_CLIENT_ID || 'client-id-dev',
      clientSecret: process.env.GERENCIANET_CLIENT_SECRET || 'client-secret-dev',
      certificate: process.env.GERENCIANET_CERTIFICATE || '',
      sandbox: process.env.NODE_ENV !== 'production'
    });
  }
  
  // Criar uma nova cobrança Pix
  async createCharge(data: { 
    valor: number, 
    descricao: string, 
    cliente?: any,
    expiracao?: number 
  }) {
    try {
      // Criar a cobrança na Gerencianet
      const response = await this.gnRequest.post('/v2/cob', {
        calendario: {
          expiracao: data.expiracao || 3600 // Padrão: 1 hora
        },
        valor: {
          original: (data.valor / 100).toFixed(2)
        },
        chave: process.env.GERENCIANET_PIX_KEY || 'efipay@sejaefi.com.br',
        solicitacaoPagador: data.descricao,
        infoAdicionais: data.cliente ? [
          {
            nome: 'Cliente',
            valor: data.cliente.nome
          },
          {
            nome: 'Email',
            valor: data.cliente.email
          }
        ] : []
      });
      
      // Obter QR Code
      const qrCode = await this.gnRequest.get(`/v2/loc/${response.loc.id}/qrcode`);
      
      return {
        id: response.txid,
        codigo_pix: qrCode.qrcode,
        qr_code_base64: qrCode.imagemQrcode,
        vencimento: new Date(Date.now() + (data.expiracao || 3600) * 1000).toISOString()
      };
    } catch (error) {
      console.error('Erro ao criar cobrança Pix:', error);
      throw new Error('Falha ao criar cobrança Pix');
    }
  }
  
  // Verificar status de uma cobrança
  async getChargeStatus(txid: string) {
    try {
      const response = await this.gnRequest.get(`/v2/cob/${txid}`);
      
      // Mapear o status da Gerencianet para o nosso status interno
      let status;
      switch (response.status) {
        case 'CONCLUIDA':
          status = 'pago';
          break;
        case 'ATIVA':
          status = 'pendente';
          break;
        case 'REMOVIDA_PELO_USUARIO_RECEBEDOR':
        case 'REMOVIDA_PELO_PSP':
          status = 'expirado';
          break;
        default:
          status = 'pendente';
      }
      
      return { status };
    } catch (error) {
      console.error('Erro ao verificar status da cobrança:', error);
      throw new Error('Falha ao verificar status do pagamento');
    }
  }
}

// Exportar instância do serviço para uso em toda a aplicação
export const gerencianetService = new GerencianetService();
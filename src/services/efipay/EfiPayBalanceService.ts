/**
 * EfiPay Balance Service
 * 
 * Implementa funcionalidades para consultar saldo da conta EfiPay
 * através da API EfiPay.
 * 
 * Endpoints implementados:
 * - GET /v2/gn/balance - Consultar saldo da conta
 * 
 * Escopos necessários:
 * - gn.balance.read - Consultar saldo
 * 
 * @author PagTracker Team
 * @version 1.0.0
 */

import { EfiPayAuthService } from './EfiPayAuthService';
import axios, { AxiosInstance } from 'axios';
import { getCurrentEfiPayConfig } from '../../config/efipay';

// ================================================================
// INTERFACES E TIPOS
// ================================================================

/**
 * Saldo da conta EfiPay
 */
export interface EfiPayBalance {
  saldo: {
    disponivel: {
      valor: string; // Valor em reais (ex: "1250.75")
      moeda: 'BRL';
    };
    bloqueado?: {
      valor: string; // Valor bloqueado em reais
      moeda: 'BRL';
    };
    bloqueios?: {
      judicial: string; // Saldo bloqueado por ação judicial
      med: string; // Saldo bloqueado por MED (Medida de Emergência)
      total: string; // Total de saldos bloqueados
    };
  };
  consultadoEm: string; // ISO 8601
}

// Interface para o saldo da conta EfiPay conforme documentação oficial
export interface EfiPayAccountBalance {
  saldo: string; // Saldo disponível em formato string (ex: "100.00")
  bloqueios?: {
    judicial: string; // Saldo bloqueado por ação judicial
    med: string; // Saldo bloqueado por MED (Medida de Emergência)
    total: string; // Total de saldos bloqueados
  };
}

/**
 * Interface simplificada para PagTracker
 */
export interface PagTrackerBalanceRequest {
  tenantId: string;
  incluirBloqueado?: boolean;
}

export interface PagTrackerBalanceResponse {
  success: boolean;
  data?: {
    saldo: {
      disponivel: number; // Valor em centavos
      bloqueado: number; // Valor em centavos
      total: number; // Valor total em centavos
    };
    consultadoEm: string;
    gateway: 'efipay';
  };
  error?: string;
  details?: any;
}

// ================================================================
// SERVIÇO PRINCIPAL
// ================================================================

export class EfiPayBalanceService {
  private authService: EfiPayAuthService;
  private httpClient: AxiosInstance;
  private config: any;

  constructor(tenantId: string, userId: string = 'system') {
    this.config = getCurrentEfiPayConfig();
    this.authService = new EfiPayAuthService(tenantId, userId);
    
    // Cliente HTTP básico para casos onde não precisamos de autenticação
    // Para consultas autenticadas, usaremos this.authService.createAuthenticatedAxios()
    this.httpClient = axios.create({
      baseURL: this.config.BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PagTracker-EfiPay-Balance/1.0.0'
      }
    });
  }

  // ================================================================
  // MÉTODOS PRINCIPAIS
  // ================================================================

  /**
   * Consultar saldo da conta EfiPay
   */
  async consultarSaldo(bloqueios: boolean = false): Promise<EfiPayBalance> {
    try {
      console.log('🏦 [BALANCE] Consultando saldo da conta EfiPay...');
      
      // Usar o cliente autenticado do AuthService que já tem certificado configurado
      const authenticatedClient = await this.authService.createAuthenticatedAxios();
      
      // Construir URL com parâmetro bloqueios se necessário
      const endpoint = `/v2/gn/saldo${bloqueios ? '?bloqueios=true' : ''}`;
      
      // Fazer requisição usando o cliente autenticado
      const response = await authenticatedClient.get(endpoint);
      
      console.log('✅ [BALANCE] Saldo consultado com sucesso');
      console.log('📊 [BALANCE] Resposta da API:', response.data);
      
      // Converter resposta da API EfiPay para formato interno
      const apiResponse: EfiPayAccountBalance = response.data;
      
      // Calcular saldo bloqueado total se houver bloqueios
      const saldoBloqueado = apiResponse.bloqueios 
        ? parseFloat(apiResponse.bloqueios.total || '0')
        : 0;
      
      return {
        saldo: {
          disponivel: {
            valor: apiResponse.saldo,
            moeda: 'BRL'
          },
          bloqueado: saldoBloqueado > 0 ? {
            valor: saldoBloqueado.toFixed(2),
            moeda: 'BRL'
          } : undefined,
          bloqueios: apiResponse.bloqueios
        },
        consultadoEm: new Date().toISOString()
      };
      
    } catch (error: any) {
      console.error('❌ [BALANCE] Erro ao consultar saldo:', error.response?.data || error.message);
      throw new Error(`Erro ao consultar saldo: ${error.response?.data?.mensagem || error.message}`);
    }
  }

  /**
   * Verificar se há saldo suficiente para uma operação
   */
  async verificarSaldoSuficiente(valorRequerido: number): Promise<boolean> {
    try {
      const saldo = await this.consultarSaldo();
      const saldoDisponivel = parseFloat(saldo.saldo.disponivel.valor);
      const valorRequeridoReais = valorRequerido / 100; // Converter centavos para reais
      
      return saldoDisponivel >= valorRequeridoReais;
    } catch (error) {
      console.error('❌ [BALANCE] Erro ao verificar saldo suficiente:', error);
      return false;
    }
  }

  // ================================================================
  // INTERFACE PAGTRACKER
  // ================================================================

  /**
   * Interface simplificada para PagTracker
   */
  async obterSaldoPagTracker(request: PagTrackerBalanceRequest): Promise<PagTrackerBalanceResponse> {
    try {
      console.log(`🏦 [BALANCE] Obtendo saldo para tenant: ${request.tenantId}`);
      console.log(`🏦 [BALANCE] Incluir bloqueados: ${request.incluirBloqueado || false}`);
      
      const saldo = await this.consultarSaldo(request.incluirBloqueado || false);
      
      // Converter valores para centavos
      const disponivel = Math.round(parseFloat(saldo.saldo.disponivel.valor) * 100);
      const bloqueado = saldo.saldo.bloqueado 
        ? Math.round(parseFloat(saldo.saldo.bloqueado.valor) * 100)
        : 0;
      
      return {
        success: true,
        data: {
          saldo: {
            disponivel,
            bloqueado,
            total: disponivel + bloqueado
          },
          consultadoEm: saldo.consultadoEm,
          gateway: 'efipay'
        }
      };
      
    } catch (error: any) {
      console.error('❌ [BALANCE] Erro na interface PagTracker:', error);
      
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  // ================================================================
  // MÉTODOS AUXILIARES
  // ================================================================

  /**
   * Formatar valor em reais para exibição
   */
  formatarValor(valor: string): string {
    const numero = parseFloat(valor);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numero);
  }

  /**
   * Converter centavos para reais
   */
  centavosParaReais(centavos: number): string {
    return (centavos / 100).toFixed(2);
  }

  /**
   * Converter reais para centavos
   */
  reaisParaCentavos(reais: string): number {
    return Math.round(parseFloat(reais) * 100);
  }

  /**
   * Health check do serviço
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; saldoDisponivel?: boolean }> {
    try {
      // Tentar consultar saldo
      const saldo = await this.consultarSaldo();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        saldoDisponivel: parseFloat(saldo.saldo.disponivel.valor) > 0
      };
    } catch (error) {
      throw new Error(`Serviço indisponível: ${error}`);
    }
  }
}

// ================================================================
// EXPORT DEFAULT
// ================================================================

export default EfiPayBalanceService;
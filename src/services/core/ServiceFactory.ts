import { TenantInfo } from '@/middleware/tenant/info';

/**
 * Fábrica de serviços
 * Responsável por criar e gerenciar instâncias de serviços com o contexto do tenant correto
 */
export class ServiceFactory {
  private tenantInfo: TenantInfo;
  private serviceInstances: Map<string, any>;
  
  /**
   * @param tenantInfo Informações do tenant
   */
  constructor(tenantInfo: TenantInfo) {
    this.tenantInfo = tenantInfo;
    this.serviceInstances = new Map<string, any>();
  }
  
  /**
   * Obtém uma instância de serviço
   * Cria uma nova instância se necessário, ou retorna uma existente
   * 
   * @param ServiceClass Classe do serviço
   * @param args Argumentos adicionais para o construtor
   * @returns Instância do serviço
   */
  getService<T>(ServiceClass: new (tenantId: string, userId: string, ...args: any[]) => T, ...args: any[]): T {
    const serviceKey = ServiceClass.name;
    
    // Verifica se já existe uma instância
    if (this.serviceInstances.has(serviceKey)) {
      return this.serviceInstances.get(serviceKey) as T;
    }
    
    // Cria uma nova instância
    const service = new ServiceClass(
      this.tenantInfo.tenantId, 
      this.tenantInfo.userId,
      ...args
    );
    
    // Armazena a instância
    this.serviceInstances.set(serviceKey, service);
    
    return service;
  }
  
  /**
   * Cria uma fábrica de serviços com base nas informações do tenant
   * 
   * @param tenantInfo Informações do tenant
   * @returns Fábrica de serviços
   */
  static fromTenantInfo(tenantInfo: TenantInfo): ServiceFactory {
    return new ServiceFactory(tenantInfo);
  }
  
  /**
   * Cria uma fábrica de serviços a partir dos headers de requisição
   * 
   * @param headers Headers da requisição
   * @returns Fábrica de serviços ou null se não houver informações do tenant
   */
  static fromHeaders(headers: Headers): ServiceFactory | null {
    const tenantId = headers.get('x-tenant-id');
    const userId = headers.get('x-user-id');
    const userRole = headers.get('x-user-role');
    
    if (!tenantId || !userId) {
      return null;
    }
    
    return this.fromTenantInfo({
      tenantId,
      userId,
      userRole: userRole || 'USER'
    });
  }
} 
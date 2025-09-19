/**
 * @Entity Charge
 * Entidade principal para cobranças - Camada de Domínio
 */
export interface ChargeData {
  id?: string;
  user_id?: string;
  tenant_id?: string;
  valor?: number;
  descricao?: string;
  status?: string;
  txid?: string;
  qr_code?: string;
  qr_code_image?: string;
  link_pagamento?: string;
  created_at?: string;
  updated_at?: string;
  expires_at?: string;
}

export const Charge = ({
  id,  // Não definir valor padrão - deixar o banco gerar o UUID
  user_id,
  tenant_id,
  valor = Number(0),
  descricao = String('Pagamento via Pix'),
  status = String('pendente'),
  txid = String(''),
  qr_code = String(''),
  qr_code_image = String(''),
  link_pagamento = String(''),
  created_at = new Date().toISOString(),
  updated_at = new Date().toISOString(),
  expires_at = String(''),
  ...rest
}: ChargeData) => {
  // Base entity data (persisted fields only)
  const baseEntity = {
    id,
    user_id,
    tenant_id,
    valor,
    descricao,
    status,
    txid,
    qr_code,
    qr_code_image,
    link_pagamento,
    created_at,
    updated_at,
    expires_at,
    ...rest
  };

  // Business logic methods (not persisted)
  const businessLogic = {
    // Getter para amount (compatibilidade com frontend)
    get amount(): number {
      return valor || 0;
    },
    
    // Computed properties - Business Logic
    getValorFormatado(): string {
      const valorNumerico = valor || 0;
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valorNumerico);
    },
    
    isExpired(): boolean {
      return expires_at ? new Date(expires_at) < new Date() : false;
    },
    
    isPending(): boolean {
      return status === 'pendente';
    },
    
    isPaid(): boolean {
      return status === 'pago';
    },
    
    isCanceled(): boolean {
      return status === 'cancelado';
    },
    
    getStatusLabel(): string {
      return getStatusLabel(status);
    },
    
    getTimeRemaining(): string {
      return getTimeRemaining(expires_at);
    }
  };

  return {
    ...baseEntity,
    ...businessLogic
  };
};

/**
 * Converte status para label legível
 */
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    'pendente': 'Pendente',
    'pago': 'Pago',
    'expirado': 'Expirado',
    'cancelado': 'Cancelado',
    'estornado': 'Estornado'
  };
  return statusMap[status] || 'Desconhecido';
}

/**
 * Calcula tempo restante para expiração
 */
function getTimeRemaining(expiresAt: string): string {
  if (!expiresAt) return '';
  
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expirado';
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}

export type ChargeEntity = ReturnType<typeof Charge>;
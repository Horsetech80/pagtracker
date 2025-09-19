/**
 * Value Object: Status
 * Responsável pela formatação de status - Clean Architecture
 */

export type StatusType = 'pendente' | 'pago' | 'cancelado' | 'expirado' | 'estornado';

export class Status {
  private readonly value: StatusType;

  constructor(status: StatusType) {
    this.value = status;
  }

  /**
   * Formata status para exibição
   */
  static format(status: StatusType): string {
    const statusMap: Record<StatusType, string> = {
      'pendente': 'Pendente',
      'pago': 'Pago',
      'cancelado': 'Cancelado',
      'expirado': 'Expirado',
      'estornado': 'Estornado'
    };
    return statusMap[status] || 'Desconhecido';
  }

  /**
   * Retorna cor CSS para o status
   */
  static getColor(status: StatusType): string {
    const colorMap: Record<StatusType, string> = {
      'pendente': 'bg-yellow-100 text-yellow-800',
      'pago': 'bg-green-100 text-green-800',
      'cancelado': 'bg-gray-100 text-gray-800',
      'expirado': 'bg-red-100 text-red-800',
      'estornado': 'bg-orange-100 text-orange-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Retorna variante do badge
   */
  static getBadgeVariant(status: StatusType): 'default' | 'secondary' | 'destructive' | 'outline' {
    const variantMap: Record<StatusType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'pendente': 'outline',
      'pago': 'default',
      'cancelado': 'secondary',
      'expirado': 'destructive',
      'estornado': 'secondary'
    };
    return variantMap[status] || 'secondary';
  }

  /**
   * Verifica se é um status de sucesso
   */
  static isSuccess(status: StatusType): boolean {
    return status === 'pago';
  }

  /**
   * Verifica se é um status de erro
   */
  static isError(status: StatusType): boolean {
    return ['cancelado', 'expirado', 'estornado'].includes(status);
  }

  /**
   * Verifica se é um status pendente
   */
  static isPending(status: StatusType): boolean {
    return status === 'pendente';
  }

  /**
   * Getter para label formatado
   */
  get label(): string {
    return Status.format(this.value);
  }

  /**
   * Getter para cor CSS
   */
  get color(): string {
    return Status.getColor(this.value);
  }

  /**
   * Getter para variante do badge
   */
  get badgeVariant(): 'default' | 'secondary' | 'destructive' | 'outline' {
    return Status.getBadgeVariant(this.value);
  }

  /**
   * Getter para valor bruto
   */
  get raw(): StatusType {
    return this.value;
  }

  /**
   * Getter para verificações de estado
   */
  get isSuccess(): boolean {
    return Status.isSuccess(this.value);
  }

  get isError(): boolean {
    return Status.isError(this.value);
  }

  get isPending(): boolean {
    return Status.isPending(this.value);
  }
} 
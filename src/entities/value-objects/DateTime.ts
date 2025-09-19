/**
 * Value Object: DateTime
 * Responsável pela formatação de datas - Clean Architecture
 */

export class DateTime {
  private readonly date: Date;

  constructor(date: string | Date) {
    this.date = typeof date === 'string' ? new Date(date) : date;
  }

  /**
   * Formata data no padrão brasileiro
   */
  static formatBR(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(d);
  }

  /**
   * Formata data e hora no padrão brasileiro
   */
  static formatDateTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  }

  /**
   * Formata apenas a hora
   */
  static formatTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  }

  /**
   * Retorna data relativa (há X dias)
   */
  static formatRelative(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now.getTime() - d.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    if (diffInHours < 24) return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    if (diffInDays < 30) return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
    
    return DateTime.formatBR(d);
  }

  /**
   * Getter para data formatada brasileira
   */
  get formatted(): string {
    return DateTime.formatBR(this.date);
  }

  /**
   * Getter para data e hora formatada
   */
  get dateTime(): string {
    return DateTime.formatDateTime(this.date);
  }

  /**
   * Getter para formato relativo
   */
  get relative(): string {
    return DateTime.formatRelative(this.date);
  }

  /**
   * Getter para ISO string
   */
  get iso(): string {
    return this.date.toISOString();
  }
} 
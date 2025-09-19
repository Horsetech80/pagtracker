/**
 * Value Object: Currency
 * Responsável pela formatação de valores monetários - Clean Architecture
 */

export class Currency {
  private readonly amount: number;
  private readonly currencyCode: string;

  constructor(amount: number, currencyCode: string = 'BRL') {
    this.amount = amount;
    this.currencyCode = currencyCode;
  }

  /**
   * Formata valor para moeda brasileira
   */
  static formatBRL(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }

  /**
   * Formata valor para qualquer moeda
   */
  static format(amount: number, currencyCode: string = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  }

  /**
   * Formata percentual
   */
  static formatPercentage(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }).format(value / 100);
  }

  /**
   * Formata número simples
   */
  static formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR').format(value);
  }

  /**
   * Getter para valor formatado
   */
  get formatted(): string {
    return Currency.format(this.amount, this.currencyCode);
  }

  /**
   * Getter para valor em centavos
   */
  get inCents(): number {
    return Math.round(this.amount * 100);
  }

  /**
   * Getter para valor bruto
   */
  get raw(): number {
    return this.amount;
  }
} 
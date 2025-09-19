import { SupabaseRepository } from './SupabaseRepository';
import { CheckoutConfigData } from '@/types/checkout';
import { Payment } from '../payment/PaymentService';
import { WebhookConfig, WebhookEvent } from '../webhook/WebhookService';

// URL e chave do Supabase devem vir de variáveis de ambiente em produção
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqcxbiofslypocltpxmb.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY3hiaW9mc2x5cG9jbHRweG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMjUxMTUsImV4cCI6MjA1OTkwMTExNX0.kOsMsS6ag_cNMQmAy6cnoSnargbN6WFJJbrck8dwym8';

/**
 * Fábrica para criação de repositórios Supabase
 */
export class SupabaseFactory {
  private static instance: SupabaseFactory;
  private repositories: Map<string, SupabaseRepository<any>>;

  private constructor() {
    this.repositories = new Map();
  }

  /**
   * Obtém a instância singleton da fábrica
   */
  public static getInstance(): SupabaseFactory {
    if (!SupabaseFactory.instance) {
      SupabaseFactory.instance = new SupabaseFactory();
    }
    return SupabaseFactory.instance;
  }

  /**
   * Obtém um repositório para uma tabela específica
   */
  private getRepository<T extends { id: string }>(table: string): SupabaseRepository<T> {
    const key = `repo_${table}`;
    if (!this.repositories.has(key)) {
      this.repositories.set(
        key,
        new SupabaseRepository<T>(SUPABASE_URL, SUPABASE_KEY, table)
      );
    }
    return this.repositories.get(key) as SupabaseRepository<T>;
  }

  /**
   * Repositório de Checkouts
   */
  public checkouts(): SupabaseRepository<CheckoutConfigData> {
    return this.getRepository<CheckoutConfigData>('checkouts');
  }

  /**
   * Repositório de Pagamentos
   */
  public payments(): SupabaseRepository<Payment> {
    return this.getRepository<Payment>('payments');
  }

  /**
   * Repositório de Webhooks
   */
  public webhooks(): SupabaseRepository<WebhookConfig> {
    return this.getRepository<WebhookConfig>('webhooks');
  }

  /**
   * Repositório de Eventos de Webhook
   */
  public webhookEvents(): SupabaseRepository<WebhookEvent> {
    return this.getRepository<WebhookEvent>('webhook_events');
  }
}
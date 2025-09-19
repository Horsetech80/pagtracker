import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IRepository } from './EntityService';

/**
 * Implementação da interface IRepository para o Supabase
 */
export class SupabaseRepository<T extends { id: string }> implements IRepository<T> {
  private supabase: SupabaseClient;
  private table: string;
  private url: string;
  private key: string;
  
  /**
   * @param url URL do Supabase
   * @param key Chave de API do Supabase
   * @param table Nome da tabela
   */
  constructor(url: string, key: string, table: string) {
    this.supabase = createClient(url, key);
    this.table = table;
    this.url = url;
    this.key = key;
  }
  
  /**
   * Busca múltiplos registros
   */
  async findMany(query: Partial<T> = {}, options: {
    limit?: number;
    skip?: number;
    orderBy?: { field: string; direction: 'asc' | 'desc' };
  } = {}): Promise<T[]> {
    let supaQuery = this.supabase
      .from(this.table)
      .select('*');
    
    // Aplicar filtros
    Object.entries(query).forEach(([key, value]) => {
      supaQuery = supaQuery.eq(key, value);
    });
    
    // Aplicar ordenação
    if (options.orderBy) {
      supaQuery = supaQuery.order(
        options.orderBy.field, 
        { ascending: options.orderBy.direction === 'asc' }
      );
    }
    
    // Aplicar paginação
    if (options.skip) {
            const endIndex = options.limit ? options.skip + options.limit - 1 : 999999;
      supaQuery = supaQuery.range(options.skip, endIndex);
    } else if (options.limit) {
      supaQuery = supaQuery.limit(options.limit);
    }
    
    const { data, error } = await supaQuery;
    
    if (error) {
      console.error('Erro ao buscar registros:', error);
      throw new Error(`Erro ao buscar registros: ${error.message}`);
    }
    
    return data as T[];
  }
  
  /**
   * Busca um único registro
   */
  async findOne(query: Partial<T>): Promise<T | null> {
    const results = await this.findMany(query, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }
  
  /**
   * Cria um novo registro
   */
  async create(data: T): Promise<T> {
    const { data: result, error } = await this.supabase
      .from(this.table)
      .insert(data)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar registro:', error);
      throw new Error(`Erro ao criar registro: ${error.message}`);
    }
    
    return result as T;
  }
  
  /**
   * Atualiza um registro existente
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    const { data: result, error } = await this.supabase
      .from(this.table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar registro:', error);
      throw new Error(`Erro ao atualizar registro: ${error.message}`);
    }
    
    return result as T;
  }
  
  /**
   * Remove um registro
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.table)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao excluir registro:', error);
      throw new Error(`Erro ao excluir registro: ${error.message}`);
    }
    
    return true;
  }
  
  /**
   * Retorna o cliente Supabase para operações avançadas
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Cria uma nova instância do repositório com as mesmas configurações de conexão,
   * mas para uma tabela diferente
   */
  forTable<U extends { id: string }>(table: string): SupabaseRepository<U> {
    return new SupabaseRepository<U>(
      this.url,
      this.key,
      table
    );
  }
}
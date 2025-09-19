import { IRepository } from './EntityService';

/**
 * Implementação de repositório em memória para teste
 * Em produção, seria substituído por implementações específicas para o banco de dados usado
 */
export class MemoryRepository<T extends { id: string }> implements IRepository<T> {
  private items: Map<string, T>;
  
  constructor(initialItems: T[] = []) {
    this.items = new Map<string, T>();
    
    // Carrega os itens iniciais
    initialItems.forEach(item => {
      this.items.set(item.id, item);
    });
  }
  
  /**
   * Busca múltiplos itens com base em uma consulta
   */
  async findMany(query: Partial<T> = {}, options: { 
    limit?: number; 
    skip?: number;
    orderBy?: { field: string; direction: 'asc' | 'desc' }
  } = {}): Promise<T[]> {
    const { limit, skip = 0, orderBy } = options;
    
    // Filtra os itens
    let results = Array.from(this.items.values()).filter(item => {
      // Verifica se o item atende a todos os critérios da consulta
      return Object.entries(query).every(([key, value]) => {
        return item[key as keyof T] === value;
      });
    });
    
    // Aplica ordenação se especificada
    if (orderBy) {
      results.sort((a, b) => {
        const fieldA = a[orderBy.field as keyof T];
        const fieldB = b[orderBy.field as keyof T];
        
        if (fieldA < fieldB) return orderBy.direction === 'asc' ? -1 : 1;
        if (fieldA > fieldB) return orderBy.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    // Aplica paginação
    results = results.slice(skip, limit ? skip + limit : undefined);
    
    return results;
  }
  
  /**
   * Busca um único item
   */
  async findOne(query: Partial<T>): Promise<T | null> {
    const items = await this.findMany(query, { limit: 1 });
    return items.length > 0 ? items[0] : null;
  }
  
  /**
   * Cria um novo item
   */
  async create(data: T): Promise<T> {
    if (!data.id) {
      throw new Error('ID é obrigatório');
    }
    
    // Verifica se já existe
    if (this.items.has(data.id)) {
      throw new Error(`Item com ID ${data.id} já existe`);
    }
    
    // Salva o item
    this.items.set(data.id, data);
    
    return data;
  }
  
  /**
   * Atualiza um item existente
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    // Busca o item
    const existingItem = this.items.get(id);
    
    if (!existingItem) {
      throw new Error(`Item com ID ${id} não encontrado`);
    }
    
    // Atualiza o item
    const updatedItem = {
      ...existingItem,
      ...data
    };
    
    // Salva as alterações
    this.items.set(id, updatedItem);
    
    return updatedItem;
  }
  
  /**
   * Remove um item
   */
  async delete(id: string): Promise<boolean> {
    // Verifica se existe
    if (!this.items.has(id)) {
      throw new Error(`Item com ID ${id} não encontrado`);
    }
    
    // Remove o item
    return this.items.delete(id);
  }
  
  /**
   * Limpa o repositório
   * Método auxiliar para testes
   */
  clear(): void {
    this.items.clear();
  }
  
  /**
   * Retorna todos os itens
   * Método auxiliar para testes
   */
  getAll(): T[] {
    return Array.from(this.items.values());
  }
} 
'use server';

import { Charge } from "@/lib/api/types";
import { createClient } from '@supabase/supabase-js';
// import { getDatabase, runQuery, getQueryRow, getQueryRows } from "./sqlite"; // Removido - não existe

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';

// Inicializar cache global para desenvolvimento
if (isDevelopment && !global.chargesMemoryCache) {
  global.chargesMemoryCache = new Map<string, Charge>();
  console.log('[INFO] Inicializando cache de cobranças em memória global');
}

// Função auxiliar para acessar o cache global
const getMemoryCache = (): Map<string, Charge> => {
  return (global.chargesMemoryCache as Map<string, Charge>) || new Map<string, Charge>();
};

/**
 * Salva uma cobrança no cache local (apenas memória)
 */
export async function cacheCharge(charge: Charge): Promise<void> {
  const cache = getMemoryCache();
  cache.set(charge.id, charge);
  console.log(`[Cache] Cobrança ${charge.id} salva no cache de memória`);
}

/**
 * Obtém uma cobrança do cache local (apenas memória)
 */
export async function getCachedCharge(id: string): Promise<Charge | null> {
  const cache = getMemoryCache();
  const charge = cache.get(id);
  return charge || null;
}

/**
 * Lista cobranças do cache local (apenas memória)
 */
export async function listCachedCharges(
  userId: string,
  limit: number = 10,
  offset: number = 0
): Promise<{ charges: Charge[], total: number }> {
  const cache = getMemoryCache();
  const userCharges = Array.from(cache.values())
    .filter(charge => charge.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  console.log(`[Cache] Encontradas ${userCharges.length} cobranças no cache de memória para o usuário ${userId}`);
  
  return {
    charges: userCharges.slice(offset, offset + limit),
    total: userCharges.length
  };
}

/**
 * Atualiza o status de uma cobrança no cache (apenas memória)
 */
export async function updateCachedChargeStatus(
  txid: string,
  status: string
): Promise<boolean> {
  const cache = getMemoryCache();
  let found = false;
  
  cache.forEach((charge, key) => {
    if (charge.txid === txid) {
      const updatedCharge = { ...charge, status: status as any, updated_at: new Date().toISOString() };
      cache.set(key, updatedCharge);
      found = true;
      console.log(`[Cache] Status da cobrança ${key} atualizado para ${status} no cache de memória`);
    }
  });
  
  return found;
}

/**
 * Remove cobranças antigas do cache (apenas memória)
 * @param olderThan Tempo em milissegundos (padrão: 7 dias)
 */
export async function cleanupCache(olderThan: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
  const cache = getMemoryCache();
  const cutoffDate = new Date(Date.now() - olderThan);
  let removedCount = 0;
  
  cache.forEach((charge, key) => {
    if (new Date(charge.created_at) < cutoffDate) {
      cache.delete(key);
      removedCount++;
    }
  });
  
  console.log(`[Cache] ${removedCount} cobranças antigas removidas da memória`);
  return removedCount;
}

export class CacheManager {
  private supabase;
  private cache: Map<string, any> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutos

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ... existing code ...
} 
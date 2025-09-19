'use client';

import { Charge } from '@/lib/api/types';

// Mock da interface do banco de dados para o cliente
// Estas funções serão usadas no lado do cliente quando não podemos acessar o SQLite

/**
 * Obtém uma cobrança do armazenamento local do navegador
 */
export function getLocalCharge(id: string): Charge | null {
  try {
    const chargeJson = localStorage.getItem(`charge_${id}`);
    if (!chargeJson) return null;
    
    return JSON.parse(chargeJson) as Charge;
  } catch (error) {
    console.error('Erro ao obter cobrança do localStorage:', error);
    return null;
  }
}

/**
 * Salva uma cobrança no armazenamento local do navegador
 */
export function saveLocalCharge(charge: Charge): void {
  try {
    localStorage.setItem(`charge_${charge.id}`, JSON.stringify(charge));
    console.log(`Cobrança ${charge.id} salva no localStorage`);
  } catch (error) {
    console.error('Erro ao salvar cobrança no localStorage:', error);
  }
}

/**
 * Lista cobranças do armazenamento local do navegador
 */
export function listLocalCharges(): Charge[] {
  try {
    const charges: Charge[] = [];
    
    // Buscar todas as chaves que começam com "charge_"
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('charge_')) {
        const chargeJson = localStorage.getItem(key);
        if (chargeJson) {
          charges.push(JSON.parse(chargeJson) as Charge);
        }
      }
    }
    
    return charges;
  } catch (error) {
    console.error('Erro ao listar cobranças do localStorage:', error);
    return [];
  }
}

/**
 * Armazena uma configuração no localStorage
 */
export function setLocalSetting<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`setting_${key}`, JSON.stringify(value));
  } catch (error) {
    console.error(`Erro ao salvar configuração ${key}:`, error);
  }
}

/**
 * Obtém uma configuração do localStorage
 */
export function getLocalSetting<T>(key: string, defaultValue: T): T {
  try {
    const value = localStorage.getItem(`setting_${key}`);
    if (!value) return defaultValue;
    
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Erro ao obter configuração ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Logger mock para o cliente
 */
export const clientLogger = {
  debug: (message: string, context?: Record<string, any>) => {
    console.debug(`[DEBUG] ${message}`, context);
  },
  info: (message: string, context?: Record<string, any>) => {
    console.info(`[INFO] ${message}`, context);
  },
  warn: (message: string, context?: Record<string, any>) => {
    console.warn(`[WARN] ${message}`, context);
  },
  error: (message: string, context?: Record<string, any>) => {
    console.error(`[ERROR] ${message}`, context);
  }
}; 
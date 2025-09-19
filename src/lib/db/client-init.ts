'use client';

import { useEffect } from 'react';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Hook para inicializar o banco de dados no cliente
 * Este hook deve ser usado em um componente client-side
 */
export function useLocalDatabase() {
  useEffect(() => {
    if (isDevelopment) {
      const initDatabase = async () => {
        try {
          // Importar dinamicamente para evitar problemas de SSR
          const { initDatabase } = await import('@/lib/db/index');
          initDatabase();
        } catch (error) {
          console.error('Erro ao inicializar banco de dados local:', error);
        }
      };
      
      initDatabase();
    }
  }, []);
}

/**
 * Componente para inicializar o banco de dados no cliente
 */
export function InitLocalDatabase() {
  useLocalDatabase();
  return null;
}

/**
 * Função para inicializar o banco de dados no lado do cliente
 * Está separada para evitar problemas de SSR
 */
export function initDatabaseOnClient() {
  // Se não estamos no cliente ou não estamos em desenvolvimento, não fazer nada
  if (typeof window === 'undefined' || !isDevelopment) {
    return;
  }
  
  // Inicialização lazy para evitar problemas de SSR
  setTimeout(async () => {
    try {
      const { initDatabase, performMaintenance } = await import('@/lib/db/index');
      
      // Inicializar banco
      initDatabase();
      
      // Executar manutenção uma vez por dia
      const lastMaintenance = localStorage.getItem('db_last_maintenance');
      const now = Date.now();
      
      if (!lastMaintenance || now - Number(lastMaintenance) > 24 * 60 * 60 * 1000) {
        performMaintenance();
        localStorage.setItem('db_last_maintenance', now.toString());
      }
    } catch (error) {
      console.error('Erro ao inicializar banco de dados local:', error);
    }
  }, 1000);
}

// Inicializar o banco no carregamento do script
initDatabaseOnClient(); 
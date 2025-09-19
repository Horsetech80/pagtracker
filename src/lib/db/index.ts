// Sistema de banco de dados unificado com Supabase
export * from './logger';
export * from './settings';
export * from './cache';

// Função para inicialização do sistema
import { logInfo } from './logger';
import { setSetting, getSetting } from './settings';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Inicializa o sistema de banco de dados com Supabase
 * Executa verificações de saúde e configurações iniciais
 */
export async function initDatabase() {
  try {
    // Verificar conexão com Supabase
    const supabase = createServiceClient();
    
    // Teste de conexão básica
    const { data, error } = await supabase.from('tenants').select('count').limit(1).single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned, mas conexão OK
      console.error('[Database] Erro de conexão com Supabase:', error);
      return null;
    }

    await logInfo('Sistema de banco de dados Supabase inicializado com sucesso');
    
    // Salvar a hora da última inicialização
    await setSetting('lastDatabaseInit', new Date().toISOString());
    
    // Verificar primeira execução
    const isFirstRun = !await getSetting('initialSetupComplete', false);
    if (isFirstRun) {
      await logInfo('Primeira execução detectada, realizando configuração inicial');
      await setSetting('initialSetupComplete', true);
      await setSetting('appVersion', process.env.npm_package_version || '4.0.0');
      await setSetting('systemInitDate', new Date().toISOString());
    }
    
    // Verificar versão da aplicação
    const currentVersion = process.env.npm_package_version || '4.0.0';
    const storedVersion = await getSetting('appVersion', '0.0.0');
    
    if (currentVersion !== storedVersion) {
      await logInfo(`Atualizando versão da aplicação: ${storedVersion} -> ${currentVersion}`);
      await setSetting('appVersion', currentVersion);
      await setSetting('lastVersionUpdate', new Date().toISOString());
    }
    
    return supabase;
  } catch (error) {
    console.error('[Database] Erro ao inicializar sistema de banco de dados:', error);
    return null;
  }
}

/**
 * Executa manutenção periódica do sistema
 */
export async function performMaintenance(): Promise<boolean> {
  try {
    await logInfo('Iniciando manutenção do sistema');
    
    // Verificar se é necessário fazer manutenção
    const lastMaintenance = await getSetting('lastDatabaseMaintenance', new Date(0).toISOString());
    const lastMaintenanceDate = new Date(lastMaintenance);
    const now = new Date();
    const daysSinceMaintenance = (now.getTime() - lastMaintenanceDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceMaintenance < 7) {
      await logInfo(`Manutenção não necessária (${Math.round(daysSinceMaintenance)} dias desde a última)`);
      return true;
    }
    
    // Importar funções de limpeza dinamicamente para evitar imports circulares
    const { cleanOldLogs } = await import('./logger');
    const { cleanupSettings } = await import('./settings');
    
    // Executar limpezas
    const logsRemoved = await cleanOldLogs(30);
    const settingsRemoved = await cleanupSettings();
    
    await setSetting('lastDatabaseMaintenance', now.toISOString());
    await setSetting('lastMaintenanceStats', {
      date: now.toISOString(),
      logsRemoved,
      settingsRemoved
    });
    
    await logInfo(`Manutenção concluída: ${logsRemoved} logs e ${settingsRemoved} configurações removidas`);
    
    return true;
  } catch (error) {
    console.error('[Database] Erro durante manutenção:', error);
    await logInfo(`Erro durante manutenção: ${error}`);
    return false;
  }
}

/**
 * Verifica a saúde do sistema de banco de dados
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'warning' | 'error';
  details: {
    supabase: boolean;
    lastInit: string;
    lastMaintenance: string;
    version: string;
  };
}> {
  try {
    const supabase = createServiceClient();
    
    // Teste de conexão
    const { error } = await supabase.from('tenants').select('count').limit(1).single();
    const supabaseHealthy = !error || error.code === 'PGRST116';
    
    const lastInit = await getSetting('lastDatabaseInit', 'Never');
    const lastMaintenance = await getSetting('lastDatabaseMaintenance', 'Never');
    const version = await getSetting('appVersion', 'Unknown');
    
    const status = supabaseHealthy ? 'healthy' : 'error';
    
    return {
      status,
      details: {
        supabase: supabaseHealthy,
        lastInit,
        lastMaintenance,
        version
      }
    };
  } catch (error) {
    console.error('[Database] Erro ao verificar saúde:', error);
    return {
      status: 'error',
      details: {
        supabase: false,
        lastInit: 'Error',
        lastMaintenance: 'Error',
        version: 'Error'
      }
    };
  }
} 
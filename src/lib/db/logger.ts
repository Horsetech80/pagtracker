'use server';

import { createServiceClient } from '@/lib/supabase/server';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Interface para registros de log
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  metadata?: any;
  tenant_id?: string;
  user_id?: string;
}

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log de informações no Supabase
 */
export async function logInfo(message: string, metadata?: any, tenantId?: string, userId?: string): Promise<void> {
  await logMessage('info', message, metadata, tenantId, userId);
}

/**
 * Log de debug no Supabase
 */
export async function logDebug(message: string, metadata?: any, tenantId?: string, userId?: string): Promise<void> {
  await logMessage('debug', message, metadata, tenantId, userId);
}

/**
 * Log de warning no Supabase
 */
export async function logWarn(message: string, metadata?: any, tenantId?: string, userId?: string): Promise<void> {
  await logMessage('warn', message, metadata, tenantId, userId);
}

/**
 * Log de erro no Supabase
 */
export async function logError(message: string, metadata?: any, tenantId?: string, userId?: string): Promise<void> {
  await logMessage('error', message, metadata, tenantId, userId);
}

/**
 * Função interna para salvar logs no Supabase
 */
async function logMessage(level: LogLevel, message: string, metadata?: any, tenantId?: string, userId?: string): Promise<void> {
  try {
    const supabase = createServiceClient();
    
    const logEntry: LogEntry = {
      level,
      message,
      metadata,
      tenant_id: tenantId,
      user_id: userId
    };

    const { error } = await supabase
      .from('system_logs')
      .insert(logEntry);

    if (error) {
      console.error('[Logger] Erro ao salvar log no Supabase:', error);
      // Fallback para console em caso de erro
      console.log(`[${level.toUpperCase()}]`, message, metadata);
    }
  } catch (error) {
    console.error('[Logger] Erro inesperado:', error);
    // Fallback para console
    console.log(`[${level.toUpperCase()}]`, message, metadata);
  }
}

/**
 * Obtém logs recentes do Supabase
 */
export async function getRecentLogs(limit: number = 100, level?: LogLevel, tenantId?: string): Promise<LogEntry[]> {
  try {
    const supabase = createServiceClient();
    
    let query = supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (level) {
      query = query.eq('level', level);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Logger] Erro ao buscar logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Logger] Erro inesperado ao buscar logs:', error);
    return [];
  }
}

/**
 * Limpa logs antigos (manutenção)
 */
export async function cleanOldLogs(daysToKeep: number = 30): Promise<number> {
  try {
    const supabase = createServiceClient();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await supabase
      .from('system_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select();

    if (error) {
      console.error('[Logger] Erro ao limpar logs antigos:', error);
      return 0;
    }

    console.log(`[Logger] ${data?.length || 0} logs antigos removidos`);
    return data?.length || 0;
  } catch (error) {
    console.error('[Logger] Erro inesperado ao limpar logs:', error);
    return 0;
  }
} 
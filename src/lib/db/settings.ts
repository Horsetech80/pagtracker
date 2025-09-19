'use server';

import { createServiceClient } from '@/lib/supabase/server';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';

// Cache em memória para configurações em desenvolvimento
const settingsCache: Record<string, any> = {
  'initialSetupComplete': true,
  'appVersion': '4.0.0',
  'lastDatabaseInit': new Date().toISOString(),
  'lastDatabaseMaintenance': new Date(Date.now() - 86400000).toISOString(),
  'theme': 'light'
};

/**
 * Obtém um valor de configuração do Supabase
 * @param key Chave da configuração
 * @param defaultValue Valor padrão caso a configuração não exista
 * @param tenantId ID do tenant (opcional)
 */
export async function getSetting<T>(key: string, defaultValue: T, tenantId?: string): Promise<T> {
  // Em desenvolvimento, usar cache em memória
  if (isDevelopment) {
    return (key in settingsCache) ? settingsCache[key] as T : defaultValue;
  }
  
  // Em produção, obter do Supabase
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .eq('tenant_id', tenantId || null)
      .single();
    
    if (error || !data) {
      return defaultValue;
    }
    
    // Tentativa de converter o valor armazenado
    try {
      return JSON.parse(data.value) as T;
    } catch {
      return data.value as unknown as T;
    }
  } catch (error) {
    console.error(`[Settings] Erro ao obter configuração ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Define um valor de configuração no Supabase
 * @param key Chave da configuração
 * @param value Valor a ser salvo
 * @param tenantId ID do tenant (opcional)
 */
export async function setSetting<T>(key: string, value: T, tenantId?: string): Promise<boolean> {
  // Em desenvolvimento, salvar no cache
  if (isDevelopment) {
    settingsCache[key] = value;
    console.log(`[Settings] Configuração ${key} salva no cache:`, value);
    return true;
  }
  
  // Em produção, salvar no Supabase
  try {
    const supabase = createServiceClient();
    
    const settingData = {
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
      tenant_id: tenantId || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('app_settings')
      .upsert(settingData);

    if (error) {
      console.error(`[Settings] Erro ao salvar configuração ${key}:`, error);
      return false;
    }

    console.log(`[Settings] Configuração ${key} salva no Supabase`);
    return true;
  } catch (error) {
    console.error(`[Settings] Erro inesperado ao salvar configuração ${key}:`, error);
    return false;
  }
}

/**
 * Remove uma configuração do Supabase
 * @param key Chave da configuração
 * @param tenantId ID do tenant (opcional)
 */
export async function deleteSetting(key: string, tenantId?: string): Promise<boolean> {
  // Em desenvolvimento, remover do cache
  if (isDevelopment) {
    delete settingsCache[key];
    console.log(`[Settings] Configuração ${key} removida do cache`);
    return true;
  }
  
  // Em produção, remover do Supabase
  try {
    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from('app_settings')
      .delete()
      .eq('key', key)
      .eq('tenant_id', tenantId || null);

    if (error) {
      console.error(`[Settings] Erro ao remover configuração ${key}:`, error);
      return false;
    }

    console.log(`[Settings] Configuração ${key} removida do Supabase`);
    return true;
  } catch (error) {
    console.error(`[Settings] Erro inesperado ao remover configuração ${key}:`, error);
    return false;
  }
}

/**
 * Obtém todas as configurações de um tenant
 * @param tenantId ID do tenant (opcional)
 */
export async function getAllSettings(tenantId?: string): Promise<Record<string, any>> {
  // Em desenvolvimento, retornar cache
  if (isDevelopment) {
    return { ...settingsCache };
  }
  
  // Em produção, obter do Supabase
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .eq('tenant_id', tenantId || null);

    if (error) {
      console.error('[Settings] Erro ao obter todas as configurações:', error);
      return {};
    }

    const settings: Record<string, any> = {};
    
    data?.forEach(({ key, value }) => {
      try {
        settings[key] = JSON.parse(value);
      } catch {
        settings[key] = value;
      }
    });

    return settings;
  } catch (error) {
    console.error('[Settings] Erro inesperado ao obter configurações:', error);
    return {};
  }
}

/**
 * Limpa configurações antigas ou temporárias
 */
export async function cleanupSettings(): Promise<number> {
  if (isDevelopment) {
    return 0;
  }

  try {
    const supabase = createServiceClient();
    
    // Remove configurações mais antigas que 1 ano
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

    const { data, error } = await supabase
      .from('app_settings')
      .delete()
      .lt('updated_at', cutoffDate.toISOString())
      .select();

    if (error) {
      console.error('[Settings] Erro ao limpar configurações antigas:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('[Settings] Erro inesperado ao limpar configurações:', error);
    return 0;
  }
} 
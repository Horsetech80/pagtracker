/**
 * PIX Status Sync - PagTracker v4.0
 * 
 * Serviço simples para sincronizar status de cobranças PIX com a EfiPay
 */

import { getCurrentEfiPayConfig } from '@/config/efipay';
import { supabase } from '@/lib/supabase';
import { EfiPayAuthService } from '@/services/efipay/EfiPayAuthService';
import { EfiPayPixService } from '@/services/efipay/EfiPayPixService';

interface ChargeToSync {
  id: string;
  txid: string;
  tenant_id: string;
  current_status: string;
}

interface SyncResult {
  success: boolean;
  updated: number;
  errors: string[];
}

/**
 * Sincroniza o status de cobranças PIX pendentes
 */
export async function syncPixCharges(tenantId?: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    updated: 0,
    errors: []
  };

  try {
    console.log('Iniciando sincronização PIX...', { tenantId });

    // Buscar cobranças que precisam ser sincronizadas
    const chargesToSync = await getChargesToSync(tenantId);
    
    if (chargesToSync.length === 0) {
      console.log('Nenhuma cobrança para sincronizar');
      return result;
    }

    console.log(`Sincronizando ${chargesToSync.length} cobranças...`);

    // Sincronizar cada cobrança
    for (const charge of chargesToSync) {
      try {
        const updated = await syncSingleCharge(charge);
        if (updated) {
          result.updated++;
        }
      } catch (error) {
        const errorMsg = `Erro ao sincronizar cobrança ${charge.txid}: ${(error as Error).message}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    console.log('Sincronização concluída', {
      total: chargesToSync.length,
      updated: result.updated,
      errors: result.errors.length
    });

    return result;

  } catch (error) {
    console.error('Erro na sincronização PIX:', error);
    result.success = false;
    result.errors.push((error as Error).message);
    return result;
  }
}

/**
 * Busca cobranças que precisam ser sincronizadas
 */
async function getChargesToSync(tenantId?: string): Promise<ChargeToSync[]> {
  let query = supabase
    .from('charges')
    .select('id, txid, tenant_id, status')
    .in('status', ['ATIVA', 'PENDENTE'])
    .not('txid', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50); // Limitar para evitar sobrecarga

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar cobranças: ${error.message}`);
  }

  return (data || []).map(charge => ({
    id: charge.id,
    txid: charge.txid,
    tenant_id: charge.tenant_id,
    current_status: charge.status
  }));
}

/**
 * Sincroniza uma única cobrança
 */
async function syncSingleCharge(charge: ChargeToSync): Promise<boolean> {
  try {
    // Criar instância do EfiPayPixService
    const authService = new EfiPayAuthService(charge.tenant_id, 'system');
    const pixService = new EfiPayPixService(authService);
    
    // Consultar status na EfiPay
    const response = await pixService.getPixCharge(charge.txid);

    const newStatus = response.status;
    
    // Verificar se o status mudou
    if (newStatus === charge.current_status) {
      return false; // Não houve mudança
    }

    console.log(`Atualizando status da cobrança ${charge.txid}: ${charge.current_status} -> ${newStatus}`);

    // Atualizar status no banco
    const { error } = await supabase
      .from('charges')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', charge.id);

    if (error) {
      throw new Error(`Erro ao atualizar cobrança: ${error.message}`);
    }

    return true; // Status foi atualizado

  } catch (error) {
    // Se a cobrança não for encontrada na EfiPay, marcar como expirada
    if ((error as any)?.name === 'GN_ERROR' && (error as any)?.code === 404) {
      console.log(`Cobrança ${charge.txid} não encontrada na EfiPay, marcando como expirada`);
      
      await supabase
        .from('charges')
        .update({ 
          status: 'EXPIRADA',
          updated_at: new Date().toISOString()
        })
        .eq('id', charge.id);
      
      return true;
    }

    throw error;
  }
}

/**
 * Sincroniza uma cobrança específica pelo TXID
 */
export async function syncChargeByTxid(txid: string): Promise<boolean> {
  try {
    // Buscar a cobrança no banco
    const { data: charge, error } = await supabase
      .from('charges')
      .select('id, txid, tenant_id, status')
      .eq('txid', txid)
      .single();

    if (error || !charge) {
      throw new Error(`Cobrança não encontrada: ${txid}`);
    }

    // Sincronizar
    return await syncSingleCharge({
      id: charge.id,
      txid: charge.txid,
      tenant_id: charge.tenant_id,
      current_status: charge.status
    });

  } catch (error) {
    console.error(`Erro ao sincronizar cobrança ${txid}:`, error);
    throw error;
  }
}
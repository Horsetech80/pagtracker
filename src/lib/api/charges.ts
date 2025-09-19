import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Charge, ChargeStatus, CreateChargeParams } from "./types";
import { GerencianetClient } from "../gerencianet/client";

/**
 * Cria uma nova cobrança para um usuário
 */
export async function createCharge(
  userId: string, 
  params: CreateChargeParams
): Promise<Charge> {
  const supabase = await createServerSupabaseClient();
  
  // Obter as credenciais do usuário
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('api_key_gerencianet, client_id_gerencianet, client_secret_gerencianet')
    .eq('id', userId)
    .single();
  
  if (userError || !userData) {
    console.error('Erro ao buscar dados do usuário:', userError);
    throw new Error('Usuário não encontrado ou não tem credenciais configuradas');
  }
  
  // Verificar se o usuário tem as credenciais configuradas
  if (!userData.api_key_gerencianet || !userData.client_id_gerencianet || !userData.client_secret_gerencianet) {
    throw new Error('Configurações de API da Gerencianet não encontradas');
  }
  
  try {
    // Instanciar o cliente da Gerencianet
    const gnClient = new GerencianetClient(
      userData.api_key_gerencianet,
      userData.client_id_gerencianet,
      userData.client_secret_gerencianet,
      true // Sandbox
    );
    
    // Criar a cobrança na Gerencianet
    const qrCodeData = await gnClient.createCharge({
      valor: params.valor,
      descricao: params.descricao,
      expiracao: params.expiracao,
    });
    
    // Calcular a data de expiração
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (params.expiracao || 3600));
    
    // Criar a cobrança no Supabase
    const { data: chargeData, error: chargeError } = await supabase
      .from('charges')
      .insert({
        user_id: userId,
        valor: params.valor,
        descricao: params.descricao || 'Pagamento via Pix',
        status: 'pendente' as ChargeStatus,
        txid: qrCodeData.txid,
        qr_code: qrCodeData.qrCode,
        qr_code_image: qrCodeData.imagemQrCode,
        link_pagamento: qrCodeData.linkPagamento,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();
    
    if (chargeError) {
      console.error('Erro ao criar cobrança no banco:', chargeError);
      throw new Error('Falha ao salvar cobrança no banco de dados');
    }
    
    return chargeData as Charge;
  } catch (error) {
    console.error('Erro ao criar cobrança:', error);
    throw new Error('Falha ao criar cobrança');
  }
}

/**
 * Atualiza o status de uma cobrança
 */
export async function updateChargeStatus(
  txid: string, 
  status: ChargeStatus
): Promise<Charge> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('charges')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('txid', txid)
    .select()
    .single();
  
  if (error) {
    console.error('Erro ao atualizar status da cobrança:', error);
    throw new Error('Falha ao atualizar status da cobrança');
  }
  
  return data as Charge;
}

/**
 * Lista cobranças de um usuário com paginação
 */
export async function listCharges(
  userId: string,
  page: number = 1,
  limit: number = 10,
  status?: ChargeStatus
): Promise<{ charges: Charge[], total: number }> {
  const supabase = await createServerSupabaseClient();
  
  // Calcular o offset baseado na página
  const offset = (page - 1) * limit;
  
  // Construir a query
  let query = supabase
    .from('charges')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  // Filtrar por status se especificado
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error('Erro ao listar cobranças:', error);
    throw new Error('Falha ao listar cobranças');
  }
  
  return {
    charges: data as Charge[],
    total: count || 0,
  };
}

/**
 * Busca detalhes de uma cobrança
 */
export async function getCharge(
  id: string,
  userId: string
): Promise<Charge> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('charges')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Erro ao buscar cobrança:', error);
    throw new Error('Cobrança não encontrada');
  }
  
  return data as Charge;
}

/**
 * Processa o reembolso de uma cobrança
 */
export async function refundCharge(
  id: string,
  userId: string,
  valor?: number,
  motivo: string = 'Reembolso solicitado pelo cliente'
): Promise<any> {
  const supabase = await createServerSupabaseClient();
  
  // Obter a cobrança
  const { data: charge, error: chargeError } = await supabase
    .from('charges')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  
  if (chargeError || !charge) {
    console.error('Erro ao buscar cobrança:', chargeError);
    throw new Error('Cobrança não encontrada');
  }
  
  // Verificar se a cobrança está paga
  if (charge.status !== 'pago') {
    throw new Error('Apenas cobranças pagas podem ser reembolsadas');
  }
  
  // Obter os detalhes da transação na Gerencianet para recuperar o e2eid
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('api_key_gerencianet, client_id_gerencianet, client_secret_gerencianet')
    .eq('id', userId)
    .single();
  
  if (userError || !userData) {
    console.error('Erro ao buscar dados do usuário:', userError);
    throw new Error('Usuário não encontrado ou não tem credenciais configuradas');
  }
  
  try {
    // Instanciar o cliente da Gerencianet
    const gnClient = new GerencianetClient(
      userData.api_key_gerencianet,
      userData.client_id_gerencianet,
      userData.client_secret_gerencianet,
      true // Sandbox
    );
    
    // Consultar a cobrança para obter o e2eid (ID da transação)
    const chargeDetails = await gnClient.getChargeStatus(charge.txid);
    
    if (!chargeDetails.pix || !chargeDetails.pix[0] || !chargeDetails.pix[0].endToEndId) {
      throw new Error('Dados da transação não encontrados. Não é possível processar o reembolso.');
    }
    
    const e2eid = chargeDetails.pix[0].endToEndId;
    
    // Processar o reembolso
    const refundResult = await gnClient.refundCharge(
      e2eid,
      valor || charge.valor,
      motivo
    );
    
    // Atualizar o status da cobrança no banco de dados
    await supabase
      .from('charges')
      .update({ 
        status: 'reembolsado',
        updated_at: new Date().toISOString(),
        refund_data: {
          refund_id: refundResult.id,
          valor: refundResult.valor,
          motivo,
          data: new Date().toISOString()
        }
      })
      .eq('id', id);
    
    return {
      id: refundResult.id,
      status: refundResult.status,
      valor: refundResult.valor
    };
  } catch (error) {
    console.error('Erro ao processar reembolso:', error);
    throw new Error('Falha ao processar reembolso: ' + (error as Error).message);
  }
} 
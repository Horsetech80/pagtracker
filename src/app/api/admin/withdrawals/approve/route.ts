import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { EfiPayAuthService } from '@/services/efipay/EfiPayAuthService';
import { EfiPayPixEnvioService } from '@/services/efipay/EfiPayPixEnvioService';
import { PagTrackerPixEnvioRequest } from '@/types/efipay';
import { notifyWithdrawalStatusChange } from '@/lib/notifications/withdrawal';

// Função auxiliar para retry automático
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Verificar se é um erro temporário que vale a pena tentar novamente
      const isRetryableError = 
        error instanceof Error && (
          error.message.includes('timeout') ||
          error.message.includes('network') ||
          error.message.includes('connection') ||
          error.message.includes('503') ||
          error.message.includes('502') ||
          error.message.includes('500')
        );
      
      if (!isRetryableError || attempt === maxRetries) {
        throw error;
      }
      
      console.log(`[RETRY] Tentativa ${attempt}/${maxRetries} falhou, tentando novamente em ${delayMs}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt)); // Backoff exponencial
    }
  }
  
  throw lastError!;
}

// Schema de validação para aprovação/rejeição
const approvalSchema = z.object({
  withdrawal_id: z.string().uuid('ID do saque inválido'),
  action: z.enum(['approve', 'reject'], {
    message: 'Ação deve ser approve ou reject'
  }),
  admin_notes: z.string().optional(),
  rejection_reason: z.string().optional()
}).refine((data) => {
  // Se a ação for reject, rejection_reason é obrigatório
  if (data.action === 'reject' && !data.rejection_reason?.trim()) {
    return false;
  }
  return true;
}, {
  message: 'Motivo da rejeição é obrigatório quando a ação for reject',
  path: ['rejection_reason']
});

export async function POST(request: NextRequest) {
  try {
    // Verificar se é um admin
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json(
        { error: 'Acesso negado - Admin requerido' },
        { status: 403 }
      );
    }

    // Parse e validação do body
    const body = await request.json();
    const validatedData = approvalSchema.parse(body);

    const { withdrawal_id, action, admin_notes, rejection_reason } = validatedData;

    // Criar cliente Supabase
    const supabase = createServiceClient();

    // Buscar o saque para validação
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select(`
        *,
        users:user_id(id, nome, email),
        tenants:tenant_id(id, nome)
      `)
      .eq('id', withdrawal_id)
      .single();

    if (fetchError || !withdrawal) {
      console.error('Erro ao buscar saque:', fetchError);
      return NextResponse.json(
        { error: 'Saque não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o saque está em status válido para aprovação/rejeição
    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { 
          error: `Saque não pode ser ${action === 'approve' ? 'aprovado' : 'rejeitado'} - Status atual: ${withdrawal.status}` 
        },
        { status: 400 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      approved_by: adminId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Adicionar campos específicos baseado na ação
    if (action === 'approve') {
      if (admin_notes) {
        updateData.admin_notes = admin_notes;
      }
      // Para aprovação, o status será 'approved' e depois será processado pelo EfiPay
    } else {
      // Para rejeição
      updateData.rejected_reason = rejection_reason;
      if (admin_notes) {
        updateData.admin_notes = admin_notes;
      }
    }

    // Buscar dados atuais do saque para comparação
    const previousStatus = withdrawal.status;

    // Atualizar o saque no banco
    const { data: updatedWithdrawal, error: updateError } = await supabase
      .from('withdrawals')
      .update(updateData)
      .eq('id', withdrawal_id)
      .select(`
        *,
        users:user_id(id, nome, email),
        tenants:tenant_id(id, nome)
      `)
      .single();

    if (updateError) {
      console.error('Erro ao atualizar saque:', updateError);
      return NextResponse.json(
        { error: 'Erro ao processar solicitação' },
        { status: 500 }
      );
    }

    // Enviar notificação de mudança de status
    try {
      await notifyWithdrawalStatusChange(updatedWithdrawal, previousStatus);
    } catch (notificationError) {
      console.error('Erro ao enviar notificação:', notificationError);
    }

    // Se foi aprovado, iniciar processamento PIX
    if (action === 'approve') {
      console.log(`Saque ${withdrawal_id} aprovado - Valor: R$ ${withdrawal.amount_cents / 100}`);
      
      // Processar PIX via EfiPay
      await processPixWithdrawal(updatedWithdrawal);
    }

    // Log da ação para auditoria
    console.log(`Admin ${adminId} ${action === 'approve' ? 'aprovou' : 'rejeitou'} saque ${withdrawal_id}`);

    // Resposta de sucesso
    return NextResponse.json({
      success: true,
      message: action === 'approve' 
        ? 'Saque aprovado com sucesso' 
        : 'Saque rejeitado com sucesso',
      withdrawal: updatedWithdrawal,
      action,
      processed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na API de aprovação de saques:', error);
    
    // Erro de validação do Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para processar PIX via EfiPay
async function processPixWithdrawal(withdrawal: any) {
  const supabase = createServiceClient();
  
  try {
    console.log(`Iniciando processamento PIX para saque ${withdrawal.id}`);
    
    // Atualizar status para processing
    const { data: processingWithdrawal } = await supabase
      .from('withdrawals')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawal.id)
      .select(`
        *,
        users:user_id(id, nome, email),
        tenants:tenant_id(id, nome)
      `)
      .single();

    // Notificar sobre processamento
    if (processingWithdrawal) {
      try {
        await notifyWithdrawalStatusChange(processingWithdrawal, 'approved');
      } catch (notificationError) {
        console.error('Erro ao enviar notificação de processamento:', notificationError);
      }
    }

    // Inicializar serviços EfiPay
     const authService = new EfiPayAuthService(processingWithdrawal.tenant_id, 'system');
     const pixService = new EfiPayPixEnvioService(authService);
     
     // Validações rigorosas antes do envio
  // Obter chave PIX da empresa a partir da configuração EfiPay
  const { getCurrentEfiPayConfig } = await import('@/config/efipay');
  const efiPayConfig = getCurrentEfiPayConfig();
  const payerPixKey = withdrawal.payer_pix_key || (efiPayConfig as any).PIX_KEY;
  
  if (!payerPixKey) {
    throw new Error('Chave PIX do pagador não configurada. Verifique EFIPAY_PIX_KEY ou EFIPAY_PROD_PIX_KEY nas variáveis de ambiente.');
  }

  // Validar chave PIX do destinatário
  if (!withdrawal.pix_key || withdrawal.pix_key.trim().length === 0) {
    throw new Error('Chave PIX do destinatário é obrigatória');
  }

  // Validar valor do saque
  if (!withdrawal.amount_cents || withdrawal.amount_cents <= 0) {
    throw new Error('Valor do saque deve ser maior que zero');
  }

  // Validar valor máximo (R$ 50.000,00 = 5.000.000 centavos)
  if (withdrawal.amount_cents > 5000000) {
    throw new Error('Valor do saque excede o limite máximo de R$ 50.000,00');
  }

  // Validar dados do destinatário
  if (!withdrawal.recipient_name || withdrawal.recipient_name.trim().length === 0) {
    throw new Error('Nome do destinatário é obrigatório');
  }

  // Validar formato da chave PIX (básico)
  const pixKeyRegex = /^[\w\-\.@+]+$/;
  if (!pixKeyRegex.test(withdrawal.pix_key)) {
    throw new Error('Formato da chave PIX inválido');
  }

  // Preparar dados para envio PIX
  const pixData: PagTrackerPixEnvioRequest = {
    amount: withdrawal.amount_cents, // Manter em centavos conforme interface
    payerPixKey: payerPixKey, // Chave PIX da empresa
    recipient: {
      pixKey: withdrawal.pix_key.trim() // Usar apenas a chave PIX do destinatário
    },
    description: `Saque PIX - ${withdrawal.recipient_name}`,
    reference: `SAQUE-${withdrawal.id}`,
    validateRecipientDocument: true // Validar titularidade da chave
  };
     
     // Log início do processamento PIX
     console.log(`[PIX] Iniciando envio PIX para saque ${withdrawal.id}:`, {
       amount_cents: withdrawal.amount_cents,
       pix_key: withdrawal.pix_key,
       recipient_name: withdrawal.recipient_name,
       payer_pix_key: payerPixKey
     });

     // Enviar PIX via EfiPay com retry automático
      const pixResponse = await retryOperation(
        () => pixService.enviarPixPagTracker(pixData, withdrawal.tenant_id),
        3, // Máximo 3 tentativas
        1000 // Delay inicial de 1 segundo
      );
    
    // Log resposta da EfiPay
    console.log(`[PIX] Resposta EfiPay para saque ${withdrawal.id}:`, {
      id: pixResponse.id,
      e2eId: pixResponse.e2eId,
      status: pixResponse.status
    });
    
    // Atualizar com dados do PIX
     const { data: completedWithdrawal } = await supabase
       .from('withdrawals')
       .update({
         status: 'completed',
         efipay_transaction_id: pixResponse.id,
         efipay_e2e_id: pixResponse.e2eId,
         processed_at: new Date().toISOString(),
         updated_at: new Date().toISOString()
       })
       .eq('id', withdrawal.id)
       .select(`
         *,
         users:user_id(id, nome, email),
         tenants:tenant_id(id, nome)
       `)
       .single();

    // Notificar sobre conclusão
    if (completedWithdrawal) {
      try {
        await notifyWithdrawalStatusChange(completedWithdrawal, 'processing');
        console.log(`[PIX] Notificação de conclusão enviada para saque ${withdrawal.id}`);
      } catch (notificationError) {
        console.error(`[PIX] Erro ao enviar notificação de conclusão para saque ${withdrawal.id}:`, notificationError);
      }
    }
    
    console.log(`[PIX] PIX processado com sucesso para saque ${withdrawal.id}`);
    
  } catch (error) {
    console.error(`[PIX] Erro ao processar PIX do saque ${withdrawal.id}:`, {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      withdrawal_id: withdrawal.id,
      tenant_id: withdrawal.tenant_id
    });
    
    // Em caso de erro, atualizar status para failed
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const { data: failedWithdrawal, error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'failed',
        admin_notes: `Erro ao processar PIX via EfiPay: ${errorMessage}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawal.id)
      .select(`
        *,
        users:user_id(id, nome, email),
        tenants:tenant_id(id, nome)
      `)
      .single();

    if (updateError) {
      console.error(`[PIX] Erro ao atualizar saque ${withdrawal.id} para failed:`, updateError);
    } else {
      console.log(`[PIX] Saque ${withdrawal.id} atualizado para failed no banco de dados`);
    }

    // Notificar sobre falha
    if (failedWithdrawal) {
      try {
        await notifyWithdrawalStatusChange(failedWithdrawal, 'processing');
        console.log(`[PIX] Notificação de falha enviada para saque ${withdrawal.id}`);
      } catch (notificationError) {
        console.error(`[PIX] Erro ao enviar notificação de falha para saque ${withdrawal.id}:`, notificationError);
      }
    }
      
    throw error; // Re-throw para que o erro seja tratado na função principal
  }
}
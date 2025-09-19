import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateChargeStatus } from '@/lib/api/charges';
import { syncChargeByTxid } from '@/services/payment/PixStatusSync';
import { getCurrentEfiPayConfig } from '@/config/efipay';

/**
 * Endpoint POST para receber webhooks da EfiPay
 * Conforme documentação oficial: https://dev.efipay.com.br/docs/api-pix/webhooks
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📥 [WEBHOOK] Recebendo notificação EfiPay...');
    
    // Obter configuração atual da EfiPay
    const efiConfig = getCurrentEfiPayConfig();
    const webhookSecret = process.env.EFIPAY_WEBHOOK_SECRET || 'pagtracker-efipay-webhook-secret-2024';
    
    // Ler o corpo da requisição
    const body = await request.text();
    const signature = request.headers.get('x-efipay-signature') || request.headers.get('x-signature');
    
    console.log('🔍 [WEBHOOK] Headers recebidos:', {
      'content-type': request.headers.get('content-type'),
      'user-agent': request.headers.get('user-agent'),
      'x-efipay-signature': signature ? 'presente' : 'ausente',
      'content-length': body.length
    });

    // Validar assinatura se configurada
    if (webhookSecret && signature) {
      const isValidSignature = validateWebhookSignature(body, signature, webhookSecret);
      if (!isValidSignature) {
        console.error('❌ [WEBHOOK] Assinatura inválida');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
      console.log('✅ [WEBHOOK] Assinatura validada com sucesso');
    } else if (webhookSecret) {
      console.warn('⚠️ [WEBHOOK] Secret configurado mas assinatura não fornecida');
    }

    // Parse do JSON
    let webhookData;
    try {
      webhookData = JSON.parse(body);
    } catch (parseError) {
      console.error('❌ [WEBHOOK] Erro ao fazer parse do JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    console.log('📋 [WEBHOOK] Dados recebidos:', JSON.stringify(webhookData, null, 2));

    // Validar estrutura básica
    if (!webhookData.pix || !Array.isArray(webhookData.pix)) {
      console.error('❌ [WEBHOOK] Estrutura inválida: campo "pix" não encontrado ou não é array');
      return NextResponse.json(
        { error: 'Invalid webhook structure' },
        { status: 400 }
      );
    }

    // Processar cada transação PIX
    for (const pixData of webhookData.pix) {
      await processPixNotification(pixData);
    }

    console.log('✅ [WEBHOOK] Processamento concluído com sucesso');
    return NextResponse.json({ status: 'success' });

  } catch (error) {
    console.error('❌ [WEBHOOK] Erro no processamento:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Processar notificação PIX individual
 */
async function processPixNotification(pixData: any) {
  try {
    console.log('🔄 [WEBHOOK] Processando PIX:', {
      endToEndId: pixData.endToEndId,
      txid: pixData.txid,
      valor: pixData.valor,
      chave: pixData.chave,
      horario: pixData.horario
    });
    
    // Validar dados obrigatórios
    if (!pixData.txid) {
      console.warn('⚠️ [WEBHOOK] PIX sem txid - ignorando notificação');
      return;
    }
    
    // Importar dependências necessárias
    const { updateChargeStatus } = await import('@/lib/api/charges');
    
    // Buscar e atualizar cobrança no banco de dados
    try {
      const updatedCharge = await updateChargeStatus(pixData.txid, 'pago');
      
      console.log('✅ [WEBHOOK] Cobrança atualizada:', {
        txid: updatedCharge.txid,
        status: updatedCharge.status,
        valor: updatedCharge.valor,
        endToEndId: pixData.endToEndId
      });
      
      // Implementar notificações e atualizações adicionais
      try {
        // Notificar tenant sobre o pagamento (implementar conforme necessário)
        // await notifyTenant(pixData.tenant_id, pixData);
        
        // Executar webhooks configurados pelo usuário (implementar conforme necessário)
        // await executeUserWebhooks(pixData.tenant_id, pixData);
        
        // Atualizar métricas e analytics (implementar conforme necessário)
        // await updateAnalytics(pixData.tenant_id, pixData);
      } catch (error) {
        console.error('Erro ao processar notificações adicionais:', error);
      }
      // - Enviar email de confirmação
      
    } catch (dbError: any) {
      // Se a cobrança não for encontrada, pode ser de outro sistema
      if (dbError.message.includes('não encontrada')) {
        console.warn('⚠️ [WEBHOOK] Cobrança não encontrada no sistema:', pixData.txid);
      } else {
        console.error('❌ [WEBHOOK] Erro ao atualizar cobrança no banco:', dbError);
        throw dbError;
      }
    }
    
    // Log da estrutura de dados processada
    const pixInfo = {
      endToEndId: pixData.endToEndId, // ID único da transação
      txid: pixData.txid, // ID da cobrança
      valor: parseFloat(pixData.valor), // Valor em reais
      chave: pixData.chave, // Chave PIX utilizada
      horario: new Date(pixData.horario), // Data/hora do pagamento
      infoPagador: pixData.infoPagador, // Informações do pagador (opcional)
      devolucoes: pixData.devolucoes || [] // Devoluções (se houver)
    };
    
    console.log('✅ [WEBHOOK] PIX processado com sucesso:', pixInfo.endToEndId);
    
  } catch (error: any) {
    console.error('❌ [WEBHOOK] Erro ao processar PIX:', error);
    throw error;
  }
}

/**
 * Validar assinatura HMAC (se configurado)
 */
function validateWebhookSignature(body: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('❌ [WEBHOOK] Erro na validação de assinatura:', error);
    return false;
  }
}

/**
 * Endpoint GET para health check do webhook
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'webhook-efipay',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
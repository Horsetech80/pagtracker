import { consumeMessages } from '@/lib/queue/rabbitmq';
import { getTransacaoById, saveTransacao } from '@/lib/db/localStorage/splitStorage';
import { getDestinatarioById } from '@/lib/db/localStorage/splitStorage';
import { SplitTransacao, SplitDestinatario } from '@/lib/api/split/types';

/**
 * Worker para processar transações de split de pagamentos
 */
async function startSplitWorker() {
  console.log('Iniciando worker de processamento de split...');
  
  await consumeMessages('split', async (message) => {
    console.log('Processando mensagem:', message);
    
    const { transacao_id, user_id, action } = message;
    
    if (action !== 'process_split') {
      console.log(`Ação ${action} não suportada`);
      return;
    }
    
    // Buscar transação
    const transacao = getTransacaoById(transacao_id);
    if (!transacao) {
      console.error(`Transação ${transacao_id} não encontrada`);
      return;
    }
    
    // Verificar se a transação já foi processada
    const divisoesPendentes = transacao.divisoes.filter(d => d.status === 'pendente');
    if (divisoesPendentes.length === 0) {
      console.log(`Transação ${transacao_id} já foi processada completamente`);
      return;
    }
    
    // Atualizar status para 'processando'
    const transacaoAtualizada: SplitTransacao = {
      ...transacao,
      divisoes: transacao.divisoes.map(divisao => {
        if (divisao.status === 'pendente') {
          return { ...divisao, status: 'processando' };
        }
        return divisao;
      })
    };
    
    // Salvar status atualizado
    saveTransacao(transacaoAtualizada, user_id);
    
    // Processar cada divisão pendente
    for (const divisao of divisoesPendentes) {
      try {
        console.log(`Processando divisão ${divisao.id} para destinatário ${divisao.destinatario_id}`);
        
        // Se for o usuário principal, apenas marca como concluído
        if (divisao.destinatario_id === 'principal') {
          divisao.status = 'concluido';
          divisao.processado_em = new Date().toISOString();
          continue;
        }
        
        // Buscar informações do destinatário
        const destinatario = getDestinatarioById(divisao.destinatario_id);
        if (!destinatario) {
          divisao.status = 'falha';
          divisao.erro = 'Destinatário não encontrado';
          continue;
        }
        
        // Simular o envio do pagamento
        await processarPagamento(destinatario, divisao.valor);
        
        // Atualizar status da divisão
        divisao.status = 'concluido';
        divisao.processado_em = new Date().toISOString();
        
      } catch (error: any) {
        console.error(`Erro ao processar divisão ${divisao.id}:`, error);
        divisao.status = 'falha';
        divisao.erro = error.message || 'Erro desconhecido';
      }
    }
    
    // Salvar resultado do processamento
    saveTransacao({
      ...transacaoAtualizada,
      divisoes: transacaoAtualizada.divisoes.map((d, i) => {
        if (divisoesPendentes.some(dp => dp.id === d.id)) {
          return divisoesPendentes.find(dp => dp.id === d.id)!;
        }
        return d;
      }),
      updated_at: new Date().toISOString()
    }, user_id);
    
    console.log(`Processamento da transação ${transacao_id} concluído`);
  });
  
  console.log('Worker de processamento de split iniciado com sucesso');
}

/**
 * Função que simula o envio de um pagamento para o destinatário
 */
async function processarPagamento(destinatario: SplitDestinatario, valor: number): Promise<void> {
  // Simular tempo de processamento
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Simular falha aleatória (10% de chance)
  if (Math.random() < 0.1) {
    throw new Error('Falha simulada no processamento do pagamento');
  }
  
  // Registro simulado de pagamento
  console.log(`Pagamento de R$ ${(valor / 100).toFixed(2)} enviado para ${destinatario.nome}`);
  
  if (destinatario.metodo_pagamento === 'pix') {
    console.log(`Pix enviado para chave ${destinatario.chave_pix}`);
  } else {
    console.log(`Transferência bancária enviada para ${destinatario.banco}, agência ${destinatario.agencia}, conta ${destinatario.conta}`);
  }
  
  return;
}

// Iniciar o worker se este arquivo for executado diretamente
if (require.main === module) {
  startSplitWorker().catch(error => {
    console.error('Erro ao iniciar worker:', error);
    process.exit(1);
  });
}

export default startSplitWorker; 
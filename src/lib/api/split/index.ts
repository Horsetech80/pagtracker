import {
  SplitDestinatario,
  SplitRegra,
  SplitTransacao,
  SplitTransacaoDivisao,
  SplitDivisao,
  SplitResponse,
  CreateSplitRequest
} from './types';
import {
  getDestinatarios,
  getDestinatarioById,
  saveDestinatario,
  deleteDestinatario,
  getRegras,
  getRegraById,
  saveRegra,
  deleteRegra,
  getTransacoes,
  getTransacaoById,
  saveTransacao,
  deleteTransacao,
  initializeSplitDataIfEmpty
} from '@/lib/db/localStorage/splitStorage';
import { v4 as uuidv4 } from 'uuid';
import { publishMessage } from '@/lib/queue/rabbitmq';

// Inicializar dados de exemplo se necessário
export const initializeSplitData = (userId: string): void => {
  initializeSplitDataIfEmpty(userId);
};

// API de Destinatários
export const listDestinatarios = async (userId: string): Promise<SplitResponse> => {
  try {
    const destinatarios = getDestinatarios(userId);
    return {
      success: true,
      data: destinatarios
    };
  } catch (error: any) {
    console.error('Erro ao listar destinatários:', error);
    return {
      success: false,
      error: error.message || 'Erro ao listar destinatários'
    };
  }
};

export const getDestinatario = async (id: string): Promise<SplitResponse> => {
  try {
    const destinatario = getDestinatarioById(id);
    
    if (!destinatario) {
      return {
        success: false,
        error: 'Destinatário não encontrado'
      };
    }
    
    return {
      success: true,
      data: destinatario
    };
  } catch (error: any) {
    console.error('Erro ao buscar destinatário:', error);
    return {
      success: false,
      error: error.message || 'Erro ao buscar destinatário'
    };
  }
};

export const createDestinatario = async (data: Partial<SplitDestinatario>, userId: string): Promise<SplitResponse> => {
  try {
    // Validar dados básicos
    if (!data.nome || !data.documento) {
      return {
        success: false,
        error: 'Nome e documento são obrigatórios'
      };
    }
    
    // Validar dados do PIX
    if (!data.dados_bancarios?.chave_pix || !data.dados_bancarios?.tipo_chave_pix) {
      return {
        success: false,
        error: 'Chave PIX e tipo de chave são obrigatórios'
      };
    }
    
    // Forçar tipo como PIX
    data.dados_bancarios.tipo = 'pix';
    
    const destinatario = saveDestinatario(data, userId);
    
    return {
      success: true,
      data: destinatario,
      message: 'Destinatário criado com sucesso'
    };
  } catch (error: any) {
    console.error('Erro ao criar destinatário:', error);
    return {
      success: false,
      error: error.message || 'Erro ao criar destinatário'
    };
  }
};

export const updateDestinatario = async (id: string, data: Partial<SplitDestinatario>, userId: string): Promise<SplitResponse> => {
  try {
    const destinatario = getDestinatarioById(id);
    
    if (!destinatario) {
      return {
        success: false,
        error: 'Destinatário não encontrado'
      };
    }
    
    // Verificar permissão
    if (destinatario.user_id !== userId) {
      return {
        success: false,
        error: 'Permissão negada'
      };
    }
    
    const updated = saveDestinatario({ ...data, id }, userId);
    
    return {
      success: true,
      data: updated,
      message: 'Destinatário atualizado com sucesso'
    };
  } catch (error: any) {
    console.error('Erro ao atualizar destinatário:', error);
    return {
      success: false,
      error: error.message || 'Erro ao atualizar destinatário'
    };
  }
};

export const removeDestinatario = async (id: string, userId: string): Promise<SplitResponse> => {
  try {
    const destinatario = getDestinatarioById(id);
    
    if (!destinatario) {
      return {
        success: false,
        error: 'Destinatário não encontrado'
      };
    }
    
    // Verificar permissão
    if (destinatario.user_id !== userId) {
      return {
        success: false,
        error: 'Permissão negada'
      };
    }
    
    // Verificar se está sendo usado em alguma regra
    const regras = getRegras(userId);
    const emUso = regras.some(regra => 
      regra.divisoes.some(divisao => divisao.destinatario_id === id)
    );
    
    if (emUso) {
      return {
        success: false,
        error: 'Não é possível remover um destinatário que está sendo usado em regras de split'
      };
    }
    
    const result = deleteDestinatario(id);
    
    return {
      success: result,
      message: result ? 'Destinatário removido com sucesso' : 'Não foi possível remover o destinatário'
    };
  } catch (error: any) {
    console.error('Erro ao remover destinatário:', error);
    return {
      success: false,
      error: error.message || 'Erro ao remover destinatário'
    };
  }
};

// API de Regras
export const listRegras = async (userId: string): Promise<SplitResponse> => {
  try {
    const regras = getRegras(userId);
    return {
      success: true,
      data: regras
    };
  } catch (error: any) {
    console.error('Erro ao listar regras:', error);
    return {
      success: false,
      error: error.message || 'Erro ao listar regras'
    };
  }
};

export const getRegra = async (id: string): Promise<SplitResponse> => {
  try {
    const regra = getRegraById(id);
    
    if (!regra) {
      return {
        success: false,
        error: 'Regra não encontrada'
      };
    }
    
    return {
      success: true,
      data: regra
    };
  } catch (error: any) {
    console.error('Erro ao buscar regra:', error);
    return {
      success: false,
      error: error.message || 'Erro ao buscar regra'
    };
  }
};

// Validar se uma regra tem divisões válidas
const validarRegra = (regra: Partial<SplitRegra>, userId: string): string | null => {
  // Verificar taxa de comissão
  if (regra.taxa_comissao === undefined || regra.taxa_comissao < 0 || regra.taxa_comissao > 100) {
    return 'Taxa de comissão deve estar entre 0 e 100%';
  }
  
  // Se não tem divisões, não precisa validar mais
  if (!regra.divisoes || regra.divisoes.length === 0) {
    return null;
  }
  
  // Verificar se todos os destinatários existem
  const destinatarios = getDestinatarios(userId);
  const destinatariosIds = new Set(destinatarios.map(d => d.id));
  
  for (const divisao of regra.divisoes) {
    if (!destinatariosIds.has(divisao.destinatario_id)) {
      return `Destinatário com ID ${divisao.destinatario_id} não encontrado`;
    }
    
    if (divisao.tipo === 'percentual' && (divisao.valor < 0 || divisao.valor > 100)) {
      return 'Valores percentuais devem estar entre 0 e 100%';
    }
    
    if (divisao.tipo === 'fixo' && divisao.valor <= 0) {
      return 'Valores fixos devem ser maiores que zero';
    }
  }
  
  // Verificar se a soma das divisões percentuais não ultrapassa 100%
  const divisoesPercentuais = regra.divisoes.filter(d => d.tipo === 'percentual');
  const somaPercentuais = divisoesPercentuais.reduce((sum, d) => sum + d.valor, 0);
  
  if (somaPercentuais + regra.taxa_comissao! > 100) {
    return `A soma das porcentagens (${somaPercentuais + regra.taxa_comissao!}%) não pode ultrapassar 100%`;
  }
  
  return null;
};

export const createRegra = async (data: Partial<SplitRegra>, userId: string): Promise<SplitResponse> => {
  try {
    // Validar dados básicos
    if (!data.nome) {
      return {
        success: false,
        error: 'Nome da regra é obrigatório'
      };
    }
    
    // Validar divisões
    const erro = validarRegra(data, userId);
    if (erro) {
      return {
        success: false,
        error: erro
      };
    }
    
    const regra = saveRegra(data, userId);
    
    return {
      success: true,
      data: regra,
      message: 'Regra criada com sucesso'
    };
  } catch (error: any) {
    console.error('Erro ao criar regra:', error);
    return {
      success: false,
      error: error.message || 'Erro ao criar regra'
    };
  }
};

export const updateRegra = async (id: string, data: Partial<SplitRegra>, userId: string): Promise<SplitResponse> => {
  try {
    const regra = getRegraById(id);
    
    if (!regra) {
      return {
        success: false,
        error: 'Regra não encontrada'
      };
    }
    
    // Verificar permissão
    if (regra.user_id !== userId) {
      return {
        success: false,
        error: 'Permissão negada'
      };
    }
    
    // Validar divisões
    const erro = validarRegra({ ...regra, ...data }, userId);
    if (erro) {
      return {
        success: false,
        error: erro
      };
    }
    
    const updated = saveRegra({ ...data, id }, userId);
    
    return {
      success: true,
      data: updated,
      message: 'Regra atualizada com sucesso'
    };
  } catch (error: any) {
    console.error('Erro ao atualizar regra:', error);
    return {
      success: false,
      error: error.message || 'Erro ao atualizar regra'
    };
  }
};

export const removeRegra = async (id: string, userId: string): Promise<SplitResponse> => {
  try {
    const regra = getRegraById(id);
    
    if (!regra) {
      return {
        success: false,
        error: 'Regra não encontrada'
      };
    }
    
    // Verificar permissão
    if (regra.user_id !== userId) {
      return {
        success: false,
        error: 'Permissão negada'
      };
    }
    
    const result = deleteRegra(id);
    
    return {
      success: result,
      message: result ? 'Regra removida com sucesso' : 'Não foi possível remover a regra'
    };
  } catch (error: any) {
    console.error('Erro ao remover regra:', error);
    return {
      success: false,
      error: error.message || 'Erro ao remover regra'
    };
  }
};

// Função para criar uma transação de split para uma cobrança
export const createSplitTransacao = async (data: CreateSplitRequest, userId: string): Promise<SplitResponse> => {
  try {
    // Verificar se a regra existe
    const regra = getRegraById(data.regra_id);
    if (!regra) {
      return {
        success: false,
        error: 'Regra de split não encontrada'
      };
    }
    
    // Em um sistema real, buscaríamos a cobrança no banco de dados
    // Por hora, vamos apenas simular
    // Aqui seria feita a chamada ao serviço de cobranças
    const valorCobranca = 1000; // Valor mockado em centavos (R$ 10,00)
    
    // Calcular divisões
    const divisoes: SplitTransacaoDivisao[] = [];
    const comissao = regra.taxa_comissao || 0;
    
    // Usar as divisões customizadas ou as da regra
    const divisoesBase = data.divisoes_customizadas || regra.divisoes;
    
    // Adicionar a comissão do usuário principal se houver
    if (comissao > 0) {
      divisoes.push({
        id: uuidv4(),
        destinatario_id: 'principal', // Representa o usuário principal
        valor: Math.round(valorCobranca * (comissao / 100)),
        porcentagem: comissao,
        status: 'pendente',
        descricao: 'Comissão do vendedor'
      });
    }
    
    // Adicionar as divisões para parceiros
    for (const divisao of divisoesBase) {
      let valorDivisao = 0;
      let porcentagem = 0;
      
      // Calcular valor com base no tipo
      if (divisao.tipo === 'percentual') {
        porcentagem = divisao.valor;
        valorDivisao = Math.round(valorCobranca * (divisao.valor / 100));
      } else {
        valorDivisao = divisao.valor;
        porcentagem = (divisao.valor / valorCobranca) * 100;
      }
      
      divisoes.push({
        id: uuidv4(),
        destinatario_id: divisao.destinatario_id,
        valor: valorDivisao,
        porcentagem,
        status: 'pendente',
        descricao: 'Split de pagamento'
      });
    }
    
    // Criar transação
    const transacao: SplitTransacao = {
      id: uuidv4(),
      venda_id: data.venda_id,
      valor_total: valorCobranca,
      status: 'pendente',
      divisoes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Salvar transação
    const result = saveTransacao(transacao, userId);
    
    // Enviar transação para a fila de processamento
    try {
      await publishMessage('split', {
        transacao_id: result.id,
        user_id: userId,
        action: 'process_split'
      });
      
      console.log(`Transação ${result.id} enviada para processamento na fila`);
    } catch (queueError) {
      console.error('Erro ao enviar transação para fila:', queueError);
      // Não falhar a operação, apenas logar o erro
      // Na fase 2, podemos implementar mais robustez aqui
    }
    
    return {
      success: true,
      data: result,
      message: 'Split criado com sucesso e enviado para processamento'
    };
  } catch (error: any) {
    console.error('Erro ao criar split:', error);
    return {
      success: false,
      error: error.message || 'Erro ao criar split'
    };
  }
}; 
import { 
  SplitDestinatario, 
  SplitRegra, 
  SplitTransacao 
} from "@/lib/api/split/types";
import { v4 as uuidv4 } from 'uuid';

// Chaves para localStorage
const DESTINATARIOS_KEY = 'pagtracker_split_destinatarios';
const REGRAS_KEY = 'pagtracker_split_regras';
const TRANSACOES_KEY = 'pagtracker_split_transacoes';

// Funções auxiliares para localStorage
const getItem = <T>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Erro ao recuperar ${key} do localStorage:`, error);
    return [];
  }
};

const setItem = <T>(key: string, data: T[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Erro ao salvar ${key} no localStorage:`, error);
  }
};

// Destinatários (Parceiros)
export const getDestinatarios = (userId?: string): SplitDestinatario[] => {
  const destinatarios = getItem<SplitDestinatario>(DESTINATARIOS_KEY);
  return userId ? destinatarios.filter(d => d.user_id === userId) : destinatarios;
};

export const getDestinatarioById = (id: string): SplitDestinatario | undefined => {
  const destinatarios = getItem<SplitDestinatario>(DESTINATARIOS_KEY);
  return destinatarios.find(d => d.id === id);
};

export const saveDestinatario = (destinatario: Partial<SplitDestinatario>, userId: string): SplitDestinatario => {
  const destinatarios = getItem<SplitDestinatario>(DESTINATARIOS_KEY);
  const now = new Date().toISOString();
  
  // Se tem ID, atualiza um existente
  if (destinatario.id) {
    const index = destinatarios.findIndex(d => d.id === destinatario.id);
    
    if (index >= 0) {
      const updated = { 
        ...destinatarios[index], 
        ...destinatario, 
        updated_at: now 
      };
      destinatarios[index] = updated;
      setItem(DESTINATARIOS_KEY, destinatarios);
      return updated;
    }
  }
  
  // Caso contrário, cria um novo
  const newDestinatario: SplitDestinatario = {
    id: uuidv4(),
    user_id: userId,
    nome: '',
    email: '',
    tipo: 'pessoa_fisica',
    tipo_pessoa: 'pf',
    documento: '',
    status: 'ativo',
    metodo_pagamento: 'pix',
    created_at: now,
    ...destinatario
  };
  
  destinatarios.push(newDestinatario);
  setItem(DESTINATARIOS_KEY, destinatarios);
  return newDestinatario;
};

export const deleteDestinatario = (id: string): boolean => {
  const destinatarios = getItem<SplitDestinatario>(DESTINATARIOS_KEY);
  const newList = destinatarios.filter(d => d.id !== id);
  
  if (newList.length !== destinatarios.length) {
    setItem(DESTINATARIOS_KEY, newList);
    return true;
  }
  
  return false;
};

// Regras de Split
export const getRegras = (userId?: string): SplitRegra[] => {
  const regras = getItem<SplitRegra>(REGRAS_KEY);
  return userId ? regras.filter(r => r.user_id === userId) : regras;
};

export const getRegraById = (id: string): SplitRegra | undefined => {
  const regras = getItem<SplitRegra>(REGRAS_KEY);
  return regras.find(r => r.id === id);
};

export const saveRegra = (regra: Partial<SplitRegra>, userId: string): SplitRegra => {
  const regras = getItem<SplitRegra>(REGRAS_KEY);
  const now = new Date().toISOString();
  
  // Se tem ID, atualiza uma existente
  if (regra.id) {
    const index = regras.findIndex(r => r.id === regra.id);
    
    if (index >= 0) {
      const updated = { 
        ...regras[index], 
        ...regra, 
        updated_at: now 
      };
      regras[index] = updated;
      setItem(REGRAS_KEY, regras);
      return updated;
    }
  }
  
  // Caso contrário, cria uma nova
  const newRegra: SplitRegra = {
    id: uuidv4(),
    user_id: userId,
    nome: 'Nova Regra',
    ativa: true,
    taxa_comissao: 10, // 10% de comissão padrão
    divisoes: [],
    created_at: now,
    ...regra
  };
  
  regras.push(newRegra);
  setItem(REGRAS_KEY, regras);
  return newRegra;
};

export const deleteRegra = (id: string): boolean => {
  const regras = getItem<SplitRegra>(REGRAS_KEY);
  const newList = regras.filter(r => r.id !== id);
  
  if (newList.length !== regras.length) {
    setItem(REGRAS_KEY, newList);
    return true;
  }
  
  return false;
};

// Transações
export const getTransacoes = (userId?: string): SplitTransacao[] => {
  const transacoes = getItem<SplitTransacao>(TRANSACOES_KEY);
  return userId ? transacoes.filter(t => t.user_id === userId) : transacoes;
};

export const getTransacaoById = (id: string): SplitTransacao | undefined => {
  const transacoes = getItem<SplitTransacao>(TRANSACOES_KEY);
  return transacoes.find(t => t.id === id);
};

export const getTransacoesByChargeId = (chargeId: string): SplitTransacao[] => {
  const transacoes = getItem<SplitTransacao>(TRANSACOES_KEY);
  return transacoes.filter(t => t.charge_id === chargeId);
};

export const saveTransacao = (transacao: Partial<SplitTransacao>, userId: string): SplitTransacao => {
  const transacoes = getItem<SplitTransacao>(TRANSACOES_KEY);
  const now = new Date().toISOString();
  
  // Se tem ID, atualiza uma existente
  if (transacao.id) {
    const index = transacoes.findIndex(t => t.id === transacao.id);
    
    if (index >= 0) {
      const updated = { 
        ...transacoes[index], 
        ...transacao, 
        updated_at: now 
      };
      transacoes[index] = updated;
      setItem(TRANSACOES_KEY, transacoes);
      return updated;
    }
  }
  
  // Caso contrário, cria uma nova
  const newTransacao: SplitTransacao = {
    id: uuidv4(),
    user_id: userId,
    charge_id: '',
    regra_id: '',
    valor_total: 0,
    status: 'pendente',
    divisoes: [],
    created_at: now,
    ...transacao
  };
  
  transacoes.push(newTransacao);
  setItem(TRANSACOES_KEY, transacoes);
  return newTransacao;
};

export const deleteTransacao = (id: string): boolean => {
  const transacoes = getItem<SplitTransacao>(TRANSACOES_KEY);
  const newList = transacoes.filter(t => t.id !== id);
  
  if (newList.length !== transacoes.length) {
    setItem(TRANSACOES_KEY, newList);
    return true;
  }
  
  return false;
};

// Inicializar com dados de exemplo se estiver vazio
export const initializeSplitDataIfEmpty = (userId: string): void => {
  if (typeof window === 'undefined') return;
  
  const destinatarios = getDestinatarios(userId);
  const regras = getRegras(userId);
  
  if (destinatarios.length === 0 && regras.length === 0) {
    // Adicionar destinatários de exemplo
    const destinatario1 = saveDestinatario({
      nome: 'Parceiro 1',
      email: 'efipay@sejaefi.com.br',
      tipo: 'pessoa_juridica',
      documento: '12.345.678/0001-90',
      metodo_pagamento: 'conta_bancaria',
      banco: '341',
      agencia: '1234',
      conta: '56789-0',
      conta_tipo: 'corrente'
    }, userId);
    
    const destinatario2 = saveDestinatario({
      nome: 'Parceiro 2',
      email: 'efipay@sejaefi.com.br',
      tipo: 'pessoa_fisica',
      documento: '123.456.789-00',
      metodo_pagamento: 'pix',
      chave_pix: 'efipay@sejaefi.com.br'
    }, userId);
    
    // Adicionar regras de exemplo
    saveRegra({
      nome: 'Regra padrão',
      descricao: 'Divisão padrão de pagamentos',
      taxa_comissao: 10,
      divisoes: [
        {
          id: uuidv4(),
          destinatario_id: destinatario1.id,
          tipo: 'percentual',
          valor: 90
        }
      ]
    }, userId);
    
    saveRegra({
      nome: 'Regra para Afiliados',
      descricao: 'Divisão para programa de afiliados',
      taxa_comissao: 85,
      divisoes: [
        {
          destinatario_id: destinatario2.id,
          tipo: 'percentual',
          valor: 15
        }
      ]
    }, userId);
  }
};
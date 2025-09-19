/**
 * Formatadores de valores para exibição na interface
 */

/**
 * Formata um valor numérico para exibição como moeda (R$)
 * @param valor Valor a ser formatado
 * @returns Valor formatado como moeda brasileira
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Formata uma data para exibição no formato brasileiro (dd/mm/yyyy)
 * @param data Data a ser formatada
 * @returns Data formatada no padrão brasileiro
 */
export function formatarData(data: Date | string): string {
  const dataObj = typeof data === 'string' ? new Date(data) : data;
  return dataObj.toLocaleDateString('pt-BR');
}

/**
 * Formata uma data para exibição incluindo hora (dd/mm/yyyy HH:MM)
 * @param data Data a ser formatada
 * @returns Data e hora formatadas
 */
export function formatarDataHora(data: Date | string): string {
  const dataObj = typeof data === 'string' ? new Date(data) : data;
  return dataObj.toLocaleDateString('pt-BR') + ' ' + 
    dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formata um número de CPF/CNPJ 
 * @param valor CPF ou CNPJ sem formatação
 * @returns CPF ou CNPJ formatado
 */
export function formatarDocumento(valor: string): string {
  // Remove caracteres não numéricos
  const apenasNumeros = valor.replace(/\D/g, '');
  
  // Formata como CPF
  if (apenasNumeros.length <= 11) {
    return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  // Formata como CNPJ
  return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// Versões em inglês para compatibilidade com código existente

/**
 * Formata um valor em centavos para exibição como moeda brasileira
 * @param value Valor em centavos
 * @returns String formatada (ex: R$ 10,50)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value / 100);
}

/**
 * Formata uma data ISO para exibição como data no formato brasileiro
 * @param dateString String de data ISO
 * @returns String formatada (ex: 01/01/2023)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

/**
 * Formata uma data ISO para exibição como data e hora local no formato brasileiro
 * @param date String de data ISO
 * @returns String formatada (ex: 01/01/2023 10:30)
 */
export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Formata um documento (CPF/CNPJ) com máscara
 * @param doc Número do documento sem formatação
 * @returns String formatada
 */
export function formatDocument(doc: string): string {
  // Remove caracteres não numéricos
  const numbers = doc.replace(/\D/g, '');
  
  if (numbers.length === 11) {
    // CPF: 123.456.789-01
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (numbers.length === 14) {
    // CNPJ: 12.345.678/0001-90
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  // Retorna o próprio valor se não for CPF ou CNPJ
  return doc;
}
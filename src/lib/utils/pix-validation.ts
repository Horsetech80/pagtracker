/**
 * Utilitários para validação e formatação de chaves PIX
 */

// Tipos de chave PIX
export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

/**
 * Remove caracteres não numéricos de uma string
 */
export function removeNonNumeric(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Aplica máscara de CPF (000.000.000-00)
 */
export function formatCPF(value: string): string {
  const numbers = removeNonNumeric(value);
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
}

/**
 * Aplica máscara de CNPJ (00.000.000/0000-00)
 */
export function formatCNPJ(value: string): string {
  const numbers = removeNonNumeric(value);
  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
}

/**
 * Aplica máscara de telefone (00) 00000-0000
 */
export function formatPhone(value: string): string {
  const numbers = removeNonNumeric(value);
  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
}

/**
 * Valida CPF
 */
export function isValidCPF(cpf: string): boolean {
  const numbers = removeNonNumeric(cpf);
  
  if (numbers.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numbers)) return false; // Todos os dígitos iguais
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.charAt(10))) return false;
  
  return true;
}

/**
 * Valida CNPJ
 */
export function isValidCNPJ(cnpj: string): boolean {
  const numbers = removeNonNumeric(cnpj);
  
  if (numbers.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(numbers)) return false; // Todos os dígitos iguais
  
  // Validação dos dígitos verificadores
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(numbers.charAt(12))) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(numbers.charAt(13))) return false;
  
  return true;
}

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida telefone
 */
export function isValidPhone(phone: string): boolean {
  const numbers = removeNonNumeric(phone);
  return numbers.length === 11 && /^[1-9]\d{10}$/.test(numbers);
}

/**
 * Valida chave aleatória (UUID)
 */
export function isValidRandomKey(key: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(key);
}

/**
 * Aplica formatação baseada no tipo de chave PIX
 */
export function formatPixKey(value: string, type: PixKeyType): string {
  switch (type) {
    case 'cpf':
      return formatCPF(value);
    case 'cnpj':
      return formatCNPJ(value);
    case 'phone':
      return formatPhone(value);
    case 'email':
    case 'random':
    default:
      return value;
  }
}

/**
 * Valida chave PIX baseada no tipo
 */
export function validatePixKey(value: string, type: PixKeyType): { isValid: boolean; message?: string } {
  if (!value.trim()) {
    return { isValid: false, message: 'Chave PIX é obrigatória' };
  }
  
  switch (type) {
    case 'cpf':
      if (!isValidCPF(value)) {
        return { isValid: false, message: 'CPF inválido' };
      }
      break;
    case 'cnpj':
      if (!isValidCNPJ(value)) {
        return { isValid: false, message: 'CNPJ inválido' };
      }
      break;
    case 'email':
      if (!isValidEmail(value)) {
        return { isValid: false, message: 'E-mail inválido' };
      }
      break;
    case 'phone':
      if (!isValidPhone(value)) {
        return { isValid: false, message: 'Telefone inválido' };
      }
      break;
    case 'random':
      if (!isValidRandomKey(value)) {
        return { isValid: false, message: 'Chave aleatória inválida' };
      }
      break;
    default:
      return { isValid: false, message: 'Tipo de chave inválido' };
  }
  
  return { isValid: true };
}

/**
 * Obtém placeholder baseado no tipo de chave PIX
 */
export function getPixKeyPlaceholder(type: PixKeyType): string {
  switch (type) {
    case 'cpf':
      return '000.000.000-00';
    case 'cnpj':
      return '00.000.000/0000-00';
    case 'email':
      return 'efipay@sejaefi.com.br';
    case 'phone':
      return '(11) 99999-9999';
    case 'random':
      return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
    default:
      return 'Digite a chave PIX';
  }
}

/**
 * Obtém o comprimento máximo baseado no tipo de chave PIX
 */
export function getPixKeyMaxLength(type: PixKeyType): number {
  switch (type) {
    case 'cpf':
      return 14; // 000.000.000-00
    case 'cnpj':
      return 18; // 00.000.000/0000-00
    case 'phone':
      return 15; // (11) 99999-9999
    case 'email':
      return 254; // RFC 5321
    case 'random':
      return 36; // UUID
    default:
      return 255;
  }
}
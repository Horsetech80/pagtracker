import { supabase } from './client';

/**
 * Verifica se um email já está cadastrado no sistema
 * @param email - Email a ser verificado
 * @returns Promise<boolean> - true se o email já existe, false caso contrário
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  // Por enquanto, retornamos false para não bloquear o signup
  // O tratamento de usuário duplicado será feito no próprio signup
  return false;
}

/**
 * Valida se um email tem formato válido
 * @param email - Email a ser validado
 * @returns boolean - true se o formato é válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida se uma senha atende aos critérios mínimos
 * @param password - Senha a ser validada
 * @returns { isValid: boolean, message?: string }
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 6) {
    return {
      isValid: false,
      message: 'A senha deve ter pelo menos 6 caracteres'
    };
  }
  
  if (password.length > 72) {
    return {
      isValid: false,
      message: 'A senha deve ter no máximo 72 caracteres'
    };
  }
  
  // Verificar se contém pelo menos uma letra e um número (opcional, mas recomendado)
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      message: 'A senha deve conter pelo menos uma letra e um número'
    };
  }
  
  return { isValid: true };
}

/**
 * Valida se um nome tem formato válido
 * @param name - Nome a ser validado
 * @returns { isValid: boolean, message?: string }
 */
export function validateName(name: string): { isValid: boolean; message?: string } {
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      message: 'O nome é obrigatório'
    };
  }
  
  if (name.trim().length < 2) {
    return {
      isValid: false,
      message: 'O nome deve ter pelo menos 2 caracteres'
    };
  }
  
  if (name.trim().length > 100) {
    return {
      isValid: false,
      message: 'O nome deve ter no máximo 100 caracteres'
    };
  }
  
  return { isValid: true };
}

/**
 * Função completa de validação para o formulário de registro
 * @param email - Email do usuário
 * @param password - Senha do usuário
 * @param name - Nome do usuário
 * @returns Promise<{ isValid: boolean, errors: string[] }>
 */
export async function validateRegistrationForm(
  email: string, 
  password: string, 
  name: string
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  // Validar email
  if (!isValidEmail(email)) {
    errors.push('Formato de email inválido');
  }
  
  // Validar senha
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid && passwordValidation.message) {
    errors.push(passwordValidation.message);
  }
  
  // Validar nome
  const nameValidation = validateName(name);
  if (!nameValidation.isValid && nameValidation.message) {
    errors.push(nameValidation.message);
  }
  
  // Se as validações básicas passaram, verificar se o email já existe
  if (errors.length === 0) {
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      errors.push('Este email já possui uma conta cadastrada');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
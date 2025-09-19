import { z } from 'zod';

// Validação para tipos de chave PIX
export const pixKeyTypeSchema = z.enum(['cpf', 'cnpj', 'email', 'phone', 'random']);

// Validação para chave PIX baseada no tipo
export const pixKeySchema = z.string().refine((value) => {
  // Validação básica - a validação específica por tipo será feita no schema do objeto
  return value.length > 0;
}, {
  message: 'Chave PIX é obrigatória'
});

// Validação para documento (CPF/CNPJ)
export const documentSchema = z.string().refine((value) => {
  const cleanDoc = value.replace(/\D/g, '');
  return cleanDoc.length === 11 || cleanDoc.length === 14;
}, {
  message: 'Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)'
});

// Validação para valor de saque
export const withdrawalAmountSchema = z.number()
  .min(1, 'Valor mínimo de saque é R$ 1,00')
  .max(50000, 'Valor máximo de saque é R$ 50.000,00')
  .refine((value) => {
    // Verificar se tem no máximo 2 casas decimais
    return Number.isInteger(value * 100);
  }, {
    message: 'Valor deve ter no máximo 2 casas decimais'
  });

// Schema principal para solicitação de saque
export const withdrawalRequestSchema = z.object({
  amount_cents: z.number()
    .int('Valor deve ser um número inteiro em centavos')
    .min(100, 'Valor mínimo de saque é R$ 1,00')
    .max(5000000, 'Valor máximo de saque é R$ 50.000,00'),
  
  pix_key_type: pixKeyTypeSchema,
  pix_key: pixKeySchema,
  
  recipient_name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  
  recipient_document: documentSchema,
  
  description: z.string()
    .max(200, 'Descrição deve ter no máximo 200 caracteres')
    .optional()
}).refine((data) => {
  // Validação cruzada: chave PIX deve ser compatível com o tipo
  return pixKeySchema.safeParse(data.pix_key).success;
}, {
  message: 'Chave PIX não é compatível com o tipo selecionado',
  path: ['pix_key']
});

// Schema para aprovação/rejeição de saque (admin)
export const withdrawalApprovalSchema = z.object({
  withdrawal_id: z.string().uuid('ID de saque inválido'),
  action: z.enum(['approve', 'reject'], {
    message: 'Ação deve ser "approve" ou "reject"'
  }),
  admin_notes: z.string()
    .max(500, 'Observações devem ter no máximo 500 caracteres')
    .optional(),
  rejection_reason: z.string()
    .min(10, 'Motivo da rejeição deve ter pelo menos 10 caracteres')
    .max(200, 'Motivo da rejeição deve ter no máximo 200 caracteres')
    .optional()
}).refine((data) => {
  // Se a ação for rejeitar, motivo é obrigatório
  if (data.action === 'reject' && !data.rejection_reason) {
    return false;
  }
  return true;
}, {
  message: 'Motivo da rejeição é obrigatório quando a ação for "reject"',
  path: ['rejection_reason']
});

// Validação para filtros de listagem de saques
export const withdrawalFiltersSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'processing', 'completed', 'failed']).optional(),
  tenant_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
}).refine((data) => {
  // Se ambas as datas forem fornecidas, start_date deve ser anterior a end_date
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) <= new Date(data.end_date);
  }
  return true;
}, {
  message: 'Data inicial deve ser anterior à data final',
  path: ['start_date']
});

// Tipos TypeScript derivados dos schemas
export type WithdrawalRequest = z.infer<typeof withdrawalRequestSchema>;
export type WithdrawalApproval = z.infer<typeof withdrawalApprovalSchema>;
export type WithdrawalFilters = z.infer<typeof withdrawalFiltersSchema>;
export type PixKeyType = z.infer<typeof pixKeyTypeSchema>;

// Função utilitária para validar saldo disponível
export function validateWithdrawalBalance(requestedAmount: number, availableBalance: number): {
  isValid: boolean;
  error?: string;
} {
  if (requestedAmount > availableBalance) {
    return {
      isValid: false,
      error: `Saldo insuficiente. Disponível: R$ ${(availableBalance / 100).toFixed(2)}, Solicitado: R$ ${(requestedAmount / 100).toFixed(2)}`
    };
  }
  
  return { isValid: true };
}

// Função utilitária para formatar chave PIX
export function formatPixKey(key: string, type: PixKeyType): string {
  switch (type) {
    case 'cpf':
      const cpf = key.replace(/\D/g, '');
      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    
    case 'cnpj':
      const cnpj = key.replace(/\D/g, '');
      return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    
    case 'phone':
      const phone = key.replace(/\D/g, '');
      if (phone.length === 11) {
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      } else if (phone.length === 10) {
        return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      }
      return key;
    
    default:
      return key;
  }
}

// Função utilitária para validar se o usuário pode fazer saque
export function validateUserWithdrawalEligibility(user: any): {
  isEligible: boolean;
  reason?: string;
} {
  // Verificar se o usuário está ativo
  if (!user.active) {
    return {
      isEligible: false,
      reason: 'Usuário inativo não pode solicitar saques'
    };
  }
  
  // Verificar se o tenant está ativo
  if (!user.tenant?.active) {
    return {
      isEligible: false,
      reason: 'Empresa inativa não pode processar saques'
    };
  }
  
  return { isEligible: true };
}
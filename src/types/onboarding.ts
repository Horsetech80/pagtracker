// Tipos para o sistema de onboarding progressivo

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  order: number;
  icon?: string;
}

export interface UserOnboardingStatus {
  userId: string;
  tenantId: string;
  personalDataCompleted: boolean;
  companyDataCompleted: boolean;
  financialConfigCompleted: boolean;
  verificationCompleted: boolean;
  overallProgress: number;
  canAccessPayments: boolean;
  canAccessWithdrawals: boolean;
  lastUpdated: string;
}

export interface OnboardingStepData {
  // Dados Pessoais
  personalData?: {
    fullName: string;
    email: string;
    phone: string;
    cpf: string;
  };
  
  // Dados da Empresa
  companyData?: {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string;
    endereco: {
      cep: string;
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      estado: string;
    };
    telefoneComercial: string;
    segmentoAtuacao: string;
  };
  
  // Configurações Financeiras
  financialConfig?: {
    chavePix: string;
    bancoPreferencial: string;
    dadosSaque: {
      banco: string;
      agencia: string;
      conta: string;
      tipoConta: 'corrente' | 'poupanca';
    };
    termosAceitos: boolean;
  };
  
  // Verificação
  verification?: {
    emailConfirmed: boolean;
    documentsSubmitted: boolean;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    approvalDate?: string;
  };
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'personal-data',
    title: 'Dados Pessoais',
    description: 'Complete seus dados pessoais (CPF, telefone)',
    completed: false,
    required: true,
    order: 1,
    icon: 'User'
  },
  {
    id: 'company-data',
    title: 'Dados da Empresa',
    description: 'Cadastre sua empresa (CNPJ, endereço)',
    completed: false,
    required: true,
    order: 2,
    icon: 'Building2'
  },
  {
    id: 'financial-config',
    title: 'Configurações Financeiras',
    description: 'Configure PIX e dados bancários',
    completed: false,
    required: true,
    order: 3,
    icon: 'CreditCard'
  },
  {
    id: 'verification',
    title: 'Verificação',
    description: 'Confirme email e aguarde aprovação',
    completed: false,
    required: true,
    order: 4,
    icon: 'Shield'
  }
];
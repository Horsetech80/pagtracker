export interface Charge {
  id: string;
  user_id: string;
  valor: number;
  descricao: string;
  status: 'pendente' | 'pago' | 'expirado' | 'cancelado' | 'estornado';
  txid: string;
  qr_code: string;
  qr_code_image: string;
  link_pagamento: string;
  created_at: string;
  updated_at?: string;
  expires_at: string;
} 
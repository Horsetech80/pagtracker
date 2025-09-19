export interface PixPayment {
  id: string;
  checkout_id: string;
  status: PaymentStatus;
  amount: number; // em centavos
  pix_code: string;
  qr_code: string;
  qr_code_url: string;
  expiration_date: string;
  payer?: {
    name?: string;
    document?: string;
  };
  refund_id?: string;
  transaction_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Refund {
  id: string;
  payment_id: string;
  status: RefundStatus;
  amount: number; // em centavos
  reason?: string;
  transaction_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = 
  | 'pending'  // Aguardando pagamento
  | 'processing' // Processando
  | 'paid'     // Pago
  | 'failed'   // Falhou
  | 'cancelled' // Cancelado
  | 'refunded'; // Estornado

export type RefundStatus = 
  | 'pending'  // Aguardando processamento
  | 'processing' // Processando
  | 'completed' // Concluído
  | 'failed';   // Falhou 
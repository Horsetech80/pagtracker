/**
 * Tipos para o sistema PagTracker
 */

export type ChargeStatus = 
  | 'pendente'   // Aguardando pagamento
  | 'pago'       // Pagamento confirmado
  | 'expirado'   // Prazo de pagamento expirado
  | 'reembolsado'; // Pagamento reembolsado

export interface User {
  id: string;
  email: string;
  nome: string;
  api_key_gerencianet?: string;
  client_id_gerencianet?: string;
  client_secret_gerencianet?: string;
  created_at: string;
}

export interface Charge {
  id: string;
  user_id: string;
  valor: number;
  descricao?: string;
  status: ChargeStatus;
  txid: string;
  qr_code: string;
  qr_code_image: string;
  link_pagamento: string;
  created_at: string;
  updated_at?: string;
  expires_at?: string;
}

export interface CreateChargeParams {
  valor: number;
  descricao?: string;
  expiracao?: number; // Em segundos
}

export interface GerencianetConfig {
  apiKey: string;
  clientId: string;
  clientSecret: string;
  certificado?: File;
}

export interface QrCodeData {
  qrCode: string;
  imagemQrCode: string;
  txid: string;
  linkPagamento: string;
} 
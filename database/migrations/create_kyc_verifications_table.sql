-- Migração para criar tabela de verificações KYC
-- Arquivo: create_kyc_verifications_table.sql
-- Data: Janeiro 2025

CREATE TABLE IF NOT EXISTS kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Status da verificação
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Documentos enviados (JSON)
  documents JSONB NOT NULL DEFAULT '[]',
  
  -- Datas importantes
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Informações de revisão
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_user_id ON kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_tenant_id ON kyc_verifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status ON kyc_verifications(status);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_priority ON kyc_verifications(priority);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_submitted_at ON kyc_verifications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_reviewed_by ON kyc_verifications(reviewed_by);

-- Índice composto para consultas de admin
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status_priority ON kyc_verifications(status, priority);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status_submitted ON kyc_verifications(status, submitted_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_kyc_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kyc_verifications_updated_at
  BEFORE UPDATE ON kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_kyc_verifications_updated_at();

-- Política RLS (Row Level Security) se necessário
-- ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Comentários para documentação
COMMENT ON TABLE kyc_verifications IS 'Tabela para armazenar solicitações de verificação KYC (Know Your Customer)';
COMMENT ON COLUMN kyc_verifications.id IS 'Identificador único da verificação';
COMMENT ON COLUMN kyc_verifications.user_id IS 'ID do usuário que enviou a verificação';
COMMENT ON COLUMN kyc_verifications.tenant_id IS 'ID do tenant/empresa';
COMMENT ON COLUMN kyc_verifications.status IS 'Status da verificação: pending, approved, rejected, expired';
COMMENT ON COLUMN kyc_verifications.priority IS 'Prioridade da verificação: low, medium, high, urgent';
COMMENT ON COLUMN kyc_verifications.documents IS 'Array JSON com informações dos documentos enviados';
COMMENT ON COLUMN kyc_verifications.submitted_at IS 'Data e hora do envio da verificação';
COMMENT ON COLUMN kyc_verifications.reviewed_at IS 'Data e hora da revisão pelo admin';
COMMENT ON COLUMN kyc_verifications.expires_at IS 'Data de expiração da verificação (30 dias por padrão)';
COMMENT ON COLUMN kyc_verifications.reviewed_by IS 'ID do admin que revisou a verificação';
COMMENT ON COLUMN kyc_verifications.review_notes IS 'Notas/comentários do revisor';

-- Exemplo de estrutura do campo documents (JSONB):
/*
[
  {
    "id": "doc-1",
    "type": "rg",
    "url": "/uploads/kyc/tenant-123/rg-user-456.pdf",
    "status": "uploaded",
    "uploadedAt": "2024-01-15T10:30:00Z",
    "fileName": "rg-joao-silva.pdf",
    "fileSize": 1024000
  },
  {
    "id": "doc-2",
    "type": "comprovante_endereco",
    "url": "/uploads/kyc/tenant-123/comprovante-user-456.pdf",
    "status": "uploaded",
    "uploadedAt": "2024-01-15T10:35:00Z",
    "fileName": "comprovante-endereco.pdf",
    "fileSize": 512000
  }
]
*/
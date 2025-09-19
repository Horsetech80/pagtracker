-- Migração para configurar fluxo padrão de multi-tenancy
-- Arquivo: setup_standard_multitenancy.sql
-- Data: Janeiro 2025
-- Descrição: Configura RLS, triggers e funções para multi-tenancy padrão

-- =====================================================
-- 1. FUNÇÃO PARA OBTER TENANT_ID DO USUÁRIO ATUAL
-- =====================================================

CREATE OR REPLACE FUNCTION auth.get_user_tenant_id()
RETURNS text
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id::text 
  FROM public.users 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- =====================================================
-- 2. FUNÇÃO PARA DEFINIR TENANT_ID AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Definir tenant_id automaticamente baseado no usuário autenticado
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := auth.get_user_tenant_id();
  END IF;
  
  -- Garantir que o tenant_id não seja nulo
  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não possui tenant_id definido';
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- 3. CONFIGURAR TABELA USERS (se não existir)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT,
  tenant_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política RLS para users (usuários podem ver apenas seus próprios dados)
DROP POLICY IF EXISTS "users_isolation" ON public.users;
CREATE POLICY "users_isolation" 
ON public.users FOR ALL 
USING (auth.uid() = id);

-- =====================================================
-- 4. CONFIGURAR TABELA TENANTS (se não existir)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON public.tenants(active);

-- Habilitar RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Política RLS para tenants (usuários podem ver apenas seu tenant)
DROP POLICY IF EXISTS "tenants_isolation" ON public.tenants;
CREATE POLICY "tenants_isolation" 
ON public.tenants FOR SELECT 
USING (id = auth.get_user_tenant_id());

-- =====================================================
-- 5. CONFIGURAR TABELA TENANT_USERS (se não existir)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'MANAGER', 'USER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);

-- Habilitar RLS
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- Política RLS para tenant_users
DROP POLICY IF EXISTS "tenant_users_isolation" ON public.tenant_users;
CREATE POLICY "tenant_users_isolation" 
ON public.tenant_users FOR ALL 
USING (user_id = auth.uid() OR tenant_id = auth.get_user_tenant_id());

-- =====================================================
-- 6. EXEMPLO DE CONFIGURAÇÃO PARA TABELA CHARGES
-- =====================================================

-- Assumindo que a tabela charges já existe, vamos configurá-la
DO $$
BEGIN
  -- Verificar se a tabela charges existe
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'charges') THEN
    
    -- Adicionar coluna tenant_id se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'charges' AND column_name = 'tenant_id') THEN
      ALTER TABLE public.charges ADD COLUMN tenant_id TEXT;
    END IF;
    
    -- Criar índice para tenant_id
    CREATE INDEX IF NOT EXISTS idx_charges_tenant_id ON public.charges(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_charges_tenant_created ON public.charges(tenant_id, created_at DESC);
    
    -- Habilitar RLS
    ALTER TABLE public.charges ENABLE ROW LEVEL SECURITY;
    
    -- Política RLS para charges
    DROP POLICY IF EXISTS "charges_isolation" ON public.charges;
    CREATE POLICY "charges_isolation" 
    ON public.charges FOR ALL 
    USING (tenant_id = auth.get_user_tenant_id());
    
    -- Trigger para definir tenant_id automaticamente
    DROP TRIGGER IF EXISTS set_tenant_id_trigger ON public.charges;
    CREATE TRIGGER set_tenant_id_trigger
      BEFORE INSERT ON public.charges
      FOR EACH ROW
      EXECUTE FUNCTION public.set_tenant_id();
      
  END IF;
END
$$;

-- =====================================================
-- 7. FUNÇÃO PARA APLICAR CONFIGURAÇÃO A NOVAS TABELAS
-- =====================================================

CREATE OR REPLACE FUNCTION public.setup_tenant_table(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Adicionar coluna tenant_id se não existir
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tenant_id TEXT', table_name);
  
  -- Criar índices
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_tenant_id ON public.%I(tenant_id)', table_name, table_name);
  
  -- Habilitar RLS
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
  
  -- Criar política RLS
  EXECUTE format('DROP POLICY IF EXISTS "%I_isolation" ON public.%I', table_name, table_name);
  EXECUTE format('CREATE POLICY "%I_isolation" ON public.%I FOR ALL USING (tenant_id = auth.get_user_tenant_id())', table_name, table_name);
  
  -- Criar trigger para definir tenant_id automaticamente
  EXECUTE format('DROP TRIGGER IF EXISTS set_tenant_id_trigger ON public.%I', table_name);
  EXECUTE format('CREATE TRIGGER set_tenant_id_trigger BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id()', table_name);
  
  RAISE NOTICE 'Tabela % configurada para multi-tenancy', table_name;
END;
$$;

-- =====================================================
-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION auth.get_user_tenant_id() IS 'Retorna o tenant_id do usuário autenticado atual';
COMMENT ON FUNCTION public.set_tenant_id() IS 'Trigger function para definir tenant_id automaticamente em inserções';
COMMENT ON FUNCTION public.setup_tenant_table(text) IS 'Configura uma tabela existente para multi-tenancy padrão';

-- =====================================================
-- 9. GRANTS E PERMISSÕES
-- =====================================================

-- Permitir que usuários autenticados executem as funções
GRANT EXECUTE ON FUNCTION auth.get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.setup_tenant_table(text) TO service_role;

-- =====================================================
-- FINALIZAÇÃO
-- =====================================================

-- Log de conclusão
DO $$
BEGIN
  RAISE NOTICE 'Configuração de multi-tenancy padrão concluída com sucesso!';
  RAISE NOTICE 'Para aplicar a configuração a uma nova tabela, use: SELECT public.setup_tenant_table(''nome_da_tabela'');';
END
$$;
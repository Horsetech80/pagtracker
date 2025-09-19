# Guia de Multitenancy - PagTracker

Este guia fornece instruções detalhadas sobre como trabalhar com a arquitetura multitenancy do PagTracker. Siga estas diretrizes ao implementar novos recursos ou modificar recursos existentes.

## Conceitos Básicos

### O que é Multitenancy?

No PagTracker, **multitenancy** significa que uma única instância do aplicativo serve múltiplos clientes (tenants), mantendo os dados de cada cliente isolados uns dos outros. Isso permite que cada cliente tenha sua própria experiência personalizada sem interferir nos dados de outros clientes.

### Abordagem do PagTracker

O PagTracker implementa multitenancy usando a abordagem de **isolamento baseado em linhas (Row Level Security - RLS)** no PostgreSQL, com as seguintes características:

- Cada tabela contém uma coluna `tenant_id` para identificar a qual tenant os dados pertencem
- Políticas RLS garantem que cada tenant só pode acessar seus próprios dados
- O contexto do tenant atual é definido usando a variável de configuração `app.current_tenant_id`

## Arquitetura do Banco de Dados

### Estrutura de Tabelas

Todas as tabelas que contêm dados específicos de tenant devem seguir este padrão:

```sql
CREATE TABLE public.my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,  -- Sempre inclua este campo
  -- outros campos...
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar índice para tenant_id
CREATE INDEX idx_my_table_tenant_id ON public.my_table(tenant_id);

-- Habilitar RLS
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

-- Adicionar política RLS para isolamento
CREATE POLICY "tenant_isolation_my_table" 
ON public.my_table FOR ALL 
USING ((tenant_id)::text = current_setting('app.current_tenant_id'::text, true));
```

### Requisitos para Novas Tabelas

Ao criar novas tabelas, sempre:

1. Adicione uma coluna `tenant_id TEXT NOT NULL`
2. Crie um índice para a coluna `tenant_id`
3. Habilite Row Level Security (RLS) na tabela
4. Adicione uma política RLS para isolamento por tenant_id

## Desenvolvimento de Componentes

### Backend (API Routes)

Ao implementar novas rotas de API, siga estas práticas:

```typescript
// src/app/api/meu-recurso/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // 1. Obter o tenant_id do cookie ou header
    const cookieStore = cookies();
    const tenantId = cookieStore.get('tenant-id')?.value;
    
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não especificado" }, { status: 400 });
    }
    
    // 2. Criar cliente Supabase
    const supabase = createServiceClient();
    
    // 3. Definir o contexto do tenant
    await supabase.rpc('set_tenant_context', { tenant_id: tenantId });
    
    // 4. Realizar as operações (o RLS garante que só os dados do tenant atual sejam acessados)
    const { data, error } = await supabase
      .from('minha_tabela')
      .select('*');
    
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Frontend (React Components)

Ao criar componentes que acessam dados, sempre considere o tenant atual:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function MeuComponente() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // O middleware já deve ter definido o tenant_id no cookie
    // As políticas RLS garantirão o isolamento de dados
    const fetchData = async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data, error } = await supabase
        .from('minha_tabela')
        .select('*');
      
      if (!error) {
        setData(data || []);
      }
    };
    
    fetchData();
  }, []);
  
  return (
    // Renderização do componente
  );
}
```

## Funções Utilitárias

O PagTracker fornece várias funções utilitárias para trabalhar com multitenancy:

### Funções de Banco de Dados

- `set_tenant_context(tenant_id TEXT)`: Define o tenant atual para a sessão
- `user_has_tenant_access(tenant_id TEXT, user_id UUID)`: Verifica se um usuário tem acesso a um tenant
- `get_user_tenant_role(tenant_id TEXT, user_id UUID)`: Retorna o papel do usuário em um tenant
- `is_tenant_admin(tenant_id TEXT, user_id UUID)`: Verifica se um usuário é administrador de um tenant
- `is_global_admin()`: Verifica se um usuário é administrador global do sistema

### Funções JavaScript/TypeScript

```typescript
// src/lib/tenant-utils.ts
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Obter o tenant_id atual
export function getCurrentTenantId() {
  const cookieStore = cookies();
  return cookieStore.get('tenant-id')?.value;
}

// Verificar se o usuário tem acesso ao tenant
export async function userHasTenantAccess(tenantId: string, userId?: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc('user_has_tenant_access', {
    tenant_id: tenantId,
    user_id: userId
  });
  
  if (error) {
    console.error('Erro ao verificar acesso ao tenant:', error);
    return false;
  }
  
  return data;
}
```

## Troubleshooting

### Problemas Comuns

1. **Dados não aparecem**: Verifique se o contexto do tenant foi definido corretamente usando `set_tenant_context`
2. **Erro "permission denied"**: Verifique se a política RLS está configurada corretamente para a tabela
3. **Vazamento de dados entre tenants**: Certifique-se de que todas as tabelas têm políticas RLS apropriadas

### Ferramentas de Diagnóstico

Use os scripts de diagnóstico disponíveis:

```bash
# Verificar a configuração multitenancy
node scripts/check-multitenancy.js

# Executar migrações para atualizar o esquema
node scripts/run-migrations.js
```

## Boas Práticas

1. **Sempre pense em multitenancy**: Qualquer nova tabela ou feature deve considerar a separação de dados por tenant
2. **Use os helpers existentes**: Aproveite as funções utilitárias existentes ao invés de reimplementar a lógica
3. **Teste com múltiplos tenants**: Teste suas features trocando entre diferentes tenants para garantir o isolamento
4. **Inicialize dados por tenant**: Quando um novo tenant for criado, certifique-se de criar todos os dados iniciais necessários
5. **Índices para performance**: Sempre crie índices para colunas tenant_id para manter a performance em consultas filtradas

## Versionamento e Migrações

Ao adicionar novas tabelas ou modificar existentes, crie migrações adequadas:

```sql
-- supabase/migrations/YYYYMMDD_my_feature.sql
-- Descrição: Adicionar nova tabela para feature X

CREATE TABLE public.my_new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  -- Outros campos
);

-- Índice e políticas RLS
CREATE INDEX idx_my_new_table_tenant_id ON public.my_new_table(tenant_id);
ALTER TABLE public.my_new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_my_new_table" ON public.my_new_table FOR ALL USING ((tenant_id)::text = current_setting('app.current_tenant_id'::text, true));
```

## Conclusão

Seguindo estas diretrizes, você garantirá que o PagTracker mantenha um isolamento adequado entre os dados de diferentes tenants, enquanto fornece uma experiência personalizada para cada cliente. 
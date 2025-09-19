'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useTenantId } from '@/lib/hooks/useTenantId';

/**
 * Componente de exemplo que demonstra o uso do contexto de tenant
 * Este componente carrega dados específicos do tenant atual
 */
export default function TenantAwareComponent() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Obter o tenant_id atual usando o hook
  const { tenantId, tenant } = useTenantId();
  
  // Criar cliente Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  useEffect(() => {
    // Se não tiver tenant_id, não carregar dados
    if (!tenantId) return;
    
    async function loadTenantData() {
      try {
        setLoading(true);
        
        // Exemplo: Carregar cobranças do tenant atual
        // O tenant_id está sendo usado implicitamente via política RLS
        const { data: chargesData, error: chargesError } = await supabase
          .from('charges')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (chargesError) {
          throw chargesError;
        }
        
        setData(chargesData || []);
      } catch (err: any) {
        console.error('Erro ao carregar dados do tenant:', err);
        setError(err.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }
    
    loadTenantData();
  }, [tenantId, supabase]);
  
  if (loading) {
    return <div className="p-4">Carregando dados do tenant {tenant?.name || tenantId || 'N/A'}...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-red-500">Erro: {error}</div>;
  }
  
  if (data.length === 0) {
    return (
      <div className="p-4 border rounded">
        <h3 className="font-medium">Tenant: {tenant?.name || tenantId || 'N/A'}</h3>
        <p className="text-gray-500 mt-2">Nenhum dado encontrado para este tenant.</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 border rounded">
      <h3 className="font-medium">Dados do Tenant: {tenant?.name || tenantId || 'N/A'}</h3>
      <div className="mt-2">
        <ul className="space-y-2">
          {data.map((item) => (
            <li key={item.id} className="border-b pb-2">
              <div className="font-medium">{item.descricao || 'Sem descrição'}</div>
              <div className="text-sm text-gray-500">
                Valor: R$ {(item.valor || 0).toFixed(2)}
              </div>
              <div className="text-xs text-gray-400">
                ID: {item.id}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 
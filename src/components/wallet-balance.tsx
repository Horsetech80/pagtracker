"use client";

import { useEffect, useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/lib/supabase/client';

interface WalletData {
  available: number;
  pending: number;
  total: number;
}

export function WalletBalance() {
  const [balance, setBalance] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenant } = useTenant();

  useEffect(() => {
    async function fetchBalance() {
      if (!tenant?.id) return;
      
      // Obter usuário atual do Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/wallet/balance', {
          headers: {
            'x-tenant-id': tenant.id,
            'x-user-id': user.id
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Erro ao carregar saldo');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setBalance(data.data);
        } else {
          throw new Error(data.message || 'Erro ao carregar saldo');
        }
      } catch (err) {
        console.error('Erro ao buscar saldo:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();
  }, [tenant?.id]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-muted rounded w-20"></div>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-xs text-destructive">
        Erro ao carregar
      </p>
    );
  }

  if (!balance) {
    return (
      <p className="text-lg font-semibold text-primary">
        R$ 0,00
      </p>
    );
  }

  return (
    <p className="text-lg font-semibold text-primary">
      {new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(balance.available)}
    </p>
  );
}
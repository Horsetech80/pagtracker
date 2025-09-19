'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { validateWithdrawalBalance, validateUserWithdrawalEligibility } from '@/lib/validations/withdrawal';

interface BalanceValidatorProps {
  userId: string;
  tenantId: string;
  requestedAmount: number; // em centavos
  onValidationChange: (isValid: boolean, errors: string[]) => void;
  className?: string;
}

interface WalletBalance {
  available_balance_cents: number;
  pending_balance_cents: number;
  total_balance_cents: number;
}

export function BalanceValidator({
  userId,
  tenantId,
  requestedAmount,
  onValidationChange,
  className
}: BalanceValidatorProps) {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Buscar saldo da carteira
  const fetchBalance = async () => {
    if (!userId || !tenantId) return;

    try {
      setLoading(true);
      const response = await fetch('/api/wallet/balance', {
        headers: {
          'x-user-id': userId,
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
      } else {
        console.error('Erro ao buscar saldo');
      }
    } catch (error) {
      console.error('Erro ao buscar saldo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validar valor e saldo
  const validateWithdrawal = () => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    // Validar valor mínimo/máximo usando validação simples
    if (requestedAmount < 100) { // R$ 1,00
      newErrors.push('Valor mínimo de saque é R$ 1,00');
    }
    if (requestedAmount > 5000000) { // R$ 50.000,00
      newErrors.push('Valor máximo de saque é R$ 50.000,00');
    }

    // Validar saldo se disponível
    if (balance) {
      const balanceValidation = validateWithdrawalBalance(
        requestedAmount,
        balance.available_balance_cents
      );
      
      if (!balanceValidation.isValid) {
        newErrors.push(balanceValidation.error || 'Saldo insuficiente');
      }

      // Avisos sobre saldo
      const remainingBalance = balance.available_balance_cents - requestedAmount;
      const percentageOfBalance = (requestedAmount / balance.available_balance_cents) * 100;

      if (remainingBalance < 1000) { // Menos de R$ 10,00
        newWarnings.push('Após este saque, seu saldo ficará muito baixo.');
      }

      if (percentageOfBalance > 80) {
        newWarnings.push('Você está sacando mais de 80% do seu saldo disponível.');
      }

      if (balance.pending_balance_cents > 0) {
        newWarnings.push(
          `Você possui ${formatCurrency(balance.pending_balance_cents / 100)} em saldo pendente.`
        );
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    
    const isValid = newErrors.length === 0 && balance !== null;
    onValidationChange(isValid, newErrors);
  };

  // Carregar saldo inicial
  useEffect(() => {
    fetchBalance();
  }, [userId, tenantId]);

  // Validar quando valor ou saldo mudar
  useEffect(() => {
    if (requestedAmount > 0) {
      validateWithdrawal();
    } else {
      setErrors([]);
      setWarnings([]);
      onValidationChange(false, []);
    }
  }, [requestedAmount, balance]);

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!balance) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Não foi possível carregar o saldo da carteira.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Informações do saldo */}
      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Saldo disponível:</span>
          <Badge variant="outline" className="font-mono">
            {formatCurrency(balance.available_balance_cents / 100)}
          </Badge>
        </div>
        
        {balance.pending_balance_cents > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Saldo pendente:</span>
            <Badge variant="secondary" className="font-mono">
              {formatCurrency(balance.pending_balance_cents / 100)}
            </Badge>
          </div>
        )}
        
        {requestedAmount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Saldo após saque:</span>
            <Badge 
              variant={balance.available_balance_cents - requestedAmount >= 0 ? "outline" : "destructive"}
              className="font-mono"
            >
              {formatCurrency((balance.available_balance_cents - requestedAmount) / 100)}
            </Badge>
          </div>
        )}
      </div>

      {/* Erros de validação */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Avisos */}
      {warnings.length > 0 && errors.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Validação bem-sucedida */}
      {errors.length === 0 && requestedAmount > 0 && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Valor válido para saque.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
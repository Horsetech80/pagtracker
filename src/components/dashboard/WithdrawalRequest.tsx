'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { BalanceValidator } from '@/components/withdrawals/BalanceValidator';
import { validatePixKey, formatPixKey, getPixKeyPlaceholder } from '@/lib/utils/pix-validation';

interface WithdrawalFormData {
  amount: string;
  pix_key: string;
  pix_key_type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  recipient_name: string;
  recipient_document: string;
}

interface ValidationErrors {
  amount?: string;
  pix_key?: string;
  recipient_name?: string;
}

interface WithdrawalRequestProps {
  availableBalance: number;
  onSuccess?: () => void;
}

export function WithdrawalRequest({ availableBalance, onSuccess }: WithdrawalRequestProps) {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isAmountValid, setIsAmountValid] = useState(false);
  const [formData, setFormData] = useState<WithdrawalFormData>({
    amount: '',
    pix_key: '',
    pix_key_type: 'cpf',
    recipient_name: '',
    recipient_document: ''
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatCurrencyInput = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Se não há números, retorna vazio
    if (!numbers) return '';
    
    // Converte para centavos e depois para reais
    const amount = parseInt(numbers) / 100;
    
    // Formata como moeda brasileira sem o símbolo R$
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const parseCurrencyInput = (value: string): number => {
    // Remove pontos e substitui vírgula por ponto
    const cleanValue = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };



  const handleInputChange = (field: keyof WithdrawalFormData, value: string) => {
    let processedValue = value;
    
    // Format amount with currency mask
    if (field === 'amount') {
      processedValue = formatCurrencyInput(value);
    }
    
    // Format PIX key based on type
    if (field === 'pix_key') {
      processedValue = formatPixKey(value, formData.pix_key_type);
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    setError(null);
    

    
    // Amount validation is handled by BalanceValidator component

    // Clear PIX key when type changes
    if (field === 'pix_key_type') {
      setFormData(prev => ({ ...prev, pix_key: '' }));
      setValidationErrors(prev => ({ ...prev, pix_key: undefined }));
    }
    
    // Validate PIX key
    if (field === 'pix_key' || field === 'pix_key_type') {
      const pixKey = field === 'pix_key' ? processedValue : (field === 'pix_key_type' ? '' : formData.pix_key);
      const pixKeyType = field === 'pix_key_type' ? processedValue : formData.pix_key_type;
      
      if (pixKey) {
        const validation = validatePixKey(pixKey, pixKeyType as any);
        if (!validation.isValid) {
          setValidationErrors(prev => ({ ...prev, pix_key: validation.message || 'Chave PIX inválida para o tipo selecionado' }));
        } else {
          setValidationErrors(prev => ({ ...prev, pix_key: undefined }));
        }
      } else {
        setValidationErrors(prev => ({ ...prev, pix_key: undefined }));
      }
    }
    
    // Validate recipient name
    if (field === 'recipient_name') {
      if (!processedValue.trim()) {
        setValidationErrors(prev => ({ ...prev, recipient_name: 'Nome do destinatário é obrigatório' }));
      } else {
        setValidationErrors(prev => ({ ...prev, recipient_name: undefined }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !tenant) {
      setError('Usuário ou tenant não encontrado');
      return;
    }

    // Validações
    const amount = parseCurrencyInput(formData.amount);
    if (!isAmountValid) {
      setError('Valor inválido para saque');
      return;
    }

    // Check for validation errors
    if (validationErrors.pix_key || validationErrors.recipient_name || !isAmountValid) {
      setError('Por favor, corrija os erros no formulário');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/withdrawals/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenant.id,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          amount,
          pix_key: formData.pix_key,
          pix_key_type: formData.pix_key_type,
          recipient_name: formData.recipient_name,
          recipient_document: formData.recipient_document || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao solicitar saque');
      }

      setSuccess(true);
      setFormData({
        amount: '',
        pix_key: '',
        pix_key_type: 'cpf',
        recipient_name: '',
        recipient_document: ''
      });

      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao solicitar saque');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">Solicitação Enviada!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sua solicitação de saque foi enviada para análise. Você será notificado quando for processada.
              </p>
            </div>
            <Button 
              onClick={() => setSuccess(false)}
              variant="outline"
            >
              Nova Solicitação
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Solicitar Saque PIX
        </CardTitle>
        <CardDescription>
          Saldo disponível: {formatCurrency(availableBalance)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Valor do Saque */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor do Saque</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="amount"
                type="text"
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className={`pl-10 ${validationErrors.amount ? 'border-destructive' : ''}`}
                required
              />
            </div>
            {validationErrors.amount && (
              <p className="text-sm text-destructive">{validationErrors.amount}</p>
            )}
            {/* Balance Validator */}
            <BalanceValidator
              userId={user?.id || ''}
              tenantId={tenant?.id || ''}
              requestedAmount={Math.round((parseCurrencyInput(formData.amount) || 0) * 100)}
              onValidationChange={(isValid, errors) => {
                setIsAmountValid(isValid);
                if (errors.length > 0) {
                  setValidationErrors(prev => ({ ...prev, amount: errors[0] }));
                } else {
                  setValidationErrors(prev => ({ ...prev, amount: undefined }));
                }
              }}
            />
          </div>

          {/* Tipo de Chave PIX */}
          <div className="space-y-2">
            <Label htmlFor="pix_key_type">Tipo de Chave PIX</Label>
            <Select
              value={formData.pix_key_type}
              onValueChange={(value) => handleInputChange('pix_key_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de chave PIX">
                  {formData.pix_key_type === 'cpf' && 'CPF'}
                  {formData.pix_key_type === 'cnpj' && 'CNPJ'}
                  {formData.pix_key_type === 'email' && 'E-mail'}
                  {formData.pix_key_type === 'phone' && 'Telefone'}
                  {formData.pix_key_type === 'random' && 'Chave Aleatória'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="cnpj">CNPJ</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="phone">Telefone</SelectItem>
                <SelectItem value="random">Chave Aleatória</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chave PIX */}
          <div className="space-y-2">
            <Label htmlFor="pix_key">Chave PIX</Label>
            <Input
              id="pix_key"
              type="text"
              placeholder={getPixKeyPlaceholder(formData.pix_key_type)}
              value={formData.pix_key}
              onChange={(e) => handleInputChange('pix_key', e.target.value)}
              className={validationErrors.pix_key ? 'border-destructive' : ''}
              required
            />
            {validationErrors.pix_key && (
              <p className="text-sm text-destructive">{validationErrors.pix_key}</p>
            )}
          </div>

          {/* Nome do Destinatário */}
          <div className="space-y-2">
            <Label htmlFor="recipient_name">Nome do Destinatário</Label>
            <Input
              id="recipient_name"
              type="text"
              placeholder="Nome completo"
              value={formData.recipient_name}
              onChange={(e) => handleInputChange('recipient_name', e.target.value)}
              className={validationErrors.recipient_name ? 'border-destructive' : ''}
              required
            />
            {validationErrors.recipient_name && (
              <p className="text-sm text-destructive">{validationErrors.recipient_name}</p>
            )}
          </div>

          {/* Documento do Destinatário (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="recipient_document">Documento do Destinatário (Opcional)</Label>
            <Input
              id="recipient_document"
              type="text"
              placeholder="CPF ou CNPJ"
              value={formData.recipient_document}
              onChange={(e) => handleInputChange('recipient_document', e.target.value)}
            />
          </div>

          {/* Mensagens de Erro */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Botão de Envio */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || availableBalance <= 0 || !isAmountValid || !!validationErrors.pix_key || !!validationErrors.recipient_name}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Solicitar Saque'
            )}
          </Button>

          {availableBalance <= 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Você não possui saldo disponível para saque.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
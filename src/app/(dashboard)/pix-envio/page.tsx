'use client';

import { useState, useEffect } from 'react';
import { useTenantId } from '@/lib/hooks/useTenantId';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Wallet, CreditCard, Building2, User, Mail, Phone, Hash, AlertCircle, CheckCircle, Clock, Info } from 'lucide-react';
import { toast } from 'sonner';

interface WithdrawalData {
  amount: string;
  pix_key: string;
  pix_key_type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  description?: string;
}

interface WithdrawalValidation {
  valid: boolean;
  error?: string;
  available_balance: number;
  requested_amount: number;
  fee_amount: number;
  net_amount: number;
  gross_amount: number;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  pix_key: string;
  pix_key_type: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';
  requested_at: string;
  processed_at?: string;
  rejection_reason?: string;
}

export default function WithdrawalRequestPage() {
  const { tenantId, tenant, isLoading: tenantLoading } = useTenantId();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState<WithdrawalData>({
    amount: '',
    pix_key: '',
    pix_key_type: 'cpf',
    description: ''
  });
  const [validation, setValidation] = useState<WithdrawalValidation | null>(null);
  const [recentRequests, setRecentRequests] = useState<WithdrawalRequest[]>([]);

  // Load recent withdrawal requests
  useEffect(() => {
    loadRecentRequests();
  }, []);

  const loadRecentRequests = async () => {
    try {
      const response = await fetch('/api/wallet/withdraw?limit=5', { credentials: 'include' });
      const result = await response.json();
      
      if (result.success && result.data?.items) {
        setRecentRequests(result.data.items);
      }
    } catch (error) {
      console.error('Error loading recent requests:', error);
    }
  };

  const validateWithdrawal = async (amount: number) => {
    if (amount <= 0) {
      setValidation(null);
      return;
    }

    setValidating(true);
    try {
      const response = await fetch('/api/wallet/withdraw/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
        credentials: 'include'
      });

      const result = await response.json();
      
      if (result.success) {
        setValidation(result.data);
      } else {
        setValidation({
          valid: false,
          error: result.error,
          available_balance: 0,
          requested_amount: amount,
          fee_amount: 0,
          net_amount: 0,
          gross_amount: amount
        });
      }
    } catch (error) {
      console.error('Error validating withdrawal:', error);
      setValidation({
        valid: false,
        error: 'Erro ao validar solicitação',
        available_balance: 0,
        requested_amount: amount,
        fee_amount: 0,
        net_amount: 0,
        gross_amount: amount
      });
    } finally {
      setValidating(false);
    }
  };

  const handleWithdrawalRequest = async () => {
    if (!withdrawalData.amount || parseFloat(withdrawalData.amount) <= 0) {
      toast.error('Valor inválido');
      return;
    }

    if (!withdrawalData.pix_key) {
      toast.error('Chave PIX é obrigatória');
      return;
    }

    if (!validation?.valid) {
      toast.error('Solicitação inválida. Verifique os dados.');
      return;
    }

    setLoading(true);

    try {
      const amountCents = Math.round(parseFloat(withdrawalData.amount) * 100);
      
      const payload = {
        amount: amountCents,
        pix_key: withdrawalData.pix_key,
        pix_key_type: withdrawalData.pix_key_type,
        description: withdrawalData.description || 'Solicitação de saque'
      };

      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Solicitação de saque criada com sucesso!');
        // Reset form
        setWithdrawalData({
          amount: '',
          pix_key: '',
          pix_key_type: 'cpf',
          description: ''
        });
        setValidation(null);
        // Reload recent requests
        loadRecentRequests();
      } else {
        toast.error(result.error || 'Erro ao criar solicitação de saque');
      }
    } catch (error) {
      console.error('Erro ao criar solicitação de saque:', error);
      toast.error('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const floatValue = parseFloat(numericValue) / 100;
    return floatValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatCurrencyFromCents = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const floatValue = parseFloat(numericValue) / 100;
    const newAmount = floatValue.toString();
    
    setWithdrawalData(prev => ({ ...prev, amount: newAmount }));
    
    // Validate withdrawal amount
    if (floatValue > 0) {
      const amountCents = Math.round(floatValue * 100);
      validateWithdrawal(amountCents);
    } else {
      setValidation(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'rejected':
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'approved':
        return 'Aprovada';
      case 'rejected':
        return 'Rejeitada';
      case 'processing':
        return 'Processando';
      case 'completed':
        return 'Concluída';
      case 'failed':
        return 'Falhou';
      default:
        return status;
    }
  };

  const getPixKeyTypeText = (type: string) => {
    switch (type) {
      case 'cpf':
        return 'CPF';
      case 'cnpj':
        return 'CNPJ';
      case 'email':
        return 'E-mail';
      case 'phone':
        return 'Telefone';
      case 'random':
        return 'Chave Aleatória';
      default:
        return type;
    }
  };

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!tenantId || !tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Tenant não encontrado</h2>
          <p className="text-muted-foreground">Verifique se você está logado corretamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-[80%]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Solicitação de Saque</h1>
          <p className="text-muted-foreground">
            Solicite um saque via PIX - sujeito à aprovação administrativa
          </p>
        </div>
        <Badge variant={tenant?.active ? 'default' : 'destructive'}>
          {tenant?.active ? 'Tenant Ativo' : 'Tenant Inativo'}
        </Badge>
      </div>

      {/* Informações Importantes */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Todas as solicitações de saque passam por análise administrativa. 
          O processamento pode levar até 24 horas úteis. Uma taxa de 1% será aplicada sobre o valor solicitado.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulário de Solicitação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Dados da Solicitação
            </CardTitle>
            <CardDescription>
              Preencha os dados para solicitar o saque via PIX
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor do Saque</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="amount"
                  type="text"
                  placeholder="0,00"
                  value={formatCurrency(withdrawalData.amount)}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              {validating && (
                <p className="text-sm text-muted-foreground">Validando...</p>
              )}
            </div>

            {/* Validação do Saque */}
            {validation && (
              <Alert className={validation.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                {validation.valid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  {validation.valid ? (
                    <div className="space-y-1">
                      <p className="font-medium text-green-800">Solicitação válida</p>
                      <div className="text-sm text-green-700">
                        <p>Valor bruto: {formatCurrencyFromCents(validation.gross_amount)}</p>
                        <p>Taxa (1%): {formatCurrencyFromCents(validation.fee_amount)}</p>
                        <p className="font-medium">Valor líquido: {formatCurrencyFromCents(validation.net_amount)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-800">{validation.error}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Chave PIX */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pixKeyType">Tipo da Chave PIX</Label>
                <Select
                  value={withdrawalData.pix_key_type}
                  onValueChange={(value) => setWithdrawalData(prev => ({ ...prev, pix_key_type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
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
              
              <div className="space-y-2">
                <Label htmlFor="pixKey">Chave PIX</Label>
                <Input
                  id="pixKey"
                  type="text"
                  placeholder="Digite sua chave PIX"
                  value={withdrawalData.pix_key}
                  onChange={(e) => setWithdrawalData(prev => ({ ...prev, pix_key: e.target.value }))}
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Motivo do saque ou observações"
                value={withdrawalData.description}
                onChange={(e) => setWithdrawalData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Botão de Solicitação */}
            <Button
              onClick={handleWithdrawalRequest}
              disabled={loading || !validation?.valid}
              className="w-full"
              size="lg"
            >
              {loading ? 'Criando Solicitação...' : 'Solicitar Saque'}
            </Button>
          </CardContent>
        </Card>

        {/* Solicitações Recentes */}
        {recentRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Solicitações Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {getPixKeyTypeText(request.pix_key_type)}: {request.pix_key}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(request.requested_at).toLocaleString('pt-BR')}
                      </p>
                      {request.rejection_reason && (
                        <p className="text-sm text-red-600 mt-1">
                          Motivo: {request.rejection_reason}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {formatCurrencyFromCents(request.net_amount)}
                      </p>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        <span className="text-sm">{getStatusText(request.status)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Informações sobre Solicitação de Saque */}
      <Card>
        <CardHeader>
          <CardTitle>Informações sobre Solicitação de Saque</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Processo de Aprovação</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Análise administrativa obrigatória</li>
                <li>• Processamento em até 24 horas úteis</li>
                <li>• Notificação por e-mail sobre o status</li>
                <li>• Histórico completo de solicitações</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Taxas e Limites</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Taxa de 1% sobre o valor solicitado</li>
                <li>• Valor mínimo: R$ 10,00</li>
                <li>• Saque via PIX instantâneo após aprovação</li>
                <li>• Suporte a todas as chaves PIX</li>
              </ul>
            </div>
          </div>
          
          <Separator />
          
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Tenant Atual</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span>Nome:</span>
                <span className="font-medium">{tenant?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>ID:</span>
                <span className="font-mono text-xs">{tenantId}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant={tenant?.active ? 'default' : 'destructive'} className="text-xs">
                  {tenant?.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
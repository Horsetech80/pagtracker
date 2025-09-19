'use client';

import { useState, useEffect } from 'react';
import { useTenantId } from '@/lib/hooks/useTenantId';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { 
  formatPixKey, 
  validatePixKey, 
  getPixKeyPlaceholder, 
  getPixKeyMaxLength,
  type PixKeyType 
} from '@/lib/utils/pix-validation';
import { supabase } from '@/lib/supabase/client';
// import { useTenant } from '@/contexts/TenantContext';

export default function CarteiraPage() {
  const { tenantId, tenant, isLoading: tenantLoading } = useTenantId();
  const [isLoading, setIsLoading] = useState(true);
  const [walletData, setWalletData] = useState({
    available: 0,
    processing: 0,
    total_received_month: 0,
    last_updated: ''
  });
  const [transactions, setTransactions] = useState([]);
  const [transactionsPagination, setTransactionsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    pixKey: '',
    pixKeyType: 'cpf' as PixKeyType,
    description: ''
  });
  const [withdrawErrors, setWithdrawErrors] = useState({
    amount: '',
    pixKey: ''
  });
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Função para validar formulário de saque
  const validateWithdrawForm = () => {
    const errors = { amount: '', pixKey: '' };
    let isValid = true;

    // Validar valor
    if (!withdrawData.amount) {
      errors.amount = 'Valor é obrigatório';
      isValid = false;
    } else {
      const amount = parseCurrencyInput(withdrawData.amount);
      if (amount <= 0) {
        errors.amount = 'Valor deve ser maior que zero';
        isValid = false;
      } else if (amount < 0.01) {
        errors.amount = 'Valor mínimo é R$ 0,01';
        isValid = false;
      } else if (amount > 50000) {
        errors.amount = 'Valor máximo é R$ 50.000,00';
        isValid = false;
      } else if (amount > walletData.available / 100) {
        errors.amount = 'Saldo insuficiente';
        isValid = false;
      }
    }

    // Validar chave PIX
    if (!withdrawData.pixKey.trim()) {
      errors.pixKey = 'Chave PIX é obrigatória';
      isValid = false;
    } else {
      const pixValidation = validatePixKey(withdrawData.pixKey, withdrawData.pixKeyType);
      if (!pixValidation.isValid) {
        errors.pixKey = pixValidation.message || 'Chave PIX inválida';
        isValid = false;
      }
    }

    setWithdrawErrors(errors);
    return isValid;
  };

  const handleWithdraw = async () => {
    if (!validateWithdrawForm()) {
      return;
    }

    const amount = parseCurrencyInput(withdrawData.amount);
    // Converter para centavos (formato esperado pela API)
    const amountInCents = Math.round(amount * 100);

    setIsWithdrawing(true);
    try {
      // Obter token de autenticação do Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erro de autenticação:', userError);
        toast.error('Erro de autenticação. Faça login novamente.');
        return;
      }
      
      // Usar user.id diretamente em vez de session
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-tenant-id': tenantId || ''
        },
        body: JSON.stringify({
          amount: amountInCents,
          pix_key: withdrawData.pixKey,
          pix_key_type: withdrawData.pixKeyType,
          description: withdrawData.description || `Solicitação de saque via PIX - ${tenant?.name}`
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Solicitação de saque enviada com sucesso! Aguarde a aprovação no painel administrativo.');
        setWithdrawData({ amount: '', pixKey: '', pixKeyType: 'cpf', description: '' });
        // Recarregar dados da carteira
        await Promise.all([
          loadWalletBalance(),
          loadWalletTransactions(1)
        ]);
        setIsWithdrawDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar solicitação de saque');
      }
    } catch (error) {
      console.error('Erro ao solicitar saque:', error);
      toast.error('Erro interno. Tente novamente.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Carregar saldo da carteira interna (isolado por tenant)
  const loadWalletBalance = async () => {
    try {
      // Obter token de autenticação do Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erro de autenticação:', userError);
        return;
      }
      
      // Usar user.id diretamente em vez de session
      const response = await fetch('/api/wallet/balance', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-tenant-id': tenantId || ''
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar saldo da carteira');
      }

      const result = await response.json();
      if (result.success) {
        setWalletData({
          available: result.data.available,
          processing: result.data.processing || 0,
          total_received_month: result.data.total,
          last_updated: result.data.last_updated
        });
      } else {
        throw new Error(result.message || 'Erro ao carregar saldo da carteira');
      }
    } catch (error) {
      console.error('Erro ao carregar saldo da carteira:', error);
      toast.error('Erro ao carregar saldo da carteira');
    }
  };

  // Carregar transações PIX reais da EfiPay
  const loadWalletTransactions = async (page = 1, limit = 10) => {
    try {
      // Obter token de autenticação do Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erro de autenticação:', userError);
        return;
      }
      
      // Usar user.id diretamente em vez de session
      const response = await fetch(`/api/efipay/transactions?paginacao.paginaAtual=${page - 1}&paginacao.itensPorPagina=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-tenant-id': tenantId || ''
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar transações PIX');
      }

      const result = await response.json();
      if (result.success) {
        setTransactions(result.data.transactions);
        setTransactionsPagination(result.data.pagination);
      } else {
        throw new Error(result.message || 'Erro ao carregar transações PIX');
      }
    } catch (error) {
      console.error('Erro ao carregar transações PIX:', error);
      toast.error('Erro ao carregar transações PIX');
    }
  };

  // Função para formatar valor monetário
  const formatCurrencyInput = (value: string): string => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    
    if (!digits) return '';
    
    // Converte para número e divide por 100 para ter centavos
    const number = parseInt(digits) / 100;
    
    // Formata como moeda brasileira
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para converter valor formatado para número
  const parseCurrencyInput = (value: string): number => {
    // Remove pontos e substitui vírgula por ponto
    const cleanValue = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };

  // Função para lidar com mudança no valor do saque
  const handleAmountChange = (value: string) => {
    const formattedValue = formatCurrencyInput(value);
    setWithdrawData(prev => ({ ...prev, amount: formattedValue }));
    
    // Validar em tempo real
    const numericValue = parseCurrencyInput(formattedValue);
    if (numericValue > 0 && numericValue <= walletData.available / 100) {
      setWithdrawErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  // Função para lidar com mudança na chave PIX
  const handlePixKeyChange = (value: string) => {
    const formattedValue = formatPixKey(value, withdrawData.pixKeyType);
    setWithdrawData(prev => ({ ...prev, pixKey: formattedValue }));
    
    // Validar em tempo real
    if (formattedValue.trim()) {
      const pixValidation = validatePixKey(formattedValue, withdrawData.pixKeyType);
      if (pixValidation.isValid) {
        setWithdrawErrors(prev => ({ ...prev, pixKey: '' }));
      } else {
        setWithdrawErrors(prev => ({ ...prev, pixKey: pixValidation.message || 'Chave PIX inválida' }));
      }
    } else {
      setWithdrawErrors(prev => ({ ...prev, pixKey: '' }));
    }
  };

  // Função para lidar com mudança no tipo de chave PIX
  const handlePixKeyTypeChange = (type: PixKeyType) => {
    setWithdrawData(prev => ({ 
      ...prev, 
      pixKeyType: type,
      pixKey: '' // Limpar chave ao mudar tipo
    }));
    
    // Limpar erro da chave PIX
    setWithdrawErrors(prev => ({ ...prev, pixKey: '' }));
  };

  useEffect(() => {
    if (tenantId && !tenantLoading) {
      const loadWalletData = async () => {
        try {
          setIsLoading(true);
          
          // Carregar saldo e transações em paralelo
          await Promise.all([
            loadWalletBalance(),
            loadWalletTransactions()
          ]);
        } catch (error) {
          console.error('Erro ao carregar dados da carteira:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadWalletData();
    }
  }, [tenantId, tenantLoading]);

  if (tenantLoading || isLoading) {
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
          <p className="text-gray-600">Não foi possível identificar seu tenant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Carteira</h2>
          <p className="text-muted-foreground">
            Controle financeiro e saldo • Tenant: {tenant.name} ({tenantId})
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
            <DialogTrigger asChild onClick={() => setIsWithdrawDialogOpen(true)}>
              <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Sacar via PIX
              </Button>
            </DialogTrigger>
            <DialogContent className="dashboard-card">
              <DialogHeader>
                <DialogTitle>Solicitar Saque via PIX</DialogTitle>
                <DialogDescription>
                  Solicite a transferência do seu saldo disponível. A solicitação será analisada e processada pela administração.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Valor
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="amount"
                      type="text"
                      placeholder="0,00"
                      value={withdrawData.amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className={withdrawErrors.amount ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {withdrawErrors.amount && (
                      <p className="text-sm text-destructive mt-1">{withdrawErrors.amount}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pixKeyType" className="text-right">
                    Tipo
                  </Label>
                  <Select value={withdrawData.pixKeyType} onValueChange={(value) => handlePixKeyTypeChange(value as PixKeyType)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Tipo da chave PIX" />
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pixKey" className="text-right">
                    Chave PIX
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="pixKey"
                      placeholder={getPixKeyPlaceholder(withdrawData.pixKeyType)}
                      value={withdrawData.pixKey}
                      onChange={(e) => handlePixKeyChange(e.target.value)}
                      maxLength={getPixKeyMaxLength(withdrawData.pixKeyType)}
                      className={withdrawErrors.pixKey ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {withdrawErrors.pixKey && (
                      <p className="text-sm text-destructive mt-1">{withdrawErrors.pixKey}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Descrição
                  </Label>
                  <Input
                    id="description"
                    placeholder="Opcional"
                    className="col-span-3"
                    value={withdrawData.description}
                    onChange={(e) => setWithdrawData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isWithdrawing || !withdrawData.amount || !withdrawData.pixKey} onClick={handleWithdraw}>
                  {isWithdrawing ? 'Enviando solicitação...' : 'Enviar Solicitação'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="w-full sm:w-auto">
            <ArrowDownLeft className="w-4 h-4 mr-2" />
            Depositar
          </Button>
        </div>
      </div>

      {/* Saldo Principal */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Saldo Disponível
          </CardTitle>
          <CardDescription>Saldo atual em sua carteira</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-600 mb-2">
            R$ {(walletData.available / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          {walletData.processing > 0 && (
            <div className="text-sm text-muted-foreground">
              R$ {(walletData.processing / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em processamento
            </div>
          )}
          <Badge variant={tenant?.active ? 'default' : 'destructive'}>
            {tenant?.active ? 'Tenant ativo - conectado às APIs' : 'Tenant inativo'}
          </Badge>
        </CardContent>
      </Card>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {(walletData.total_received_month / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={tenant?.active ? 'default' : 'destructive'}>
                {tenant?.active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {tenant?.active ? 'Carteira operacional' : 'Carteira desativada'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Transações */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>
            Tenant: {tenant?.name} - {transactions.length} transações encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Nenhuma transação encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Suas transações financeiras para o tenant &ldquo;{tenant?.name}&rdquo; aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {transaction.type === 'payment' ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.type === 'payment' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'payment' ? '+' : '-'}
                      R$ {(Math.abs(transaction.amount) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <Badge variant={
                      transaction.status === 'completed' ? 'default' :
                      transaction.status === 'processing' ? 'secondary' : 'destructive'
                    }>
                      {transaction.status === 'completed' ? 'Concluído' :
                       transaction.status === 'processing' ? 'Processando' : 'Falhou'}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {/* Paginação */}
              {transactionsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {transactionsPagination.page} de {transactionsPagination.totalPages} 
                    ({transactionsPagination.total} transações)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!transactionsPagination.hasPrev}
                      onClick={() => loadWalletTransactions(transactionsPagination.page - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!transactionsPagination.hasNext}
                      onClick={() => loadWalletTransactions(transactionsPagination.page + 1)}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* APIs Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>APIs da Carteira</CardTitle>
          <CardDescription>Endpoints multi-tenant para gerenciar carteira</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">GET /api/wallet/balance</p>
                <p className="text-sm text-muted-foreground">Obter saldo da carteira interna isolada por tenant (Header: x-tenant-id: {tenantId})</p>
              </div>
              <Badge variant="secondary">Multi-tenant</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">GET /api/efipay/transactions</p>
                <p className="text-sm text-muted-foreground">Listar transações PIX reais por tenant</p>
              </div>
              <Badge variant="secondary">EfiPay API</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">POST /api/efipay/pix-envio</p>
                <p className="text-sm text-muted-foreground">Solicitar saque via PIX isolado por tenant</p>
              </div>
              <Badge variant="secondary">PIX Envio</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">POST /api/wallet/deposit</p>
                <p className="text-sm text-muted-foreground">Solicitar depósito isolado por tenant</p>
              </div>
              <Badge variant="secondary">Multi-tenant</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/components/select';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { useTenantId } from '@/lib/hooks/useTenantId';
import { useToast } from '@/lib/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';

export default function NovaCobrancaPage() {
  const router = useRouter();
  const { tenantId, tenant, isLoading: tenantLoading } = useTenantId();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    valor: '',
    descricao: '',
    expiracao: '3600', // 1 hora por padrão
    clienteNome: '',
    clienteEmail: '',
    clienteDocumento: '',
    clienteTelefone: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Converte para centavos
    const amount = parseInt(numbers) || 0;
    
    // Formata como moeda brasileira
    return (amount / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    handleInputChange('valor', formatted);
  };

  const parseValorToNumber = (valor: string): number => {
    // Remove símbolos de moeda e converte para número
    const numbers = valor.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(numbers) || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenantId) {
      toast({
        title: 'Erro',
        description: 'Tenant não identificado',
        variant: 'destructive'
      });
      return;
    }

    const valorNumerico = parseValorToNumber(formData.valor);
    
    if (valorNumerico <= 0) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um valor válido',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.descricao.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira uma descrição',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.clienteNome.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira o nome do cliente',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.clienteEmail.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira o e-mail do cliente',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.clienteDocumento.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira o CPF do cliente',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Fazer a requisição diretamente - o middleware da API cuidará da autenticação via cookies
      const response = await fetch('/api/charges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: valorNumerico,
          description: formData.descricao,
          expiration: parseInt(formData.expiracao),
          customer: {
            name: formData.clienteNome,
            email: formData.clienteEmail,
            cpf: formData.clienteDocumento?.replace(/\D/g, ''), // Remove formatação e usa como CPF
          }
        }),
        credentials: 'include' // Importante: incluir cookies de autenticação
      });

      const result = await response.json();
      
      console.log('Resposta da API:', result); // Debug

      if (response.ok && result.success) {
        const chargeId = result.id || result.charge?.id;
        console.log('ID da cobrança criada:', chargeId); // Debug
        
        if (!chargeId) {
          throw new Error('ID da cobrança não foi retornado pela API');
        }
        
        toast({
          title: 'Sucesso',
          description: 'Cobrança criada com sucesso! Redirecionando para detalhes...',
          variant: 'success'
        });
        
        // Aguardar um pouco antes de redirecionar para garantir que a cobrança foi persistida
        setTimeout(() => {
          router.push(`/cobrancas/${chargeId}`);
        }, 1000);
      } else {
        toast({
          title: 'Erro',
          description: result.error?.message || 'Erro ao criar cobrança',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao criar cobrança:', error);
      toast({
        title: 'Erro',
        description: 'Erro interno do servidor',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/cobrancas">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nova Cobrança</h2>
          <p className="text-muted-foreground">
            Crie uma nova cobrança PIX • Tenant: {tenant?.name || tenantId || 'N/A'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Dados da Cobrança
            </CardTitle>
            <CardDescription>
              Preencha os dados para gerar a cobrança PIX
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Valor */}
              <div className="space-y-2">
                <Label htmlFor="valor">Valor *</Label>
                <Input
                  id="valor"
                  type="text"
                  placeholder="R$ 0,00"
                  value={formData.valor}
                  onChange={handleValorChange}
                  required
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descrição da cobrança"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  maxLength={140}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.descricao.length}/140 caracteres
                </p>
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-2">
                <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">PIX</span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">PIX</p>
                    <p className="text-xs text-blue-700">Pagamento instantâneo via QR Code</p>
                  </div>
                </div>
              </div>

              {/* Expiração */}
              <div className="space-y-2">
                <Label htmlFor="expiracao">Tempo de Expiração</Label>
                <Select value={formData.expiracao} onValueChange={(value) => handleInputChange('expiracao', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="900">15 minutos</SelectItem>
                    <SelectItem value="1800">30 minutos</SelectItem>
                    <SelectItem value="3600">1 hora</SelectItem>
                    <SelectItem value="7200">2 horas</SelectItem>
                    <SelectItem value="14400">4 horas</SelectItem>
                    <SelectItem value="28800">8 horas</SelectItem>
                    <SelectItem value="86400">24 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dados do Cliente (Obrigatório) */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Dados do Cliente *</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="clienteNome">Nome do cliente *</Label>
                  <Input
                    id="clienteNome"
                    placeholder="Digite o nome e sobrenome"
                    value={formData.clienteNome}
                    onChange={(e) => handleInputChange('clienteNome', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clienteEmail">E-mail do cliente *</Label>
                  <Input
                    id="clienteEmail"
                    type="email"
                    placeholder="efipay@sejaefi.com.br"
                    value={formData.clienteEmail}
                    onChange={(e) => handleInputChange('clienteEmail', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clienteDocumento">CPF do cliente *</Label>
                  <Input
                    id="clienteDocumento"
                    placeholder="000.000.000-00"
                    value={formData.clienteDocumento}
                    onChange={(e) => handleInputChange('clienteDocumento', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clienteTelefone">Telefone do cliente (opcional)</Label>
                  <Input
                    id="clienteTelefone"
                    placeholder="(00) 00000-0000"
                    value={formData.clienteTelefone}
                    onChange={(e) => handleInputChange('clienteTelefone', e.target.value)}
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Cobrança'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview/Informações */}
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
            <CardDescription>
              Detalhes sobre a cobrança PIX
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Como funciona:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• A cobrança PIX será gerada automaticamente</li>
                <li>• O QR Code será exibido na página de detalhes</li>
                <li>• O cliente receberá o QR Code por e-mail</li>
                <li>• Você será notificado quando o pagamento for confirmado</li>
                <li>• A cobrança expira no tempo definido</li>
              </ul>
            </div>

            {formData.valor && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Resumo:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Valor:</span>
                    <span className="font-medium">{formData.valor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expira em:</span>
                    <span>{parseInt(formData.expiracao) / 3600}h</span>
                  </div>
                  {formData.clienteNome && (
                    <div className="flex justify-between">
                      <span>Cliente:</span>
                      <span>{formData.clienteNome}</span>
                    </div>
                  )}
                  {formData.clienteEmail && (
                    <div className="flex justify-between">
                      <span>E-mail:</span>
                      <span className="text-xs">{formData.clienteEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-1">💡 Dica</h4>
              <p className="text-sm text-blue-700">
                Após criar a cobrança, você será redirecionado para a página de detalhes onde poderá visualizar o QR Code e compartilhar com o cliente. O cliente também receberá o QR Code por e-mail automaticamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
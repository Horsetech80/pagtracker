'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CreditCard, Building, ArrowLeft, ArrowRight, Copy, Check } from 'lucide-react';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { useTenantId } from '@/lib/hooks/useTenantId';

export default function ConfiguracoesFinanceirasPage() {
  const router = useRouter();
  const tenantId = useTenantId();
  const { onboardingStatus, completeStep } = useOnboarding();
  
  const [formData, setFormData] = useState({
    banco: '',
    agencia: '',
    conta: '',
    tipoConta: '',
    chavePix: '',
    tipoChavePix: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [pixKeys, setPixKeys] = useState<any[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const bancos = [
    { value: '001', label: 'Banco do Brasil' },
    { value: '237', label: 'Bradesco' },
    { value: '104', label: 'Caixa Econômica Federal' },
    { value: '341', label: 'Itaú' },
    { value: '033', label: 'Santander' },
    { value: '745', label: 'Citibank' },
    { value: '399', label: 'HSBC' },
    { value: '422', label: 'Safra' },
    { value: '655', label: 'Votorantim' },
    { value: '041', label: 'Banrisul' },
    { value: '070', label: 'BRB' },
    { value: '085', label: 'Cecred' },
    { value: '260', label: 'Nu Pagamentos (Nubank)' },
    { value: '323', label: 'Mercado Pago' },
    { value: '290', label: 'PagSeguro' },
    { value: '336', label: 'C6 Bank' },
    { value: '077', label: 'Banco Inter' }
  ];

  useEffect(() => {
    loadPixKeys();
  }, []);

  const loadPixKeys = async () => {
    try {
      const response = await fetch('/api/efipay/evp');
      if (response.ok) {
        const data = await response.json();
        setPixKeys(data.chaves || []);
      }
    } catch (error) {
      console.error('Erro ao carregar chaves PIX:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatAgencia = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 6);
  };

  const formatConta = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d+)(\d{1})$/, '$1-$2');
    }
    return numbers.slice(0, 9);
  };

  const validateForm = () => {
    if (!formData.banco) {
      toast.error('Banco é obrigatório');
      return false;
    }
    if (!formData.agencia.trim()) {
      toast.error('Agência é obrigatória');
      return false;
    }
    if (!formData.conta.trim()) {
      toast.error('Conta é obrigatória');
      return false;
    }
    if (!formData.tipoConta) {
      toast.error('Tipo de conta é obrigatório');
      return false;
    }
    return true;
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      toast.success('Chave PIX copiada!');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      toast.error('Erro ao copiar chave PIX');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Salvar configurações financeiras via API
      const response = await fetch('/api/onboarding/financial-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, tenantId })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar configurações financeiras');
      }

      // Marcar etapa como concluída
      await completeStep('financial-config');
      
      toast.success('Configurações financeiras salvas com sucesso!');
      router.push('/onboarding/verificacao');
    } catch (error) {
      console.error('Erro ao salvar configurações financeiras:', error);
      toast.error('Erro ao salvar configurações financeiras. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/onboarding/dados-empresa')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Etapa Anterior
          </Button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Configurações Financeiras</h1>
            <p className="text-muted-foreground">
              Configure suas informações bancárias e PIX
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Etapa 3 de 4</span>
            <span>75% concluído</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Dados Bancários */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Dados Bancários
              </CardTitle>
              <CardDescription>
                Informe seus dados bancários para recebimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Banco */}
              <div className="space-y-2">
                <Label htmlFor="banco">Banco *</Label>
                <Select value={formData.banco} onValueChange={(value) => handleInputChange('banco', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {bancos.map((banco) => (
                      <SelectItem key={banco.value} value={banco.value}>
                        {banco.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Agência e Conta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agencia">Agência *</Label>
                  <Input
                    id="agencia"
                    placeholder="0000"
                    value={formData.agencia}
                    onChange={(e) => handleInputChange('agencia', formatAgencia(e.target.value))}
                    maxLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conta">Conta *</Label>
                  <Input
                    id="conta"
                    placeholder="00000-0"
                    value={formData.conta}
                    onChange={(e) => handleInputChange('conta', formatConta(e.target.value))}
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Tipo de Conta */}
              <div className="space-y-2">
                <Label htmlFor="tipoConta">Tipo de Conta *</Label>
                <Select value={formData.tipoConta} onValueChange={(value) => handleInputChange('tipoConta', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Conta Corrente</SelectItem>
                    <SelectItem value="poupanca">Conta Poupança</SelectItem>
                    <SelectItem value="pagamento">Conta de Pagamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Chaves PIX */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Chaves PIX Disponíveis
              </CardTitle>
              <CardDescription>
                Suas chaves PIX cadastradas no EfiPay
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pixKeys.length > 0 ? (
                <div className="space-y-3">
                  {pixKeys.map((key, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{key.chave}</div>
                        <div className="text-sm text-muted-foreground">
                          Tipo: {key.tipoChave} • Status: {key.status}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(key.chave, key.chave)}
                      >
                        {copiedKey === key.chave ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nenhuma chave PIX encontrada
                  </p>
                  <p className="text-sm text-muted-foreground">
                    As chaves PIX serão criadas automaticamente após a verificação
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between pt-6">
            <Button 
              variant="outline" 
              onClick={() => router.push('/onboarding/dados-empresa')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Etapa Anterior
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Salvando...' : (
                <>
                  Próxima Etapa
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
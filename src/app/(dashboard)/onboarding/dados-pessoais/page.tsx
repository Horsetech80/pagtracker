'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Phone, FileText, ArrowLeft, ArrowRight } from 'lucide-react';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { useTenantId } from '@/lib/hooks/useTenantId';

export default function DadosPessoaisPage() {
  const router = useRouter();
  const tenantId = useTenantId();
  const { onboardingStatus, completeStep } = useOnboarding();
  
  const [formData, setFormData] = useState({
    cpf: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: ''
  });
  
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const validateForm = () => {
    if (!formData.cpf || formData.cpf.length < 14) {
      toast.error('CPF é obrigatório e deve estar completo');
      return false;
    }
    if (!formData.telefone || formData.telefone.length < 14) {
      toast.error('Telefone é obrigatório e deve estar completo');
      return false;
    }
    if (!formData.endereco.trim()) {
      toast.error('Endereço é obrigatório');
      return false;
    }
    if (!formData.cidade.trim()) {
      toast.error('Cidade é obrigatória');
      return false;
    }
    if (!formData.estado.trim()) {
      toast.error('Estado é obrigatório');
      return false;
    }
    if (!formData.cep || formData.cep.length < 9) {
      toast.error('CEP é obrigatório e deve estar completo');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Salvar dados pessoais via API
      const response = await fetch('/api/onboarding/personal-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, tenantId })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar dados pessoais');
      }

      // Marcar etapa como concluída
      await completeStep('personal-data');
      
      toast.success('Dados pessoais salvos com sucesso!');
      router.push('/onboarding/dados-empresa');
    } catch (error) {
      console.error('Erro ao salvar dados pessoais:', error);
      toast.error('Erro ao salvar dados pessoais. Tente novamente.');
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
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Dados Pessoais</h1>
            <p className="text-muted-foreground">
              Complete suas informações pessoais para continuar
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Etapa 1 de 4</span>
            <span>25% concluído</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: '25%' }}></div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Preencha seus dados pessoais para verificação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CPF */}
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                maxLength={14}
              />
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', formatPhone(e.target.value))}
                maxLength={15}
              />
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                placeholder="Rua, número, complemento"
                value={formData.endereco}
                onChange={(e) => handleInputChange('endereco', e.target.value)}
              />
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  placeholder="Sua cidade"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado *</Label>
                <Input
                  id="estado"
                  placeholder="UF"
                  value={formData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value.toUpperCase())}
                  maxLength={2}
                />
              </div>
            </div>

            {/* CEP */}
            <div className="space-y-2">
              <Label htmlFor="cep">CEP *</Label>
              <Input
                id="cep"
                placeholder="00000-000"
                value={formData.cep}
                onChange={(e) => handleInputChange('cep', formatCEP(e.target.value))}
                maxLength={9}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-6">
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
              >
                Cancelar
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
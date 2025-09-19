'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2, FileText, ArrowLeft, ArrowRight } from 'lucide-react';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { useTenantId } from '@/lib/hooks/useTenantId';

export default function DadosEmpresaPage() {
  const router = useRouter();
  const tenantId = useTenantId();
  const { onboardingStatus, completeStep } = useOnboarding();
  
  const [formData, setFormData] = useState({
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    inscricaoEstadual: '',
    inscricaoMunicipal: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    tipoEmpresa: ''
  });
  
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const validateForm = () => {
    if (!formData.cnpj || formData.cnpj.length < 18) {
      toast.error('CNPJ é obrigatório e deve estar completo');
      return false;
    }
    if (!formData.razaoSocial.trim()) {
      toast.error('Razão Social é obrigatória');
      return false;
    }
    if (!formData.nomeFantasia.trim()) {
      toast.error('Nome Fantasia é obrigatório');
      return false;
    }
    if (!formData.endereco.trim()) {
      toast.error('Endereço é obrigatório');
      return false;
    }
    if (!formData.numero.trim()) {
      toast.error('Número é obrigatório');
      return false;
    }
    if (!formData.bairro.trim()) {
      toast.error('Bairro é obrigatório');
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
    if (!formData.tipoEmpresa) {
      toast.error('Tipo de empresa é obrigatório');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Salvar dados da empresa via API
      const response = await fetch('/api/onboarding/company-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, tenantId })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar dados da empresa');
      }

      // Marcar etapa como concluída
      await completeStep('company-data');
      
      toast.success('Dados da empresa salvos com sucesso!');
      router.push('/onboarding/configuracoes-financeiras');
    } catch (error) {
      console.error('Erro ao salvar dados da empresa:', error);
      toast.error('Erro ao salvar dados da empresa. Tente novamente.');
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
            onClick={() => router.push('/onboarding/dados-pessoais')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Etapa Anterior
          </Button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Dados da Empresa</h1>
            <p className="text-muted-foreground">
              Informe os dados da sua empresa para continuar
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Etapa 2 de 4</span>
            <span>50% concluído</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: '50%' }}></div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Informações da Empresa
            </CardTitle>
            <CardDescription>
              Preencha os dados da sua empresa para verificação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CNPJ */}
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={(e) => handleInputChange('cnpj', formatCNPJ(e.target.value))}
                maxLength={18}
              />
            </div>

            {/* Razão Social */}
            <div className="space-y-2">
              <Label htmlFor="razaoSocial">Razão Social *</Label>
              <Input
                id="razaoSocial"
                placeholder="Razão social da empresa"
                value={formData.razaoSocial}
                onChange={(e) => handleInputChange('razaoSocial', e.target.value)}
              />
            </div>

            {/* Nome Fantasia */}
            <div className="space-y-2">
              <Label htmlFor="nomeFantasia">Nome Fantasia *</Label>
              <Input
                id="nomeFantasia"
                placeholder="Nome fantasia da empresa"
                value={formData.nomeFantasia}
                onChange={(e) => handleInputChange('nomeFantasia', e.target.value)}
              />
            </div>

            {/* Tipo de Empresa */}
            <div className="space-y-2">
              <Label htmlFor="tipoEmpresa">Tipo de Empresa *</Label>
              <Select value={formData.tipoEmpresa} onValueChange={(value) => handleInputChange('tipoEmpresa', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mei">MEI - Microempreendedor Individual</SelectItem>
                  <SelectItem value="me">ME - Microempresa</SelectItem>
                  <SelectItem value="epp">EPP - Empresa de Pequeno Porte</SelectItem>
                  <SelectItem value="ltda">LTDA - Sociedade Limitada</SelectItem>
                  <SelectItem value="sa">SA - Sociedade Anônima</SelectItem>
                  <SelectItem value="eireli">EIRELI - Empresa Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Inscrições */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                <Input
                  id="inscricaoEstadual"
                  placeholder="Opcional"
                  value={formData.inscricaoEstadual}
                  onChange={(e) => handleInputChange('inscricaoEstadual', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inscricaoMunicipal">Inscrição Municipal</Label>
                <Input
                  id="inscricaoMunicipal"
                  placeholder="Opcional"
                  value={formData.inscricaoMunicipal}
                  onChange={(e) => handleInputChange('inscricaoMunicipal', e.target.value)}
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                placeholder="Rua, avenida, etc."
                value={formData.endereco}
                onChange={(e) => handleInputChange('endereco', e.target.value)}
              />
            </div>

            {/* Número e Complemento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero">Número *</Label>
                <Input
                  id="numero"
                  placeholder="123"
                  value={formData.numero}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  placeholder="Sala, andar, etc."
                  value={formData.complemento}
                  onChange={(e) => handleInputChange('complemento', e.target.value)}
                />
              </div>
            </div>

            {/* Bairro */}
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro *</Label>
              <Input
                id="bairro"
                placeholder="Nome do bairro"
                value={formData.bairro}
                onChange={(e) => handleInputChange('bairro', e.target.value)}
              />
            </div>

            {/* Cidade, Estado e CEP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-6">
              <Button 
                variant="outline" 
                onClick={() => router.push('/onboarding/dados-pessoais')}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
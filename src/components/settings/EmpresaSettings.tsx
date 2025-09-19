'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Save,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useTenantId } from '@/lib/hooks/useTenantId';
import { toast } from 'sonner';

interface EmpresaData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  tipoEmpresa: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  website: string;
}

const tiposEmpresa = [
  { value: 'mei', label: 'MEI - Microempreendedor Individual' },
  { value: 'me', label: 'ME - Microempresa' },
  { value: 'epp', label: 'EPP - Empresa de Pequeno Porte' },
  { value: 'ltda', label: 'LTDA - Sociedade Limitada' },
  { value: 'sa', label: 'SA - Sociedade Anônima' },
  { value: 'eireli', label: 'EIRELI - Empresa Individual' }
];

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function EmpresaSettings() {
  const { tenantId, isLoading: tenantLoading } = useTenantId();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  // Debug
  console.log('EmpresaSettings - tenantId:', tenantId, 'tenantLoading:', tenantLoading);
  
  const [formData, setFormData] = useState<EmpresaData>({
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    inscricaoEstadual: '',
    inscricaoMunicipal: '',
    tipoEmpresa: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    email: '',
    website: ''
  });

  // Carregar dados da empresa
  useEffect(() => {
    const loadEmpresaData = async () => {
      if (!tenantId) return;
      
      setLoading(true);
      try {
        // Simular carregamento de dados
        // TODO: Implementar chamada real para API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Dados de exemplo
        setFormData({
          cnpj: '12.345.678/0001-90',
          razaoSocial: 'Empresa Exemplo LTDA',
          nomeFantasia: 'Empresa Exemplo',
          inscricaoEstadual: '123456789',
          inscricaoMunicipal: '987654321',
          tipoEmpresa: 'ltda',
          endereco: 'Rua das Empresas, 123',
          numero: '123',
          complemento: 'Sala 456',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567',
          telefone: '(11) 99999-9999',
          email: 'contato@empresa.com',
          website: 'https://empresa.com'
        });
        setIsVerified(true);
      } catch (error) {
        console.error('Erro ao carregar dados da empresa:', error);
        toast.error('Erro ao carregar dados da empresa');
      } finally {
        setLoading(false);
      }
    };

    loadEmpresaData();
  }, [tenantId]);

  const handleInputChange = (field: keyof EmpresaData, value: string) => {
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

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Implementar salvamento real
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Dados da empresa salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      toast.error('Erro ao salvar dados da empresa');
    } finally {
      setSaving(false);
    }
  };

  if (loading || tenantLoading) {
    return (
      <div className="max-w-[80%] mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[80%] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Informações da Empresa
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie os dados e informações da sua empresa
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isVerified ? (
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Verificada
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              Pendente
            </Badge>
          )}
        </div>
      </div>

      {/* Dados Básicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dados Básicos
          </CardTitle>
          <CardDescription>
            Informações principais da empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => handleInputChange('cnpj', formatCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipoEmpresa">Tipo de Empresa *</Label>
              <Select value={formData.tipoEmpresa} onValueChange={(value) => handleInputChange('tipoEmpresa', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposEmpresa.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="razaoSocial">Razão Social *</Label>
            <Input
              id="razaoSocial"
              value={formData.razaoSocial}
              onChange={(e) => handleInputChange('razaoSocial', e.target.value)}
              placeholder="Razão social da empresa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nomeFantasia">Nome Fantasia *</Label>
            <Input
              id="nomeFantasia"
              value={formData.nomeFantasia}
              onChange={(e) => handleInputChange('nomeFantasia', e.target.value)}
              placeholder="Nome fantasia da empresa"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
              <Input
                id="inscricaoEstadual"
                value={formData.inscricaoEstadual}
                onChange={(e) => handleInputChange('inscricaoEstadual', e.target.value)}
                placeholder="123456789"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inscricaoMunicipal">Inscrição Municipal</Label>
              <Input
                id="inscricaoMunicipal"
                value={formData.inscricaoMunicipal}
                onChange={(e) => handleInputChange('inscricaoMunicipal', e.target.value)}
                placeholder="987654321"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereço
          </CardTitle>
          <CardDescription>
            Endereço da sede da empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => handleInputChange('endereco', e.target.value)}
                placeholder="Rua, Avenida, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numero">Número *</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                placeholder="123"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={formData.complemento}
                onChange={(e) => handleInputChange('complemento', e.target.value)}
                placeholder="Sala, Andar, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro *</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => handleInputChange('bairro', e.target.value)}
                placeholder="Nome do bairro"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => handleInputChange('cidade', e.target.value)}
                placeholder="Nome da cidade"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estado">Estado *</Label>
              <Select value={formData.estado} onValueChange={(value) => handleInputChange('estado', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {estados.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cep">CEP *</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => handleInputChange('cep', formatCEP(e.target.value))}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Informações de Contato
          </CardTitle>
          <CardDescription>
            Dados de contato da empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contato@empresa.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://www.empresa.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="min-w-[120px]"
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Salvando...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Salvar
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
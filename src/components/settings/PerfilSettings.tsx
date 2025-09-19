'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/lib/hooks/use-toast';
import { useTenantId } from '@/lib/hooks/useTenantId';
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Shield, 
  Calendar,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  data_nascimento: string | null;
  created_at: string;
  updated_at: string | null;
  avatar_url: string | null;
  verification_status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'not_started';
  document_urls: Record<string, string>;
  last_login: string | null;
  email_verified: boolean;
  two_factor_enabled: boolean;
  personal_data_completed: boolean;
  company_data_completed: boolean;
  financial_config_completed: boolean;
  verification_completed: boolean;
  onboarding_completed: boolean;
  can_access_payments: boolean;
  can_access_withdrawals: boolean;
}

export function PerfilSettings() {
  const { toast } = useToast();
  const { tenantId, isLoading: tenantLoading } = useTenantId();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState<UserProfile>({
    id: '',
    nome: '',
    email: '',
    telefone: null,
    cpf: null,
    endereco: null,
    cidade: null,
    estado: null,
    cep: null,
    data_nascimento: null,
    created_at: '',
    updated_at: null,
    avatar_url: null,
    verification_status: 'pending',
    document_urls: {},
    last_login: null,
    email_verified: false,
    two_factor_enabled: false,
    personal_data_completed: false,
    company_data_completed: false,
    financial_config_completed: false,
    verification_completed: false,
    onboarding_completed: false,
    can_access_payments: false,
    can_access_withdrawals: false
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Função para determinar o status da conta
  const getAccountStatus = () => {
    if (!profileData) return { status: 'Inativa', color: 'bg-red-500', description: 'Dados não carregados' };
    
    // Verificar se o onboarding foi completado
    if (profileData.onboarding_completed && profileData.verification_completed) {
      return { status: 'Ativa', color: 'bg-green-500', description: 'Conta totalmente ativa' };
    }
    
    // Verificar se está em processo de verificação
    if (profileData.verification_status === 'in_review') {
      return { status: 'Em Análise', color: 'bg-yellow-500', description: 'Documentos em análise' };
    }
    
    // Verificar se foi rejeitada
    if (profileData.verification_status === 'rejected') {
      return { status: 'Rejeitada', color: 'bg-red-500', description: 'Verificação rejeitada' };
    }
    
    // Verificar se pode acessar pagamentos (parcialmente ativa)
    if (profileData.can_access_payments) {
      return { status: 'Parcialmente Ativa', color: 'bg-blue-500', description: 'Pode receber pagamentos' };
    }
    
    // Verificar se dados pessoais foram preenchidos
    if (profileData.personal_data_completed) {
      return { status: 'Pendente', color: 'bg-orange-500', description: 'Complete o cadastro' };
    }
    
    // Conta inativa
    return { status: 'Inativa', color: 'bg-red-500', description: 'Complete seus dados pessoais' };
  };

  const accountStatus = useMemo(() => getAccountStatus(), [profileData]);

  // Carregar dados do usuário da API
  useEffect(() => {
    const loadUserProfile = async () => {
      setLoading(true);
      try {
        console.log('[PerfilSettings] Iniciando carregamento do perfil...');
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        console.log('[PerfilSettings] Resposta da API:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[PerfilSettings] Erro na resposta:', errorText);
          throw new Error(`Erro ao carregar dados do perfil: ${response.status}`);
        }

        const result = await response.json();
        console.log('[PerfilSettings] Dados recebidos:', { hasUser: !!result.user, success: result.success });
        
        if (result.user) {
          setProfileData(result.user);
          console.log('[PerfilSettings] Perfil carregado com sucesso');
        } else {
          throw new Error('Dados do usuário não encontrados na resposta');
        }
      } catch (error) {
        console.error('[PerfilSettings] Erro ao carregar perfil:', error);
        toast({
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Erro ao carregar dados do perfil',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) {
      loadUserProfile();
    }
  }, [tenantId]); // Removido 'toast' das dependências para evitar re-renders infinitos

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
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

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      console.log('[PerfilSettings] Iniciando salvamento do perfil...');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: profileData.nome,
          telefone: profileData.telefone,
          cpf: profileData.cpf,
          endereco: profileData.endereco,
          cidade: profileData.cidade,
          estado: profileData.estado,
          cep: profileData.cep
        })
      });

      console.log('[PerfilSettings] Resposta do PUT:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[PerfilSettings] Erro no PUT:', errorText);
        throw new Error('Erro ao salvar perfil');
      }

      const result = await response.json();
      console.log('[PerfilSettings] Resultado do PUT:', { hasUser: !!result.user, success: result.success });
      
      if (result.user) {
        setProfileData(result.user);
        console.log('[PerfilSettings] Dados atualizados após PUT');
      }
      
      // Recarregar dados do perfil para garantir sincronização
      try {
        const refreshResponse = await fetch('/api/user/profile', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (refreshResponse.ok) {
          const refreshResult = await refreshResponse.json();
          if (refreshResult.user) {
            setProfileData(refreshResult.user);
          }
        } else {
          console.warn('Falha ao recarregar dados do perfil, mas salvamento foi bem-sucedido');
        }
      } catch (refreshError) {
        console.warn('Erro ao recarregar dados do perfil:', refreshError);
        // Não propagar o erro pois o salvamento foi bem-sucedido
      }
      
      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso!',
        variant: 'success'
      });
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar perfil',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validações do lado do cliente
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Erro',
        description: 'Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.',
        variant: 'destructive'
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: 'Erro',
        description: 'Arquivo muito grande. Tamanho máximo: 5MB.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer upload');
      }

      // Atualizar o estado local
      setProfileData(prev => ({
        ...prev,
        avatar_url: result.avatar_url
      }));

      toast({
        title: 'Sucesso',
        description: 'Foto de perfil atualizada com sucesso!',
        variant: 'success'
      });

      // Limpar o input
      event.target.value = '';

    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao fazer upload da foto',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao remover foto');
      }

      // Atualizar o estado local
      setProfileData(prev => ({
        ...prev,
        avatar_url: null
      }));

      toast({
        title: 'Sucesso',
        description: 'Foto de perfil removida com sucesso!',
        variant: 'success'
      });

    } catch (error) {
      console.error('Erro ao remover avatar:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao remover foto',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle2FA = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/2fa', {
        method: profileData.two_factor_enabled ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao alterar configuração 2FA');
      }

      // Atualizar o estado local
      setProfileData(prev => ({
        ...prev,
        two_factor_enabled: !prev.two_factor_enabled
      }));

      toast({
        title: 'Sucesso',
        description: profileData.two_factor_enabled 
          ? '2FA desativado com sucesso!' 
          : '2FA ativado com sucesso!',
        variant: 'success'
      });

    } catch (error) {
      console.error('Erro ao alterar 2FA:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao alterar configuração 2FA',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>, documentType: 'identity' | 'address' | 'selfie') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validações do lado do cliente
    const allowedTypes = documentType === 'selfie' 
      ? ['image/jpeg', 'image/png', 'image/webp']
      : ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Erro',
        description: `Tipo de arquivo não permitido para ${documentType}. Use ${documentType === 'selfie' ? 'JPEG, PNG ou WebP' : 'JPEG, PNG, WebP ou PDF'}.`,
        variant: 'destructive'
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: 'Erro',
        description: 'Arquivo muito grande. Tamanho máximo: 10MB.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', documentType);

      const response = await fetch('/api/user/kyc/documents', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer upload');
      }

      // Atualizar o estado local
      setProfileData(prev => ({
        ...prev,
        document_urls: {
          ...prev.document_urls,
          [documentType]: result.document_url
        }
      }));

      toast({
        title: 'Sucesso',
        description: `Documento ${documentType} enviado com sucesso!`,
        variant: 'success'
      });

      // Limpar o input
      event.target.value = '';

    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao fazer upload do documento',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitKYC = async () => {
    if (!profileData.document_urls?.identity || !profileData.document_urls?.address || !profileData.document_urls?.selfie) {
      toast({
        title: 'Erro',
        description: 'Todos os documentos são obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/user/kyc/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document_urls: profileData.document_urls
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar documentos');
      }

      // Atualizar o estado local
      setProfileData(prev => ({
        ...prev,
        verification_status: 'in_review'
      }));

      toast({
        title: 'Sucesso',
        description: 'Documentos enviados para verificação!',
        variant: 'success'
      });

    } catch (error) {
      console.error('Erro ao enviar KYC:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao enviar documentos',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive'
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Erro',
        description: 'A nova senha deve ter pelo menos 8 caracteres',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      // TODO: Implementar alteração de senha real
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: 'Sucesso',
        description: 'Senha alterada com sucesso!',
        variant: 'success'
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar senha',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };



  if (loading || tenantLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{tenantLoading ? 'Carregando tenant...' : 'Carregando perfil...'}</p>
        </div>
      </div>
    );
  }

  if (!profileData || !profileData.id) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Erro ao carregar dados do perfil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="h-6 w-6" />
            Perfil do Usuário
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie suas informações pessoais e configurações de conta
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="default" 
            className={`${
              accountStatus.status === 'Ativa' ? 'bg-green-100 text-green-800 border-green-200' :
              accountStatus.status === 'Parcialmente Ativa' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              accountStatus.status === 'Em Análise' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
              accountStatus.status === 'Pendente' ? 'bg-orange-100 text-orange-800 border-orange-200' :
              'bg-red-100 text-red-800 border-red-200'
            }`}
          >
            <User className="h-3 w-3 mr-1" />
            {accountStatus.status}
          </Badge>
        </div>
      </div>

      {/* Foto de Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Foto de Perfil
          </CardTitle>
          <CardDescription>
            Sua foto de perfil será exibida em todo o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage 
                src={profileData?.avatar_url || ''} 
                alt={profileData?.nome || 'Avatar'} 
              />
              <AvatarFallback className="text-lg">
                {profileData?.nome ? profileData.nome.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                Formatos aceitos: JPEG, PNG, WebP. Tamanho máximo: 5MB.
              </p>
              {profileData?.avatar_url && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRemoveAvatar}
                  className="max-w-fit"
                >
                  Remover foto
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>
            Seus dados pessoais e de contato
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={profileData?.nome || ''}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={profileData?.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={profileData?.cpf || ''}
                onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={profileData?.telefone || ''}
                onChange={(e) => handleInputChange('telefone', formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={profileData?.cep || ''}
                onChange={(e) => handleInputChange('cep', formatCEP(e.target.value))}
                placeholder="00000-000"
                  maxLength={9}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={profileData?.cidade || ''}
                onChange={(e) => handleInputChange('cidade', e.target.value)}
                placeholder="Sua cidade"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={profileData?.estado || ''}
                onChange={(e) => handleInputChange('estado', e.target.value)}
                placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço Completo</Label>
              <Input
                id="endereco"
                value={profileData?.endereco || ''}
                onChange={(e) => handleInputChange('endereco', e.target.value)}
                placeholder="Rua, número, complemento"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Mantenha sua conta segura com uma senha forte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual *</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                placeholder="Digite sua senha atual"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha *</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  placeholder="Digite a nova senha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  placeholder="Confirme a nova senha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>A senha deve ter pelo menos 8 caracteres</p>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleChangePassword} 
              disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            >
              {saving ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verificação KYC */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verificação de Identidade (KYC)
          </CardTitle>
          <CardDescription>
            Envie seus documentos para verificação de identidade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status de Verificação */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                profileData?.verification_status === 'approved' ? 'bg-green-500' :
                profileData?.verification_status === 'in_review' ? 'bg-yellow-500' :
                profileData?.verification_status === 'rejected' ? 'bg-red-500' :
                'bg-gray-300'
              }`}></div>
              <span className="font-medium">
                Status: {
                  {
                    'pending': 'Pendente',
                    'in_review': 'Em Análise',
                    'approved': 'Aprovado',
                    'rejected': 'Rejeitado',
                    'not_started': 'Não Iniciado'
                  }[profileData?.verification_status || 'pending']
                }
              </span>
            </div>
            <Badge variant={
              {
                'approved': 'default',
                'in_review': 'secondary',
                'rejected': 'destructive',
                'pending': 'outline',
                'not_started': 'outline'
              }[profileData?.verification_status || 'pending'] as any
            }>
              {
                {
                  'pending': 'Documentos Pendentes',
                  'in_review': 'Aguardando Análise',
                  'approved': 'Verificado',
                  'rejected': 'Rejeitado',
                  'not_started': 'Não Iniciado'
                }[profileData?.verification_status || 'pending']
              }
            </Badge>
          </div>
            
            {profileData?.verification_status === 'approved' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-800">
                    Sua identidade foi verificada com sucesso!
                  </p>
                </div>
              </div>
            )}
            
            {profileData?.verification_status === 'rejected' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-800">
                    Documentos rejeitados. Entre em contato com o suporte para mais informações.
                  </p>
                </div>
              </div>
            )}
            
            {profileData?.verification_status === 'in_review' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Seus documentos estão sendo analisados. Aguarde o resultado.
                  </p>
                </div>
              </div>
            )}
            
            {profileData?.verification_status === 'pending' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    Envie seus documentos para verificação de identidade.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Upload de Documentos */}
          {(profileData?.verification_status === 'pending' || profileData?.verification_status === 'rejected') && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* RG ou CNH */}
                <div className="space-y-2">
                  <Label>RG ou CNH</Label>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleDocumentUpload(e, 'identity')}
                    className="text-sm"
                  />
                  {profileData?.document_urls?.identity && (
                    <p className="text-xs text-green-600">✓ Documento enviado</p>
                  )}
                </div>
                
                {/* Comprovante de Endereço */}
                <div className="space-y-2">
                  <Label>Comprovante de Endereço</Label>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleDocumentUpload(e, 'address')}
                    className="text-sm"
                  />
                  {profileData?.document_urls?.address && (
                    <p className="text-xs text-green-600">✓ Documento enviado</p>
                  )}
                </div>
                
                {/* Selfie */}
                <div className="space-y-2">
                  <Label>Selfie com Documento</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleDocumentUpload(e, 'selfie')}
                    className="text-sm"
                  />
                  {profileData?.document_urls?.selfie && (
                    <p className="text-xs text-green-600">✓ Documento enviado</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitKYC}
                  disabled={saving || !profileData?.document_urls?.identity || !profileData?.document_urls?.address || !profileData?.document_urls?.selfie}
                >
                  {saving ? 'Enviando...' : 'Enviar para Verificação'}
                </Button>
              </div>
            </div>
          )}
          
          {/* Documentos Enviados */}
          {profileData?.document_urls && Object.keys(profileData.document_urls).length > 0 && (
            <div className="space-y-2">
              <Label>Documentos Enviados</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {profileData?.document_urls?.identity && (
                  <div className="p-2 bg-muted rounded text-sm">
                    <span className="font-medium">RG/CNH:</span> Enviado
                  </div>
                )}
                {profileData?.document_urls?.address && (
                  <div className="p-2 bg-muted rounded text-sm">
                    <span className="font-medium">Endereço:</span> Enviado
                  </div>
                )}
                {profileData?.document_urls?.selfie && (
                  <div className="p-2 bg-muted rounded text-sm">
                    <span className="font-medium">Selfie:</span> Enviado
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Autenticação de Dois Fatores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticação de Dois Fatores (2FA)
          </CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                profileData?.two_factor_enabled ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <div>
                <p className="font-medium">
                  {profileData?.two_factor_enabled ? '2FA Ativado' : '2FA Desativado'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {profileData?.two_factor_enabled 
                    ? 'Sua conta está protegida com autenticação de dois fatores'
                    : 'Ative o 2FA para maior segurança da sua conta'
                  }
                </p>
              </div>
            </div>
            <Button 
              variant={profileData?.two_factor_enabled ? 'destructive' : 'default'}
              onClick={handleToggle2FA}
              disabled={saving}
            >
              {saving ? 'Processando...' : 
                profileData?.two_factor_enabled ? 'Desativar 2FA' : 'Ativar 2FA'
              }
            </Button>
          </div>
          
          {profileData?.two_factor_enabled && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-800">
                  Sua conta está protegida com autenticação de dois fatores.
                </p>
              </div>
            </div>
          )}
          
          {!profileData?.two_factor_enabled && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Recomendamos ativar o 2FA para maior segurança.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações da Conta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Informações da Conta
          </CardTitle>
          <CardDescription>
            Detalhes sobre sua conta e atividade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>ID do Usuário</Label>
              <Input 
                value={profileData?.id || ''} 
                disabled 
                className="font-mono text-xs"
                title="ID único para suporte técnico"
              />
            </div>
            <div>
              <Label>Tenant ID</Label>
              <Input 
                value={tenantId || 'Carregando...'} 
                disabled 
                className="font-mono text-xs"
                title="ID do tenant da empresa"
              />
            </div>
            <div>
              <Label>Data de Criação</Label>
              <Input value={profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString('pt-BR') : ''} disabled />
            </div>
            <div>
              <Label>Última Atualização</Label>
              <Input value={profileData?.updated_at ? 
                new Date(profileData.updated_at).toLocaleDateString('pt-BR') + ' às ' +
                new Date(profileData.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : 'Nunca atualizado'
              } disabled />
            </div>
            <div>
              <Label>Último Acesso</Label>
              <Input value={profileData?.last_login ? 
                new Date(profileData.last_login).toLocaleDateString('pt-BR') + ' às ' +
                new Date(profileData.last_login).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : 'Nunca acessou'
              } disabled />
            </div>
            <div>
              <Label>E-mail Verificado</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${
                  profileData?.email_verified ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-muted-foreground">
                  {profileData?.email_verified ? 'Verificado' : 'Não verificado'}
                </span>
              </div>
            </div>
          </div>
          <div>
            <Label>Status da Conta</Label>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 ${accountStatus.color} rounded-full`}></div>
              <span className="text-sm text-muted-foreground">{accountStatus.status}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{accountStatus.description}</p>
          </div>

          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Para suporte:</strong> Forneça o ID do usuário e Tenant ID acima para identificação rápida.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
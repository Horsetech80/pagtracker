'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, Clock, AlertCircle, FileText, ArrowLeft, ArrowRight, RefreshCw, Upload } from 'lucide-react';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { useTenantId } from '@/lib/hooks/useTenantId';
import { DocumentUpload, DocumentFile } from '@/components/kyc/DocumentUpload';

interface VerificationItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'verified' | 'rejected';
  required: boolean;
}

export default function VerificacaoPage() {
  const router = useRouter();
  const tenantId = useTenantId();
  const { onboardingStatus, completeStep } = useOnboarding();
  
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [verificationItems, setVerificationItems] = useState<VerificationItem[]>([
    {
      id: 'personal-data',
      title: 'Dados Pessoais',
      description: 'CPF, telefone e endereço verificados',
      status: 'pending',
      required: true
    },
    {
      id: 'company-data',
      title: 'Dados da Empresa',
      description: 'CNPJ e informações empresariais verificadas',
      status: 'pending',
      required: true
    },
    {
      id: 'financial-config',
      title: 'Configurações Financeiras',
      description: 'Dados bancários e PIX configurados',
      status: 'pending',
      required: true
    },
    {
      id: 'documents',
      title: 'Documentos',
      description: 'Documentos de identificação e comprovantes',
      status: 'pending',
      required: true
    },
    {
      id: 'compliance',
      title: 'Conformidade',
      description: 'Verificação de compliance e KYC',
      status: 'pending',
      required: true
    }
  ]);

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      const response = await fetch(`/api/onboarding/verification-status?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setVerificationItems(prev => 
          prev.map(item => ({
            ...item,
            status: data[item.id] || 'pending'
          }))
        );
        
        // Carregar documentos existentes se houver
        if (data.documents) {
          setDocuments(data.documents);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar status de verificação:', error);
    }
  };

  const handleDocumentsChange = (newDocuments: DocumentFile[]) => {
    setDocuments(newDocuments);
    
    // Atualizar status do item 'documents' baseado nos documentos enviados
    const hasRequiredDocuments = newDocuments.some(doc => 
      ['uploaded', 'pending_review', 'approved'].includes(doc.status)
    );
    
    setVerificationItems(prev => 
      prev.map(item => 
        item.id === 'documents' 
          ? { ...item, status: hasRequiredDocuments ? 'verified' : 'pending' }
          : item
      )
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Verificado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const allVerified = verificationItems.every(item => item.status === 'verified');
  const hasRejected = verificationItems.some(item => item.status === 'rejected');
  const verifiedCount = verificationItems.filter(item => item.status === 'verified').length;
  const totalCount = verificationItems.length;

  const handleSubmitForVerification = async () => {
    setLoading(true);
    try {
      // Verificar se todos os documentos obrigatórios foram enviados
      const requiredDocuments = ['rg', 'comprovante_endereco'];
      const uploadedDocuments = documents.filter(doc => 
        ['uploaded', 'pending_review', 'approved'].includes(doc.status)
      );
      
      const hasAllRequiredDocs = requiredDocuments.every(type => 
        uploadedDocuments.some(doc => doc.type === type)
      );
      
      if (!hasAllRequiredDocs) {
        toast.error('Por favor, envie todos os documentos obrigatórios antes de continuar.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/onboarding/submit-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tenantId,
          documents: documents.map(doc => ({
            id: doc.id,
            type: doc.type,
            url: doc.url,
            status: doc.status
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar para verificação');
      }

      toast.success('Dados e documentos enviados para verificação!');
      loadVerificationStatus();
    } catch (error) {
      console.error('Erro ao enviar para verificação:', error);
      toast.error('Erro ao enviar para verificação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    try {
      // Marcar etapa como concluída
      await completeStep('verification');
      
      toast.success('Onboarding concluído com sucesso!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro ao concluir onboarding:', error);
      toast.error('Erro ao concluir onboarding. Tente novamente.');
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
            onClick={() => router.push('/onboarding/configuracoes-financeiras')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Etapa Anterior
          </Button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Verificação</h1>
            <p className="text-muted-foreground">
              Aguarde a verificação dos seus dados
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Etapa 4 de 4</span>
            <span>100% concluído</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Status Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Status da Verificação</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadVerificationStatus}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </CardTitle>
            <CardDescription>
              {verifiedCount} de {totalCount} itens verificados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allVerified && (
                <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800 dark:text-green-200">
                      Todos os dados foram verificados com sucesso!
                    </span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Você pode agora acessar todas as funcionalidades da plataforma.
                  </p>
                </div>
              )}

              {hasRejected && (
                <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="font-medium text-red-800 dark:text-red-200">
                      Alguns dados foram rejeitados
                    </span>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Verifique os itens rejeitados e corrija as informações necessárias.
                  </p>
                </div>
              )}

              {!allVerified && !hasRejected && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">
                      Verificação em andamento
                    </span>
                  </div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    Nosso time está analisando seus dados. Isso pode levar até 24 horas.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Document Upload Section */}
        <DocumentUpload 
          onDocumentsChange={handleDocumentsChange}
          initialDocuments={documents}
          disabled={loading}
        />

        {/* Verification Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Itens de Verificação</CardTitle>
            <CardDescription>
              Status detalhado de cada item verificado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {verificationItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.description}</div>
                      {item.id === 'documents' && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {documents.filter(doc => ['uploaded', 'pending_review', 'approved'].includes(doc.status)).length} documento(s) enviado(s)
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(item.status)}
                    {item.required && (
                      <Badge variant="outline" className="text-xs">Obrigatório</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between pt-6">
          <Button 
            variant="outline" 
            onClick={() => router.push('/onboarding/configuracoes-financeiras')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Etapa Anterior
          </Button>
          
          {allVerified ? (
            <Button 
              onClick={handleCompleteOnboarding}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Finalizando...' : (
                <>
                  Finalizar Onboarding
                  <CheckCircle className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleSubmitForVerification}
              disabled={loading}
            >
              {loading ? 'Enviando...' : (
                <>
                  Enviar para Verificação
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
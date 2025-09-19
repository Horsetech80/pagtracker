'use client';

import { useState, useEffect } from 'react';
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from '@/components/admin/ui/card';
import { AdminButton } from '@/components/admin/ui/button';
import { AdminInput } from '@/components/admin/ui/input';
import { AdminBadge } from '@/components/admin/ui/badge';
import { AdminTable, AdminTableBody, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from '@/components/admin/ui/table';
import { AdminDialog, AdminDialogContent, AdminDialogDescription, AdminDialogFooter, AdminDialogHeader, AdminDialogTitle, AdminDialogTrigger } from '@/components/admin/ui/dialog';
import { AdminTextarea } from '@/components/admin/ui/textarea';
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  Building2,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Upload,
  AlertTriangle,
  User,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Check,
  X,
  MessageSquare
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface KYCDocument {
  id: string;
  type: 'rg' | 'cnh' | 'comprovante_endereco';
  url: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

interface KYCVerification {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantDocument: string;
  userId: string;
  userName: string;
  userEmail: string;
  userDocument: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'incomplete';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  riskScore?: number;
  documents: KYCDocument[];
  personalData: {
    fullName: string;
    cpf: string;
    phone: string;
    address?: string;
  };
  companyData?: {
    razaoSocial: string;
    cnpj: string;
    endereco: string;
  };
}

export default function KYCVerificationPage() {
  const [verifications, setVerifications] = useState<KYCVerification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<KYCVerification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState<KYCVerification | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Carregar verificações
  const loadVerifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/admin/kyc?${params}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar verificações');
      }
      
      const data = await response.json();
      setVerifications(data.verifications || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Erro ao carregar verificações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar verificações quando filtros mudarem
  useEffect(() => {
    loadVerifications();
  }, [statusFilter, priorityFilter, pagination.page]);

  useEffect(() => {
    let filtered = verifications;

    if (searchTerm) {
      filtered = filtered.filter(verification => 
        verification.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.userDocument.includes(searchTerm) ||
        verification.tenantName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredVerifications(filtered);
  }, [verifications, searchTerm]);

  const getStatusBadge = (status: KYCVerification['status']) => {
    switch (status) {
      case 'approved':
        return <AdminBadge variant="default" className="bg-green-100 text-green-800">Aprovado</AdminBadge>;
      case 'pending':
        return <AdminBadge variant="secondary">Pendente</AdminBadge>;
      case 'under_review':
        return <AdminBadge variant="outline" className="bg-blue-100 text-blue-800">Em Análise</AdminBadge>;
      case 'rejected':
        return <AdminBadge variant="destructive">Rejeitado</AdminBadge>;
      case 'incomplete':
        return <AdminBadge variant="outline" className="bg-orange-100 text-orange-800">Incompleto</AdminBadge>;
      default:
        return <AdminBadge variant="outline">-</AdminBadge>;
    }
  };

  const getPriorityBadge = (priority: KYCVerification['priority']) => {
    switch (priority) {
      case 'urgent':
        return <AdminBadge variant="destructive">Urgente</AdminBadge>;
      case 'high':
        return <AdminBadge variant="outline" className="bg-red-100 text-red-800">Alta</AdminBadge>;
      case 'medium':
        return <AdminBadge variant="outline" className="bg-yellow-100 text-yellow-800">Média</AdminBadge>;
      case 'low':
        return <AdminBadge variant="outline" className="bg-gray-100 text-gray-800">Baixa</AdminBadge>;
      default:
        return <AdminBadge variant="outline">-</AdminBadge>;
    }
  };

  const handleApproveVerification = async (id: string) => {
    try {
      setProcessingId(id);
      const response = await fetch(`/api/admin/kyc/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', notes: reviewNotes })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao aprovar verificação');
      }
      
      await loadVerifications();
      setIsReviewDialogOpen(false);
      setReviewNotes('');
    } catch (error) {
      console.error('Erro ao aprovar verificação:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectVerification = async (id: string) => {
    try {
      setProcessingId(id);
      const response = await fetch(`/api/admin/kyc/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', notes: reviewNotes })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao rejeitar verificação');
      }
      
      await loadVerifications();
      setIsReviewDialogOpen(false);
      setReviewNotes('');
    } catch (error) {
      console.error('Erro ao rejeitar verificação:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const openReviewDialog = (verification: KYCVerification) => {
    setSelectedVerification(verification);
    setReviewNotes(verification.notes || '');
    setIsReviewDialogOpen(true);
  };

  return (
    <div className="container-responsive space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Verificação KYC</h2>
          <p className="text-muted-foreground">
            Gerencie e aprove verificações de identidade dos clientes
          </p>
        </div>
        <AdminButton variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </AdminButton>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AdminCardTitle className="text-sm font-medium">Pendentes</AdminCardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-bold">
              {verifications.filter(v => v.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando análise
            </p>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AdminCardTitle className="text-sm font-medium">Em Análise</AdminCardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-bold">
              {verifications.filter(v => v.status === 'under_review').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Sendo revisadas
            </p>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AdminCardTitle className="text-sm font-medium">Aprovados</AdminCardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-bold">
              {verifications.filter(v => v.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Verificações aprovadas
            </p>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AdminCardTitle className="text-sm font-medium">Rejeitados</AdminCardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-bold">
              {verifications.filter(v => v.status === 'rejected').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Necessitam correção
            </p>
          </AdminCardContent>
        </AdminCard>
      </div>

      {/* Filtros */}
      <AdminCard>
        <AdminCardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <AdminInput
                placeholder="Buscar por nome, email, CPF ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="under_review">Em análise</option>
                <option value="approved">Aprovado</option>
                <option value="rejected">Rejeitado</option>
                <option value="incomplete">Incompleto</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">Todas as prioridades</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </div>
          </div>
        </AdminCardContent>
      </AdminCard>

      {/* Tabela */}
      <AdminCard>
        <AdminCardHeader>
          <div className="flex items-center justify-between">
            <AdminCardTitle>Verificações KYC</AdminCardTitle>
            <p className="text-sm text-muted-foreground">
              {filteredVerifications.length} de {verifications.length} verificações
            </p>
          </div>
        </AdminCardHeader>
        <AdminCardContent>
          <div className="overflow-x-auto">
            <AdminTable>
              <AdminTableHeader>
                <AdminTableRow>
                  <AdminTableHead>Cliente</AdminTableHead>
                  <AdminTableHead>Empresa</AdminTableHead>
                  <AdminTableHead>Documentos</AdminTableHead>
                  <AdminTableHead>Status</AdminTableHead>
                  <AdminTableHead>Prioridade</AdminTableHead>
                  <AdminTableHead>Risco</AdminTableHead>
                  <AdminTableHead>Enviado em</AdminTableHead>
                  <AdminTableHead>Ações</AdminTableHead>
                </AdminTableRow>
              </AdminTableHeader>
              <AdminTableBody>
                {loading ? (
                  <AdminTableRow>
                    <AdminTableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                        Carregando verificações...
                      </div>
                    </AdminTableCell>
                  </AdminTableRow>
                ) : filteredVerifications.length === 0 ? (
                  <AdminTableRow>
                    <AdminTableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma verificação encontrada</p>
                      </div>
                    </AdminTableCell>
                  </AdminTableRow>
                ) : (
                  filteredVerifications.map((verification) => (
                    <AdminTableRow key={verification.id}>
                      <AdminTableCell>
                        <div>
                          <p className="font-medium text-sm">{verification.userName}</p>
                          <p className="text-xs text-muted-foreground">{verification.userDocument}</p>
                          <p className="text-xs text-muted-foreground">{verification.userEmail}</p>
                        </div>
                      </AdminTableCell>
                      <AdminTableCell>
                        <div>
                          <p className="font-medium text-sm">{verification.tenantName}</p>
                          <p className="text-xs text-muted-foreground">{verification.tenantDocument}</p>
                        </div>
                      </AdminTableCell>
                      <AdminTableCell>
                        <div className="flex flex-wrap gap-1">
                          {verification.documents.map((doc) => (
                            <AdminBadge key={doc.id} variant="outline" className="text-xs">
                              {doc.type.toUpperCase()}
                            </AdminBadge>
                          ))}
                        </div>
                      </AdminTableCell>
                      <AdminTableCell>
                        {getStatusBadge(verification.status)}
                      </AdminTableCell>
                      <AdminTableCell>
                        {getPriorityBadge(verification.priority)}
                      </AdminTableCell>
                      <AdminTableCell>
                        <span className={`text-sm font-medium ${
                          verification.riskScore && verification.riskScore > 70 ? 'text-red-600' :
                          verification.riskScore && verification.riskScore > 40 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {verification.riskScore || 0}/100
                        </span>
                      </AdminTableCell>
                      <AdminTableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(verification.submittedAt)}
                        </span>
                      </AdminTableCell>
                      <AdminTableCell>
                        <AdminButton
                          variant="outline"
                          size="sm"
                          onClick={() => openReviewDialog(verification)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Revisar
                        </AdminButton>
                      </AdminTableCell>
                    </AdminTableRow>
                  ))
                )}
              </AdminTableBody>
            </AdminTable>
          </div>
        </AdminCardContent>
      </AdminCard>

      {/* Dialog de Revisão */}
      <AdminDialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <AdminDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AdminDialogHeader>
            <AdminDialogTitle>Revisar Verificação KYC</AdminDialogTitle>
            <AdminDialogDescription>
              Analise os documentos e informações do cliente para aprovar ou rejeitar a verificação.
            </AdminDialogDescription>
          </AdminDialogHeader>
          
          {selectedVerification && (
            <div className="space-y-6">
              {/* Dados Pessoais */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome Completo</label>
                  <span className="text-sm">{selectedVerification.personalData.fullName}</span>
                </div>
                <div>
                  <label className="text-sm font-medium">CPF</label>
                  <span className="text-sm">{selectedVerification.personalData.cpf}</span>
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <span className="text-sm">{selectedVerification.personalData.phone}</span>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <span className="text-sm">{selectedVerification.userEmail}</span>
                </div>
                {selectedVerification.personalData.address && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Endereço</label>
                    <span className="text-sm">{selectedVerification.personalData.address}</span>
                  </div>
                )}
              </div>

              {/* Dados da Empresa */}
              {selectedVerification.companyData && (
                <div>
                  <h4 className="font-medium mb-2">Dados da Empresa</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Razão Social</label>
                      <span className="text-sm">{selectedVerification.companyData.razaoSocial}</span>
                    </div>
                    <div>
                      <label className="text-sm font-medium">CNPJ</label>
                      <span className="text-sm">{selectedVerification.companyData.cnpj}</span>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Endereço</label>
                      <span className="text-sm">{selectedVerification.companyData.endereco}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Documentos */}
              <div>
                <h4 className="font-medium mb-2">Documentos Enviados</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedVerification.documents.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{doc.type.toUpperCase()}</span>
                        <AdminButton variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Visualizar
                        </AdminButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas de Revisão */}
              <div>
                <label className="text-sm font-medium mb-2 block">Notas de Revisão</label>
                <AdminTextarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Adicione suas observações sobre a verificação..."
                  rows={4}
                />
              </div>
            </div>
          )}
          
          <AdminDialogFooter>
            <AdminButton 
              variant="outline" 
              onClick={() => selectedVerification && handleRejectVerification(selectedVerification.id)}
              disabled={processingId === selectedVerification?.id}
            >
              <X className="h-4 w-4 mr-2" />
              {processingId === selectedVerification?.id ? 'Processando...' : 'Rejeitar'}
            </AdminButton>
            <AdminButton 
              onClick={() => selectedVerification && handleApproveVerification(selectedVerification.id)}
              disabled={processingId === selectedVerification?.id}
            >
              <Check className="h-4 w-4 mr-2" />
              {processingId === selectedVerification?.id ? 'Processando...' : 'Aprovar'}
            </AdminButton>
          </AdminDialogFooter>
        </AdminDialogContent>
      </AdminDialog>
    </div>
  );
}
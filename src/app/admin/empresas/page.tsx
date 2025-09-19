'use client';

import { useState, useEffect } from 'react';
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from '@/components/admin/ui/card';
import { AdminButton } from '@/components/admin/ui/button';
import { AdminBadge } from '@/components/admin/ui/badge';
import { AdminInput } from '@/components/admin/ui/input';
import { AdminLabel } from '@/components/admin/ui/label';
import { AdminDialog, AdminDialogContent, AdminDialogHeader, AdminDialogTitle, AdminDialogTrigger } from '@/components/admin/ui/dialog';
import { AdminTable, AdminTableBody, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from '@/components/admin/ui/table';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  DollarSign,
  Activity
} from 'lucide-react';

/**
 * PÁGINA DE GERENCIAMENTO DE EMPRESAS
 * 
 * Interface para administradores gerenciarem tenants/empresas do sistema
 * Funcionalidades: listagem, cadastro, edição e exclusão de empresas
 * 
 * Contexto: Painel administrativo global
 */

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  status: 'ativa' | 'inativa' | 'suspensa';
  plano: 'basico' | 'premium' | 'enterprise';
  dataCriacao: string;
  ultimoAcesso: string;
  totalUsuarios: number;
  faturamentoMensal: number;
}

// Função para buscar empresas da API
const fetchEmpresas = async (): Promise<Empresa[]> => {
  try {
    const response = await fetch('/api/admin/empresas');
    if (!response.ok) {
      throw new Error('Erro ao carregar empresas');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    return [];
  }
};

const statusColors = {
  ativa: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  inativa: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  suspensa: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
};

const planoColors = {
  basico: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  premium: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  enterprise: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
};

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEmpresas = async () => {
      setLoading(true);
      const data = await fetchEmpresas();
      setEmpresas(data);
      setLoading(false);
    };
    loadEmpresas();
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    plano: 'basico' as 'basico' | 'premium' | 'enterprise'
  });

  const filteredEmpresas = empresas.filter(empresa =>
    empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empresa.cnpj.includes(searchTerm) ||
    empresa.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEmpresa) {
      // Editar empresa existente
      setEmpresas(prev => prev.map(emp => 
        emp.id === editingEmpresa.id 
          ? { ...emp, ...formData }
          : emp
      ));
    } else {
      // Criar nova empresa
      const novaEmpresa: Empresa = {
        id: Date.now().toString(),
        ...formData,
        status: 'ativa',
        dataCriacao: new Date().toISOString().split('T')[0],
        ultimoAcesso: '-',
        totalUsuarios: 0,
        faturamentoMensal: 0
      };
      setEmpresas(prev => [...prev, novaEmpresa]);
    }
    
    // Reset form
    setFormData({ nome: '', cnpj: '', email: '', telefone: '', plano: 'basico' });
    setEditingEmpresa(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (empresa: Empresa) => {
    setEditingEmpresa(empresa);
    setFormData({
      nome: empresa.nome,
      cnpj: empresa.cnpj,
      email: empresa.email,
      telefone: empresa.telefone,
      plano: empresa.plano
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta empresa?')) {
      setEmpresas(prev => prev.filter(emp => emp.id !== id));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (dateString === '-') return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-[80%] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Empresas</h2>
          <p className="text-muted-foreground">
            Gerencie todas as empresas cadastradas no sistema
          </p>
        </div>
        <AdminDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AdminDialogTrigger asChild>
            <AdminButton 
              onClick={() => {
                setEditingEmpresa(null);
                setFormData({ nome: '', cnpj: '', email: '', telefone: '', plano: 'basico' });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Empresa
            </AdminButton>
          </AdminDialogTrigger>
          <AdminDialogContent className="max-w-md">
            <AdminDialogHeader>
              <AdminDialogTitle>
                {editingEmpresa ? 'Editar Empresa' : 'Nova Empresa'}
              </AdminDialogTitle>
            </AdminDialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <AdminLabel htmlFor="nome">Nome da Empresa</AdminLabel>
                <AdminInput
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Digite o nome da empresa"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <AdminLabel htmlFor="cnpj">CNPJ</AdminLabel>
                <AdminInput
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <AdminLabel htmlFor="email">E-mail</AdminLabel>
                <AdminInput
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contato@empresa.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <AdminLabel htmlFor="telefone">Telefone</AdminLabel>
                <AdminInput
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <AdminLabel htmlFor="plano">Plano</AdminLabel>
                <select
                  id="plano"
                  value={formData.plano}
                  onChange={(e) => setFormData(prev => ({ ...prev, plano: e.target.value as 'basico' | 'premium' | 'enterprise' }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="basico">Básico</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <AdminButton 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </AdminButton>
                <AdminButton type="submit">
                  {editingEmpresa ? 'Salvar' : 'Criar'}
                </AdminButton>
              </div>
            </form>
          </AdminDialogContent>
        </AdminDialog>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AdminCardTitle className="text-sm font-medium">
              Total de Empresas
            </AdminCardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-bold">{empresas.length}</div>
            <p className="text-xs text-muted-foreground">
              {empresas.filter(e => e.status === 'ativa').length} ativas
            </p>
          </AdminCardContent>
        </AdminCard>
        
        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AdminCardTitle className="text-sm font-medium">
              Usuários Totais
            </AdminCardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-bold">
              {empresas.reduce((acc, emp) => acc + emp.totalUsuarios, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Distribuídos entre empresas
            </p>
          </AdminCardContent>
        </AdminCard>
        
        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AdminCardTitle className="text-sm font-medium">
              Faturamento Mensal
            </AdminCardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(empresas.reduce((acc, emp) => acc + emp.faturamentoMensal, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de todas as empresas
            </p>
          </AdminCardContent>
        </AdminCard>
        
        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AdminCardTitle className="text-sm font-medium">
              Empresas Ativas
            </AdminCardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-bold">
              {empresas.filter(e => e.status === 'ativa').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((empresas.filter(e => e.status === 'ativa').length / empresas.length) * 100)}% do total
            </p>
          </AdminCardContent>
        </AdminCard>
      </div>

      {/* Filtros e Busca */}
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>Filtros</AdminCardTitle>
        </AdminCardHeader>
        <AdminCardContent>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <AdminInput
                placeholder="Buscar por nome, CNPJ ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <AdminButton variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </AdminButton>
          </div>
        </AdminCardContent>
      </AdminCard>

      {/* Tabela de Empresas */}
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>Lista de Empresas</AdminCardTitle>
        </AdminCardHeader>
        <AdminCardContent>
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>Empresa</AdminTableHead>
                <AdminTableHead>CNPJ</AdminTableHead>
                <AdminTableHead>Status</AdminTableHead>
                <AdminTableHead>Plano</AdminTableHead>
                <AdminTableHead>Usuários</AdminTableHead>
                <AdminTableHead>Faturamento</AdminTableHead>
                <AdminTableHead>Último Acesso</AdminTableHead>
                <AdminTableHead className="text-right">Ações</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {filteredEmpresas.map((empresa) => (
                <AdminTableRow key={empresa.id}>
                  <AdminTableCell>
                    <div>
                      <div className="font-medium">{empresa.nome}</div>
                      <div className="text-sm text-muted-foreground">{empresa.email}</div>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell className="font-mono text-sm">
                    {empresa.cnpj}
                  </AdminTableCell>
                  <AdminTableCell>
                    <AdminBadge className={statusColors[empresa.status]}>
                      {empresa.status.charAt(0).toUpperCase() + empresa.status.slice(1)}
                    </AdminBadge>
                  </AdminTableCell>
                  <AdminTableCell>
                    <AdminBadge className={planoColors[empresa.plano]}>
                      {empresa.plano.charAt(0).toUpperCase() + empresa.plano.slice(1)}
                    </AdminBadge>
                  </AdminTableCell>
                  <AdminTableCell>{empresa.totalUsuarios}</AdminTableCell>
                  <AdminTableCell>{formatCurrency(empresa.faturamentoMensal)}</AdminTableCell>
                  <AdminTableCell>{formatDate(empresa.ultimoAcesso)}</AdminTableCell>
                  <AdminTableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(empresa)}
                      >
                        <Edit className="h-4 w-4" />
                      </AdminButton>
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(empresa.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </AdminButton>
                      <AdminButton
                        variant="ghost"
                        size="sm"
                      >
                        <Eye className="h-4 w-4" />
                      </AdminButton>
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
        </AdminCardContent>
      </AdminCard>
    </div>
  );
}
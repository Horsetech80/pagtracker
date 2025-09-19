'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Users, DollarSign, TrendingUp, Settings } from 'lucide-react';
import { 
  getDestinatarios, 
  getRegras, 
  getTransacoes, 
  initializeSplitDataIfEmpty 
} from '@/lib/db/localStorage/splitStorage';
import { SplitDestinatario, SplitRegra, SplitTransacao } from '@/lib/api/split/types';

export default function SplitPage() {
  const [destinatarios, setDestinatarios] = useState<SplitDestinatario[]>([]);
  const [regras, setRegras] = useState<SplitRegra[]>([]);
  const [transacoes, setTransacoes] = useState<SplitTransacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'destinatarios' | 'regras' | 'transacoes'>('destinatarios');

  // Mock user ID - em produção viria do contexto de autenticação
  const userId = 'user-123';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Inicializar dados de exemplo se necessário
      initializeSplitDataIfEmpty(userId);

      // Carregar dados diretamente do localStorage
      const destinatariosData = getDestinatarios(userId);
      const regrasData = getRegras(userId);
      const transacoesData = getTransacoes(userId);

      setDestinatarios(destinatariosData);
      setRegras(regrasData);
      setTransacoes(transacoesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDestinatarios = destinatarios.filter(dest =>
    dest.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dest.documento.includes(searchTerm)
  );

  const filteredRegras = regras.filter(regra =>
    regra.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransacoes = transacoes.filter(transacao =>
    transacao.id.includes(searchTerm) ||
    transacao.charge_id?.includes(searchTerm)
  );

  return (
    <div className="dashboard-container-lg">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Split de Pagamentos</h1>
          <p className="text-muted-foreground">
            Gerencie a divisão automática de pagamentos entre parceiros
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Split
        </Button>
      </div>

      {/* Métricas */}
      <div className="dashboard-stats-grid">
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Destinatários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{destinatarios.length}</div>
            <p className="text-xs text-muted-foreground">
              Parceiros cadastrados
            </p>
          </CardContent>
        </Card>
        
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regras Ativas</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {regras.filter(r => r.ativa !== false).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Regras configuradas
            </p>
          </CardContent>
        </Card>
        
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transacoes.length}</div>
            <p className="text-xs text-muted-foreground">
              Splits processados
            </p>
          </CardContent>
        </Card>
        
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant="default">Ativo</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Sistema operacional
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Busque e filtre seus dados de split
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, documento, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('destinatarios')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'destinatarios'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Destinatários ({destinatarios.length})
        </button>
        <button
          onClick={() => setActiveTab('regras')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'regras'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Regras ({regras.length})
        </button>
        <button
          onClick={() => setActiveTab('transacoes')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'transacoes'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Transações ({transacoes.length})
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      {loading ? (
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="text-center">Carregando...</div>
          </CardContent>
        </Card>
      ) : (
        <Card className="dashboard-card">
          <CardContent className="p-6">
            {activeTab === 'destinatarios' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Destinatários</h3>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Destinatário
                  </Button>
                </div>
                {filteredDestinatarios.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum destinatário encontrado
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredDestinatarios.map((destinatario) => (
                      <div key={destinatario.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{destinatario.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {destinatario.documento} • {destinatario.chave_pix || 'Sem chave PIX'}
                          </p>
                        </div>
                        <Badge variant={destinatario.status === 'ativo' ? 'default' : 'secondary'}>
                          {destinatario.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'regras' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Regras de Split</h3>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Regra
                  </Button>
                </div>
                {filteredRegras.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma regra encontrada
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredRegras.map((regra) => (
                      <div key={regra.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{regra.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {regra.descricao} • {regra.divisoes.length} divisões
                          </p>
                        </div>
                        <Badge variant={regra.ativa !== false ? 'default' : 'secondary'}>
                          {regra.ativa !== false ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transacoes' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Transações de Split</h3>
                </div>
                {filteredTransacoes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma transação encontrada
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTransacoes.map((transacao) => (
                      <div key={transacao.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Transação {transacao.id.slice(0, 8)}...</p>
                          <p className="text-sm text-muted-foreground">
                            R$ {(transacao.valor_total / 100).toFixed(2)} • {transacao.divisoes.length} divisões
                          </p>
                        </div>
                        <Badge 
                          variant={
                            transacao.status === 'concluido' ? 'default' :
                            transacao.status === 'processando' ? 'secondary' :
                            transacao.status === 'falha' ? 'destructive' : 'outline'
                          }
                        >
                          {transacao.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { AdminCard } from '@/components/admin/ui/card';
import { AdminButton } from '@/components/admin/ui/button';
import { AdminInput } from '@/components/admin/ui/input';
import { AdminBadge } from '@/components/admin/ui/badge';
import { AdminTable, AdminTableBody, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from '@/components/admin/ui/table';
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  DollarSign,
  CreditCard,
  Smartphone,
  Wifi,
  WifiOff,
  Battery,
  MapPin,
  Building2,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Eye,
  RotateCcw,
  Power,
  Signal
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface MED {
  id: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  clientId: string;
  clientName: string;
  clientDocument: string;
  status: 'active' | 'inactive' | 'maintenance' | 'blocked' | 'pending_activation';
  connectionType: 'wifi' | '4g' | 'ethernet' | 'bluetooth';
  batteryLevel?: number;
  signalStrength?: number;
  lastActivity: string;
  installationDate: string;
  location: {
    address: string;
    city: string;
    state: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  dailyTransactions: number;
  dailyVolume: number;
  monthlyTransactions: number;
  monthlyVolume: number;
  totalTransactions: number;
  totalVolume: number;
  averageTicket: number;
  lastTransaction?: string;
  firmwareVersion: string;
  configurationProfile: string;
  supportedMethods: ('credit' | 'debit' | 'pix' | 'voucher' | 'contactless')[];
  fees: {
    credit: number;
    debit: number;
    pix: number;
  };
  riskLevel: 'low' | 'medium' | 'high';
  maintenanceScheduled?: string;
  notes?: string;
}

interface MEDSummary {
  totalDevices: number;
  activeDevices: number;
  inactiveDevices: number;
  maintenanceDevices: number;
  blockedDevices: number;
  pendingActivation: number;
  averageBattery: number;
  totalRevenue: number;
  monthlyGrowth: number;
  dailyTransactions: number;
  dailyVolume: number;
  averageTicket: number;
  topPerformingDevice: string;
  deviceUtilization: number;
}

// Dados mockados removidos - agora usando API real

const fetchMEDs = async (): Promise<{ meds: MED[], summary: MEDSummary }> => {
  try {
    const response = await fetch('/api/admin/meds', {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transformar dados da API para o formato esperado pelo frontend
    const transformedMEDs: MED[] = data.meds?.map((med: any) => ({
      id: med.id,
      serialNumber: med.serial_number,
      model: med.model,
      manufacturer: med.manufacturer,
      clientId: med.user_id,
      clientName: med.client_name,
      clientDocument: med.client_document,
      status: med.status,
      connectionType: med.connection_type,
      batteryLevel: med.battery_level,
      signalStrength: med.signal_strength,
      lastActivity: med.last_activity || new Date().toISOString(),
      installationDate: med.installation_date || new Date().toISOString(),
      location: {
        address: med.location_address || '',
        city: med.location_city || '',
        state: med.location_state || '',
        coordinates: med.location_coordinates
      },
      dailyTransactions: med.meds_statistics?.[0]?.daily_transactions || 0,
      dailyVolume: parseFloat(med.meds_statistics?.[0]?.daily_volume || '0'),
      monthlyTransactions: 0, // TODO: Calcular do backend
      monthlyVolume: 0, // TODO: Calcular do backend
      totalTransactions: 0, // TODO: Calcular do backend
      totalVolume: 0, // TODO: Calcular do backend
      averageTicket: med.meds_statistics?.[0]?.average_ticket || 0,
      lastTransaction: med.last_transaction,
      firmwareVersion: med.firmware_version || '1.0.0',
      configurationProfile: med.configuration_profile || 'default',
      supportedMethods: med.supported_methods || ['credit', 'debit', 'pix'],
      fees: med.fees || { credit: 0, debit: 0, pix: 0 },
      riskLevel: med.risk_level || 'low',
      maintenanceScheduled: med.maintenance_scheduled,
      notes: med.notes
    })) || [];

    const summary: MEDSummary = {
      totalDevices: data.summary?.totalDevices || 0,
      activeDevices: data.summary?.activeDevices || 0,
      inactiveDevices: data.summary?.inactiveDevices || 0,
      maintenanceDevices: data.summary?.maintenanceDevices || 0,
      blockedDevices: data.summary?.blockedDevices || 0,
      pendingActivation: data.summary?.pendingActivation || 0,
      averageBattery: data.summary?.averageBattery || 0,
      totalRevenue: data.summary?.totalRevenue || 0,
      monthlyGrowth: data.summary?.monthlyGrowth || 0,
      dailyTransactions: data.summary?.dailyTransactions || 0,
      dailyVolume: data.summary?.dailyVolume || 0,
      averageTicket: data.summary?.averageTicket || 0,
      topPerformingDevice: data.summary?.topPerformingDevice || '',
      deviceUtilization: data.summary?.deviceUtilization || 0
    };
    
    return { meds: transformedMEDs, summary };
  } catch (error) {
    console.error('Erro ao buscar MEDs:', error);
    return { 
      meds: [], 
      summary: {
        totalDevices: 0,
        activeDevices: 0,
        inactiveDevices: 0,
        maintenanceDevices: 0,
        blockedDevices: 0,
        pendingActivation: 0,
        averageBattery: 0,
        totalRevenue: 0,
        monthlyGrowth: 0,
        dailyTransactions: 0,
        dailyVolume: 0,
        averageTicket: 0,
        topPerformingDevice: '',
        deviceUtilization: 0
      }
    };
  }
};


// Dados mockados removidos - agora usando API real


function getStatusBadge(status: MED['status']) {
  switch (status) {
    case 'active':
      return <AdminBadge variant="default" className="bg-green-100 text-green-800">Ativo</AdminBadge>;
    case 'inactive':
      return <AdminBadge variant="outline" className="bg-gray-100 text-gray-800">Inativo</AdminBadge>;
    case 'maintenance':
      return <AdminBadge variant="outline" className="bg-orange-100 text-orange-800">Manutenção</AdminBadge>;
    case 'blocked':
      return <AdminBadge variant="destructive">Bloqueado</AdminBadge>;
    case 'pending_activation':
      return <AdminBadge variant="secondary">Pend. Ativação</AdminBadge>;
    default:
      return <AdminBadge variant="outline">Desconhecido</AdminBadge>;
  }
}

function getConnectionBadge(type: MED['connectionType']) {
  const connections = {
    wifi: { label: 'Wi-Fi', color: 'bg-blue-100 text-blue-800', icon: Wifi },
    '4g': { label: '4G', color: 'bg-green-100 text-green-800', icon: Signal },
    ethernet: { label: 'Ethernet', color: 'bg-purple-100 text-purple-800', icon: Activity },
    bluetooth: { label: 'Bluetooth', color: 'bg-indigo-100 text-indigo-800', icon: Smartphone }
  };
  
  const connectionInfo = connections[type];
  const IconComponent = connectionInfo.icon;
  
  return (
    <AdminBadge variant="outline" className={connectionInfo.color}>
      <IconComponent className="h-3 w-3 mr-1" />
      {connectionInfo.label}
    </AdminBadge>
  );
}

function getRiskBadge(risk: MED['riskLevel']) {
  switch (risk) {
    case 'low':
      return <AdminBadge variant="outline" className="bg-green-100 text-green-800">Baixo</AdminBadge>;
    case 'medium':
      return <AdminBadge variant="outline" className="bg-yellow-100 text-yellow-800">Médio</AdminBadge>;
    case 'high':
      return <AdminBadge variant="destructive">Alto</AdminBadge>;
    default:
      return <AdminBadge variant="outline">-</AdminBadge>;
  }
}

function getBatteryIcon(level?: number) {
  if (!level) return null;
  
  let color = 'text-green-600';
  if (level < 30) color = 'text-red-600';
  else if (level < 60) color = 'text-orange-600';
  
  return (
    <div className={`flex items-center ${color}`}>
      <Battery className="h-4 w-4 mr-1" />
      <span className="text-sm">{level}%</span>
    </div>
  );
}

function getSignalIcon(strength?: number) {
  if (!strength) return null;
  
  let color = 'text-green-600';
  if (strength < 30) color = 'text-red-600';
  else if (strength < 60) color = 'text-orange-600';
  
  return (
    <div className={`flex items-center ${color}`}>
      <Signal className="h-4 w-4 mr-1" />
      <span className="text-sm">{strength}%</span>
    </div>
  );
}

export default function MEDsPage() {
  const [meds, setMeds] = useState<MED[]>([]);
  const [summary, setSummary] = useState<MEDSummary>({
    totalDevices: 0,
    activeDevices: 0,
    inactiveDevices: 0,
    maintenanceDevices: 0,
    blockedDevices: 0,
    pendingActivation: 0,
    averageBattery: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    dailyTransactions: 0,
    dailyVolume: 0,
    averageTicket: 0,
    topPerformingDevice: '',
    deviceUtilization: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('all');
  const [connectionFilter, setConnectionFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const filteredMEDs = meds.filter(med => {
    const matchesSearch = med.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         med.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         med.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         med.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || med.status === statusFilter;
    const matchesManufacturer = manufacturerFilter === 'all' || med.manufacturer === manufacturerFilter;
    const matchesConnection = connectionFilter === 'all' || med.connectionType === connectionFilter;
    const matchesRisk = riskFilter === 'all' || med.riskLevel === riskFilter;
    
    return matchesSearch && matchesStatus && matchesManufacturer && matchesConnection && matchesRisk;
  });

  useEffect(() => {
    const loadMEDsData = async () => {
      setLoading(true);
      try {
        const { meds: medsData, summary: summaryData } = await fetchMEDs();
        setMeds(medsData);
        setSummary(summaryData);
      } catch (error) {
        console.error('Erro ao carregar dados dos MEDs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMEDsData();
  }, []);

  return (
    <div className="container-responsive space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">MEDs - Meios Eletrônicos de Pagamento</h1>
          <p className="text-muted-foreground mt-1">
            Monitore e gerencie todos os dispositivos de pagamento da rede
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AdminButton variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Últimos 30 dias
          </AdminButton>
          <AdminButton variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </AdminButton>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Dispositivos</p>
              <p className="text-2xl font-bold text-foreground">{summary.totalDevices.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">{summary.activeDevices} ativos</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Volume Diário</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.dailyVolume)}</p>
              <p className="text-sm text-muted-foreground mt-1">{summary.dailyTransactions.toLocaleString()} transações</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.averageTicket)}</p>
              <p className="text-sm text-green-600 mt-1">{summary.deviceUtilization}% utilização</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dispositivos Inativos</p>
              <p className="text-2xl font-bold text-orange-600">{summary.inactiveDevices}</p>
              <p className="text-sm text-muted-foreground mt-1">{summary.maintenanceDevices} em manutenção</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Filtros */}
      <AdminCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <AdminInput
                placeholder="Buscar por cliente, serial, modelo ou ID do dispositivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="maintenance">Manutenção</option>
              <option value="blocked">Bloqueado</option>
              <option value="pending_activation">Pend. Ativação</option>
            </select>
            
            <select 
              value={manufacturerFilter} 
              onChange={(e) => setManufacturerFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todos os Fabricantes</option>
              <option value="PAX">PAX</option>
              <option value="Ingenico">Ingenico</option>
              <option value="Verifone">Verifone</option>
              <option value="Stone">Stone</option>
              <option value="Cielo">Cielo</option>
              <option value="GetNet">GetNet</option>
            </select>
            
            <select 
              value={connectionFilter} 
              onChange={(e) => setConnectionFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todas as Conexões</option>
              <option value="wifi">Wi-Fi</option>
              <option value="4g">4G</option>
              <option value="ethernet">Ethernet</option>
              <option value="bluetooth">Bluetooth</option>
            </select>
            
            <select 
              value={riskFilter} 
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todos os Riscos</option>
              <option value="low">Baixo</option>
              <option value="medium">Médio</option>
              <option value="high">Alto</option>
            </select>
            
            <AdminButton variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </AdminButton>
          </div>
        </div>
      </AdminCard>

      {/* Tabela de MEDs */}
      <AdminCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Lista de Dispositivos</h2>
          <p className="text-sm text-muted-foreground">
            {filteredMEDs.length} de {meds.length} dispositivos
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>Dispositivo</AdminTableHead>
                <AdminTableHead>Cliente</AdminTableHead>
                <AdminTableHead>Status</AdminTableHead>
                <AdminTableHead>Conexão</AdminTableHead>
                <AdminTableHead>Bateria/Sinal</AdminTableHead>
                <AdminTableHead>Transações Hoje</AdminTableHead>
                <AdminTableHead>Volume Hoje</AdminTableHead>
                <AdminTableHead>Ticket Médio</AdminTableHead>
                <AdminTableHead>Risco</AdminTableHead>
                <AdminTableHead>Última Atividade</AdminTableHead>
                <AdminTableHead>Ações</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {filteredMEDs.map((med) => (
                <AdminTableRow key={med.id} className="hover:bg-accent/50">
                  <AdminTableCell>
                    <div>
                      <p className="font-medium">{med.manufacturer} {med.model}</p>
                      <p className="text-sm text-muted-foreground font-mono">{med.serialNumber}</p>
                      <p className="text-xs text-muted-foreground">v{med.firmwareVersion}</p>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div>
                      <p className="font-medium">{med.clientName}</p>
                      <p className="text-sm text-muted-foreground">{med.clientDocument}</p>
                      <p className="text-xs text-muted-foreground">{med.location.city}, {med.location.state}</p>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    {getStatusBadge(med.status)}
                  </AdminTableCell>
                  <AdminTableCell>
                    {getConnectionBadge(med.connectionType)}
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="space-y-1">
                      {getBatteryIcon(med.batteryLevel)}
                      {getSignalIcon(med.signalStrength)}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell className="font-medium">
                    {med.dailyTransactions.toLocaleString()}
                  </AdminTableCell>
                  <AdminTableCell className="font-semibold text-green-600">
                    {formatCurrency(med.dailyVolume)}
                  </AdminTableCell>
                  <AdminTableCell className="font-medium">
                    {formatCurrency(med.averageTicket)}
                  </AdminTableCell>
                  <AdminTableCell>
                    {getRiskBadge(med.riskLevel)}
                  </AdminTableCell>
                  <AdminTableCell className="text-sm">
                    {formatDate(med.lastActivity)}
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex items-center gap-2">
                      <AdminButton variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </AdminButton>
                      <AdminButton variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </AdminButton>
                      {med.status === 'active' ? (
                        <AdminButton variant="ghost" size="sm" className="text-orange-600">
                          <Power className="h-4 w-4" />
                        </AdminButton>
                      ) : (
                        <AdminButton variant="ghost" size="sm" className="text-green-600">
                          <RotateCcw className="h-4 w-4" />
                        </AdminButton>
                      )}
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
        </div>
        
        {filteredMEDs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum dispositivo encontrado com os filtros aplicados.</p>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
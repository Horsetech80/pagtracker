'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, Globe, Edit, Trash2, Download, Upload, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function IpAutorizadoSettings() {
  return (
    <div className="settings-container-lg">
      <div className="settings-section-header">
        <h3 className="settings-section-title flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          IP Autorizado
        </h3>
        <p className="settings-section-description">
          Gerencie os IPs com permissão para acessar a API
        </p>
      </div>

      <Card className="settings-card">
        <CardHeader className="settings-card-header">
          <CardTitle className="settings-card-title-lg">
            Controle de Acesso por IP
          </CardTitle>
          <CardDescription className="settings-card-description">
            Adicione ou remova endereços IP para controlar o acesso à sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="settings-card-content">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-ip">Adicionar Novo IP</Label>
              <div className="flex space-x-2">
                <Input id="new-ip" placeholder="Ex: 192.168.1.1 ou 2001:db8::/32" />
                <Input placeholder="Descrição (Opcional)" />
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Globe className="mr-2 h-4 w-4" />
                Detectar Meu IP
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="settings-card">
        <CardHeader className="settings-card-header">
          <CardTitle className="settings-card-title-lg">IPs Autorizados</CardTitle>
          <CardDescription className="settings-card-description">
            Lista de endereços IP com permissão de acesso
          </CardDescription>
        </CardHeader>
        <CardContent className="settings-card-content">
          <div className="space-y-3">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">192.168.1.100</code>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium">Escritório Principal</p>
                    <p className="text-xs text-muted-foreground">Adicionado em 15/01/2025 às 10:30</p>
                    <p className="text-xs text-muted-foreground">Último acesso: Hoje às 14:25</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">203.0.113.0/24</code>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium">Rede Corporativa</p>
                    <p className="text-xs text-muted-foreground">Adicionado em 12/01/2025 às 16:45</p>
                    <p className="text-xs text-muted-foreground">Último acesso: Hoje às 13:15</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">198.51.100.42</code>
                    <Badge variant="secondary">Inativo</Badge>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium">Servidor Antigo</p>
                    <p className="text-xs text-muted-foreground">Adicionado em 05/01/2025 às 09:20</p>
                    <p className="text-xs text-muted-foreground">Último acesso: 3 dias atrás</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="settings-card">
        <CardHeader className="settings-card-header">
          <CardTitle className="settings-card-title-lg">Configurações Avançadas</CardTitle>
          <CardDescription className="settings-card-description">
            Opções adicionais de segurança e controle
          </CardDescription>
        </CardHeader>
        <CardContent className="settings-card-content">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Bloqueio Automático</Label>
                <p className="text-sm text-muted-foreground">Bloquear IPs após múltiplas tentativas falhadas</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Log de Tentativas</Label>
                <p className="text-sm text-muted-foreground">Registrar todas as tentativas de acesso</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="max-attempts">Máximo de Tentativas</Label>
                <Input id="max-attempts" type="number" placeholder="5" className="w-20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="block-duration">Duração do Bloqueio (min)</Label>
                <Input id="block-duration" type="number" placeholder="30" className="w-20" />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar Lista
              </Button>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Importar Lista
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
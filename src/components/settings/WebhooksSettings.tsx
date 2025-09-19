'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Webhook, 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  CheckCircle, 
  XCircle,
  AlertCircle
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  lastTriggered?: Date;
  status: 'active' | 'inactive' | 'error';
}

const WEBHOOK_EVENTS = [
  { value: 'payment.created', label: 'Pagamento Criado' },
  { value: 'payment.confirmed', label: 'Pagamento Confirmado' },
  { value: 'payment.cancelled', label: 'Pagamento Cancelado' },
  { value: 'payment.expired', label: 'Pagamento Expirado' },
  { value: 'customer.created', label: 'Cliente Criado' },
  { value: 'customer.updated', label: 'Cliente Atualizado' },
];

export default function WebhooksSettings() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      id: '1',
      name: 'Sistema Principal',
      url: 'https://meusite.com/webhook/pagamentos',
      events: ['payment.created', 'payment.confirmed'],
      active: true,
      status: 'active',
      lastTriggered: new Date('2024-01-15T10:30:00'),
    },
  ]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    active: true,
    secret: '',
  });

  const handleAddWebhook = () => {
    setEditingWebhook(null);
    setFormData({
      name: '',
      url: '',
      events: [],
      active: true,
      secret: '',
    });
    setIsDialogOpen(true);
  };

  const handleEditWebhook = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      active: webhook.active,
      secret: webhook.secret || '',
    });
    setIsDialogOpen(true);
  };

  const handleSaveWebhook = () => {
    if (editingWebhook) {
      // Editar webhook existente
      setWebhooks(prev => prev.map(w => 
        w.id === editingWebhook.id 
          ? { ...w, ...formData, status: formData.active ? 'active' : 'inactive' }
          : w
      ));
    } else {
      // Adicionar novo webhook
      const newWebhook: WebhookConfig = {
        id: Date.now().toString(),
        ...formData,
        status: formData.active ? 'active' : 'inactive',
      };
      setWebhooks(prev => [...prev, newWebhook]);
    }
    setIsDialogOpen(false);
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
  };

  const handleToggleWebhook = (id: string) => {
    setWebhooks(prev => prev.map(w => 
      w.id === id 
        ? { ...w, active: !w.active, status: !w.active ? 'active' : 'inactive' }
        : w
    ));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Inativo</Badge>;
    }
  };

  return (
    <div className="settings-container-lg">
      <Card className="settings-card">
        <CardHeader className="settings-card-header">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="settings-card-title-lg flex items-center gap-2">
                <div className="settings-icon-wrapper bg-indigo-50 dark:bg-indigo-950 inline-flex">
                  <Webhook className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                Configuração de Webhooks
              </CardTitle>
              <CardDescription className="settings-card-description">
                Configure endpoints para receber notificações automáticas sobre eventos do sistema.
              </CardDescription>
            </div>
            <Button onClick={handleAddWebhook}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent className="settings-card-content">
          {webhooks.length === 0 ? (
            <div className="text-center py-8">
              <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum webhook configurado</h3>
              <p className="text-muted-foreground mb-4">
                Configure seu primeiro webhook para receber notificações automáticas.
              </p>
              <Button onClick={handleAddWebhook}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Webhook
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <Card key={webhook.id} className="settings-card border border-border">
                  <CardContent className="settings-card-content pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(webhook.status)}
                          <h4 className="font-medium text-foreground">{webhook.name}</h4>
                          {getStatusBadge(webhook.status)}
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">URL:</span>
                            <code className="bg-muted px-2 py-1 rounded text-xs">{webhook.url}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(webhook.url)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Eventos:</span>
                            <div className="flex flex-wrap gap-1">
                              {webhook.events.map((event) => (
                                <Badge key={event} variant="outline" className="text-xs">
                                  {WEBHOOK_EVENTS.find(e => e.value === event)?.label || event}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {webhook.lastTriggered && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Último disparo:</span>
                              <span className="text-xs">
                                {webhook.lastTriggered.toLocaleString('pt-BR')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={webhook.active}
                          onCheckedChange={() => handleToggleWebhook(webhook.id)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditWebhook(webhook)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteWebhook(webhook.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para adicionar/editar webhook */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="settings-dialog-content sm:max-w-[600px]">
          <DialogHeader className="settings-dialog-header">
            <DialogTitle className="settings-dialog-title">
              {editingWebhook ? 'Editar Webhook' : 'Adicionar Novo Webhook'}
            </DialogTitle>
            <DialogDescription className="settings-dialog-description">
              Configure os detalhes do webhook para receber notificações automáticas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="settings-form-grid">
            <div className="settings-form-field">
              <Label htmlFor="name" className="settings-form-label">Nome do Webhook</Label>
              <Input
                id="name"
                className="settings-form-input"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Sistema Principal"
              />
            </div>
            
            <div className="settings-form-field">
              <Label htmlFor="url" className="settings-form-label">URL do Endpoint</Label>
              <Input
                id="url"
                type="url"
                className="settings-form-input"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://meusite.com/webhook"
              />
            </div>
            
            <div className="settings-form-field">
              <Label className="settings-form-label">Eventos para Notificar</Label>
              <div className="grid grid-cols-2 gap-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <div key={event.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={event.value}
                      checked={formData.events.includes(event.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            events: [...prev.events, event.value]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            events: prev.events.filter(ev => ev !== event.value)
                          }));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={event.value} className="settings-form-label text-sm">
                      {event.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="settings-form-field">
              <Label htmlFor="secret" className="settings-form-label">Secret (Opcional)</Label>
              <Input
                id="secret"
                type="password"
                className="settings-form-input"
                value={formData.secret}
                onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                placeholder="Chave secreta para validação"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
              />
              <Label htmlFor="active" className="settings-form-label">Webhook ativo</Label>
            </div>
          </div>
          
          <DialogFooter className="settings-dialog-footer">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveWebhook}>
              {editingWebhook ? 'Salvar Alterações' : 'Adicionar Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
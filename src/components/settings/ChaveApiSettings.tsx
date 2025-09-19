'use client';

import { useState } from 'react';
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
import { Key, Copy, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ChaveApiSettings() {
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div className="settings-container">
      <div className="settings-section-header">
        <h3 className="settings-section-title">
          <Key className="h-5 w-5 text-primary" />
          Chave API
        </h3>
        <p className="settings-section-description">
          Gerencie suas chaves de API para integração
        </p>
      </div>

      <Card className="settings-card">
        <CardHeader className="settings-card-header">
          <CardTitle className="settings-card-title-lg">
            Chave de API Principal
          </CardTitle>
          <CardDescription className="settings-card-description">
            Use esta chave para todas as integrações de API
          </CardDescription>
        </CardHeader>
        <CardContent className="settings-card-content">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                id="api-key"
                readOnly
                type={showApiKey ? 'text' : 'password'}
                value="************************************"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Última atualização: 10/01/2025
            </div>
            <Button>Gerar Nova Chave</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="settings-card">
        <CardHeader className="settings-card-header">
          <CardTitle className="settings-card-title-lg">Chaves de API Adicionais</CardTitle>
          <CardDescription className="settings-card-description">
            Crie chaves específicas para diferentes aplicações ou ambientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="settings-card-content">
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">App Mobile (Leitura)</p>
                  <p className="text-sm text-muted-foreground">
                    Permissões: `read:charges`, `read:customers`
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">Somente Leitura</Badge>
                  <Button variant="outline" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Webhook (Escrita)</p>
                  <p className="text-sm text-muted-foreground">
                    Permissões: `write:webhooks`
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge>Leitura e Escrita</Badge>
                  <Button variant="outline" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Criar Nova Chave
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
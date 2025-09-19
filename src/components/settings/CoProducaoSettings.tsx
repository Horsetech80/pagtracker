'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Zap } from 'lucide-react';

export function CoProducaoSettings() {
  return (
    <div className="settings-container-sm">
      <div className="settings-section-header">
        <h3 className="settings-section-title">CoProdução</h3>
        <p className="settings-section-description">
          Configure as opções de produção e ambiente
        </p>
      </div>

      <Card className="settings-card">
        <CardHeader className="settings-card-header">
          <CardTitle className="settings-card-title">
            <div className="settings-icon-wrapper bg-yellow-50 dark:bg-yellow-950">
              <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            Ambiente de Produção
          </CardTitle>
          <CardDescription className="settings-card-description">
            Configurações do ambiente de produção
          </CardDescription>
        </CardHeader>
        <CardContent className="settings-card-content">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1 flex-1 mr-4">
              <Label className="text-sm font-medium">Modo Produção</Label>
              <div className="text-xs text-muted-foreground">
                Ativar ambiente de produção
              </div>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1 flex-1 mr-4">
              <Label className="text-sm font-medium">Debug Mode</Label>
              <div className="text-xs text-muted-foreground">
                Ativar logs de debug
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="space-y-3">
            <Label htmlFor="webhook-url" className="text-sm font-medium">Webhook URL</Label>
            <Input
              id="webhook-url"
              placeholder="https://sua-aplicacao.com/webhook"
              defaultValue="https://api.pagtracker.com/webhook"
              className="h-10"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
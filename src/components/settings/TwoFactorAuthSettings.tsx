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
import { ShieldCheck, Smartphone, Mail } from 'lucide-react';

export function TwoFactorAuthSettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [authMethod, setAuthMethod] = useState<'app' | 'sms'>('app');

  return (
    <div className="settings-container-sm">
      <div className="settings-section-header">
        <h3 className="settings-section-title">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Autenticação de Dois Fatores (2FA)
        </h3>
        <p className="settings-section-description">
          Adicione uma camada extra de segurança à sua conta.
        </p>
      </div>

      <Card className="settings-card">
        <CardHeader className="settings-card-header">
          <CardTitle className="settings-card-title-lg">
            Status da Autenticação
          </CardTitle>
          <CardDescription className="settings-card-description">
            Ative ou desative a autenticação de dois fatores para o seu login.
          </CardDescription>
        </CardHeader>
        <CardContent className="settings-card-content">
          <div className="flex items-center space-x-4">
            <Switch
              id="two-factor-switch"
              checked={twoFactorEnabled}
              onCheckedChange={setTwoFactorEnabled}
            />
            <Label htmlFor="two-factor-switch" className="flex flex-col">
              <span className="font-medium">
                {twoFactorEnabled ? '2FA Ativado' : '2FA Desativado'}
              </span>
              <span className="text-sm text-muted-foreground">
                {twoFactorEnabled
                  ? 'Sua conta está protegida com 2FA.'
                  : 'Ative para maior segurança.'}
              </span>
            </Label>
          </div>
        </CardContent>
      </Card>

      {twoFactorEnabled && (
        <Card className="settings-card">
          <CardHeader className="settings-card-header">
            <CardTitle className="settings-card-title-lg">Método de Autenticação</CardTitle>
            <CardDescription className="settings-card-description">
              Escolha como você deseja receber os códigos de verificação.
            </CardDescription>
          </CardHeader>
          <CardContent className="settings-card-content">
            <div className="space-y-2">
              <Button
                variant={authMethod === 'app' ? 'default' : 'outline'}
                className="w-full justify-start text-left"
                onClick={() => setAuthMethod('app')}
              >
                <Smartphone className="mr-2 h-4 w-4" />
                <div>
                  <p>Aplicativo de Autenticação</p>
                  <p className="text-xs text-muted-foreground">
                    Use o Google Authenticator, Authy, ou similar.
                  </p>
                </div>
              </Button>
              <Button
                variant={authMethod === 'sms' ? 'default' : 'outline'}
                className="w-full justify-start text-left"
                onClick={() => setAuthMethod('sms')}
                disabled
              >
                <Mail className="mr-2 h-4 w-4" />
                <div>
                  <p>SMS (Em Breve)</p>
                  <p className="text-xs text-muted-foreground">
                    Receba o código por mensagem de texto.
                  </p>
                </div>
              </Button>
            </div>
            {authMethod === 'app' && (
              <div className="rounded-lg border bg-card p-4">
                <p className="mb-4 text-sm text-muted-foreground">
                  Escaneie o QR Code com seu aplicativo de autenticação e insira o código gerado para confirmar.
                </p>
                <div className="flex flex-col items-center gap-4 md:flex-row">
                  <div className="flex h-32 w-32 items-center justify-center rounded-md bg-muted">
                    {/* Placeholder for QR Code */}
                    <p className="text-sm text-muted-foreground">QR Code</p>
                  </div>
                  <div className="w-full space-y-2">
                    <Label htmlFor="auth-code">Código de Verificação</Label>
                    <Input id="auth-code" placeholder="123456" />
                    <Button className="w-full md:w-auto">Confirmar</Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
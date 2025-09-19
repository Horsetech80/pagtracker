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
import { DollarSign, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TaxasSettings() {
  return (
    <div className="settings-container-lg">
      <div className="settings-section-header">
        <h3 className="settings-section-title">
          <DollarSign className="h-5 w-5 text-primary" />
          Taxas e Tarifas
        </h3>
        <p className="settings-section-description">
          Configure as taxas aplicadas aos pagamentos PIX
        </p>
      </div>

      <Card className="settings-card">
        <CardHeader className="settings-card-header">
          <CardTitle className="settings-card-title-lg">
            <div className="settings-icon-wrapper bg-green-50 dark:bg-green-950 inline-flex">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            Configuração de Taxas
          </CardTitle>
          <CardDescription className="settings-card-description">
            Defina as taxas para diferentes tipos de transação
          </CardDescription>
        </CardHeader>
        <CardContent className="settings-card-content">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">PIX</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="taxa-pix-percent">Taxa Percentual (%)</Label>
                  <Input
                    id="taxa-pix-percent"
                    type="number"
                    placeholder="2.5"
                    className="w-24"
                    step="0.01"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="taxa-pix-fixa">Taxa Fixa (R$)</Label>
                  <Input
                    id="taxa-pix-fixa"
                    type="number"
                    placeholder="0.50"
                    className="w-24"
                    step="0.01"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="valor-min-pix">Valor Mínimo (R$)</Label>
                  <Input
                    id="valor-min-pix"
                    type="number"
                    placeholder="1.00"
                    className="w-24"
                    step="0.01"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="valor-max-pix">Valor Máximo (R$)</Label>
                  <Input
                    id="valor-max-pix"
                    type="number"
                    placeholder="5000.00"
                    className="w-32"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Boleto</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="taxa-boleto-percent">Taxa Percentual (%)</Label>
                  <Input
                    id="taxa-boleto-percent"
                    type="number"
                    placeholder="3.5"
                    className="w-24"
                    step="0.01"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="taxa-boleto-fixa">Taxa Fixa (R$)</Label>
                  <Input
                    id="taxa-boleto-fixa"
                    type="number"
                    placeholder="2.00"
                    className="w-24"
                    step="0.01"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="valor-min-boleto">Valor Mínimo (R$)</Label>
                  <Input
                    id="valor-min-boleto"
                    type="number"
                    placeholder="5.00"
                    className="w-24"
                    step="0.01"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="valor-max-boleto">Valor Máximo (R$)</Label>
                  <Input
                    id="valor-max-boleto"
                    type="number"
                    placeholder="10000.00"
                    className="w-32"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="settings-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">Configurações Avançadas</CardTitle>
          <CardDescription className="text-sm">
            Configurações adicionais para taxas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Taxa Progressiva</Label>
                <p className="text-sm text-muted-foreground">
                  Aplicar taxas diferentes por faixa de valor
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Taxa de Serviço</Label>
                <p className="text-sm text-muted-foreground">
                  Adicionar taxa de serviço em todas as transações
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Taxa de Inatividade</Label>
                <p className="text-sm text-muted-foreground">
                  Cobrar taxa para contas inativas por mais de 90 dias
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="settings-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">Regras de Isenção</CardTitle>
          <CardDescription className="text-sm">
            Defina regras para isentar taxas com base no volume ou tipo de cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Clientes VIP</p>
                  <p className="text-sm text-muted-foreground">
                    Isenção total de taxas para clientes com mais de 100 transações/mês.
                  </p>
                </div>
                <Button variant="outline" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Primeira Transação</p>
                  <p className="text-sm text-muted-foreground">
                    Isenção de taxa na primeira transação de cada novo cliente.
                  </p>
                </div>
                <Button variant="outline" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Nova Regra
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
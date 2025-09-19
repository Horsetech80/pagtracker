'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, MessageCircle, Mail } from 'lucide-react';

export function DocumentacaoApiSettings() {
  return (
    <div className="settings-container-lg">
      <div className="settings-section-header">
        <h3 className="settings-section-title">
          <FileText className="h-5 w-5 text-primary" />
          Documentação API
        </h3>
        <p className="settings-section-description">
          Acesse a documentação e exemplos da API
        </p>
      </div>

      <Card className="settings-card">
        <CardHeader className="settings-card-header">
          <CardTitle className="settings-card-title-lg">
            Recursos da API
          </CardTitle>
          <CardDescription className="settings-card-description">
            Links úteis, exemplos de código e documentação completa.
          </CardDescription>
        </CardHeader>
        <CardContent className="settings-card-content">
          <Button variant="outline" className="w-full justify-start">
            <Download className="mr-2 h-4 w-4" />
            Baixar Documentação Completa (PDF)
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Acessar Postman Collection
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Ver Exemplos de Integração no GitHub
          </Button>
        </CardContent>
      </Card>

      <Card className="settings-card">
        <CardHeader className="settings-card-header">
          <CardTitle className="settings-card-title-lg">Suporte Técnico</CardTitle>
          <CardDescription className="settings-card-description">
            Precisa de ajuda? Entre em contato com nossa equipe de suporte.
          </CardDescription>
        </CardHeader>
        <CardContent className="settings-card-content">
          <div className="flex items-start space-x-3">
            <MessageCircle className="h-5 w-5 text-muted-foreground mt-1" />
            <div>
              <p className="font-medium">Chat Ao Vivo</p>
              <p className="text-sm text-muted-foreground">
                Disponível de segunda a sexta, das 9h às 18h.
              </p>
              <Button size="sm" className="mt-2">
                Iniciar Chat
              </Button>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-1" />
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                Envie sua dúvida para{' '}
                <a href="mailto:suporte@pagtracker.com" className="text-primary underline">
                  suporte@pagtracker.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
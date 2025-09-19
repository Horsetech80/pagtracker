'use client';

import { AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SandboxNoticeProps {
  feature: string;
  description?: string;
  suggestion?: string;
  docsUrl?: string;
  variant?: 'warning' | 'info';
  className?: string;
}

export function SandboxNotice({
  feature,
  description,
  suggestion,
  docsUrl,
  variant = 'warning',
  className
}: SandboxNoticeProps) {
  const isWarning = variant === 'warning';
  
  return (
    <Alert className={`border-l-4 ${isWarning ? 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'} ${className}`}>
      <div className="flex items-start gap-3">
        {isWarning ? (
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
        ) : (
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        )}
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTitle className={`text-sm font-semibold ${isWarning ? 'text-amber-800 dark:text-amber-200' : 'text-blue-800 dark:text-blue-200'}`}>
              {feature} - Ambiente de Homologação
            </AlertTitle>
            <Badge variant="outline" className={`text-xs ${isWarning ? 'border-amber-300 text-amber-700 dark:border-amber-600 dark:text-amber-300' : 'border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300'}`}>
              Sandbox
            </Badge>
          </div>
          
          {description && (
            <AlertDescription className={`text-sm ${isWarning ? 'text-amber-700 dark:text-amber-300' : 'text-blue-700 dark:text-blue-300'}`}>
              {description}
            </AlertDescription>
          )}
          
          {suggestion && (
            <div className={`text-sm p-3 rounded-md ${isWarning ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
              <p className={`font-medium ${isWarning ? 'text-amber-800 dark:text-amber-200' : 'text-blue-800 dark:text-blue-200'}`}>
                💡 Sugestão para testes:
              </p>
              <p className={`mt-1 ${isWarning ? 'text-amber-700 dark:text-amber-300' : 'text-blue-700 dark:text-blue-300'}`}>
                {suggestion}
              </p>
            </div>
          )}
          
          {docsUrl && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className={`h-8 text-xs ${isWarning ? 'border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/30' : 'border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30'}`}
                onClick={() => window.open(docsUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Ver Documentação
              </Button>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}

// Componente específico para EVP
export function EvpSandboxNotice({ className }: { className?: string }) {
  return (
    <SandboxNotice
      feature="Chaves PIX Aleatórias (EVP)"
      description="Esta funcionalidade está desabilitada no ambiente de homologação da EfiPay. Em produção, você poderá criar, listar e gerenciar chaves PIX aleatórias normalmente."
      suggestion="Use a chave de teste oficial: efipay@sejaefi.com.br"
      docsUrl="https://dev.efipay.com.br/en/docs/api-pix/endpoints-exclusivos-efi/"
      variant="warning"
      className={className}
    />
  );
}

// Componente para ambiente de desenvolvimento
export function DevelopmentNotice({ className }: { className?: string }) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isDevelopment) return null;
  
  return (
    <SandboxNotice
      feature="Ambiente de Desenvolvimento"
      description="Você está executando o sistema em modo de desenvolvimento. Algumas funcionalidades podem estar limitadas ou usar dados mockados."
      suggestion="Para testes completos, use o ambiente de produção com certificados válidos."
      variant="info"
      className={className}
    />
  );
}
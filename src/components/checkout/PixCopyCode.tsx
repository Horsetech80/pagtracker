'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PixCopyCodeProps = {
  codigoPix: string;
};

export default function PixCopyCode({ codigoPix }: PixCopyCodeProps) {
  const [copied, setCopied] = useState(false);

  // Função para copiar o código Pix para a área de transferência
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(codigoPix);
      
      // Ativa o estado de copiado
      setCopied(true);
      
      // Após 3 segundos, restaura o estado
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Erro ao copiar código Pix:', error);
      // Em caso de erro, exibe uma mensagem alternativa
      alert(`Não foi possível copiar automaticamente. Copie este código manualmente: ${codigoPix}`);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Código Pix (copia e cola)</h3>
      </div>
      
      <div className="flex space-x-2">
        <div className="flex-1 bg-muted p-2 rounded-md text-xs truncate font-mono overflow-hidden">
          {codigoPix}
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className={`w-24 ${copied ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : ''}`}
          onClick={copyToClipboard}
        >
          {copied ? (
            <>
              <Check className="mr-1 h-4 w-4" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="mr-1 h-4 w-4" />
              Copiar
            </>
          )}
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-1">
        Cole o código no app do seu banco para pagar
      </p>
    </div>
  );
} 
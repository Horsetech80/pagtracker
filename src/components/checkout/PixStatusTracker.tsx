'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

type PixStatusTrackerProps = {
  chargeId: string;
  currentStatus: 'pendente' | 'pago' | 'expirado';
  onStatusChange: (newStatus: 'pendente' | 'pago' | 'expirado') => void;
};

export default function PixStatusTracker({ 
  chargeId, 
  currentStatus, 
  onStatusChange 
}: PixStatusTrackerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Efeito para controlar o polling do status
  useEffect(() => {
    if (!chargeId) return;

    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    // Função para verificar o status
    const checkStatus = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      setError(null);

      try {
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        if (isDevelopment) {
          // Em desenvolvimento, vamos simular um atraso e aleatoriamente
          // mudar o status para "pago" após alguns segundos (apenas para demonstração)
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Em modo de desenvolvimento, há 10% de chance do pagamento ser confirmado
          // a cada verificação (apenas para fins de demonstração)
          const shouldUpdateStatus = Math.random() < 0.1;
          if (shouldUpdateStatus && isMounted) {
            onStatusChange('pago');
          }
        } else {
          // Em produção, chamamos a API para verificar o status atual
          const response = await axios.get(`/api/charges/${chargeId}/status`);
          
          if (response.data && response.data.status) {
            // Se o status da API for diferente do atual, atualiza
            if (isMounted && response.data.status !== currentStatus) {
              onStatusChange(response.data.status);
            }
          }
        }
        
        // Se o pagamento foi concluído ou expirou, parar o polling
        if (currentStatus === 'pago' || currentStatus === 'expirado') {
          if (intervalId) {
            clearInterval(intervalId);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Erro ao verificar status do pagamento:', err);
          setError('Não foi possível verificar o status do pagamento');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Iniciar verificação imediatamente
    checkStatus();
    
    // Configurar polling a cada 10 segundos (reduzido de 5s para otimização)
    // Só continua polling se o status for 'pendente'
    if (currentStatus === 'pendente') {
      intervalId = setInterval(checkStatus, 10000);
    }
    
    // Limpar o intervalo quando o componente for desmontado
    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [chargeId, currentStatus, onStatusChange]);

  // Baseado no status atual, renderizar feedback apropriado
  const renderStatusFeedback = () => {
    switch (currentStatus) {
      case 'pago':
        return (
          <div className="flex items-center justify-center px-4 py-3 rounded-md bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Pagamento confirmado! Obrigado pela sua compra.</span>
          </div>
        );
        
      case 'expirado':
        return (
          <div className="flex items-center justify-center px-4 py-3 rounded-md bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Esta cobrança expirou. Por favor, gere uma nova cobrança.</span>
          </div>
        );
        
      case 'pendente':
        return (
          <div className="flex items-center justify-center px-4 py-3 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
            {loading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span>Aguardando confirmação do pagamento...</span>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {renderStatusFeedback()}
      
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 text-center mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
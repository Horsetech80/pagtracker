'use client';

import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Função para formatar o valor em Reais
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value / 100);
};

type ChargeInfoProps = {
  nomeLoja: string;
  valor: number;
  status: 'pendente' | 'pago' | 'expirado';
};

export default function ChargeInfo({ nomeLoja, valor, status }: ChargeInfoProps) {
  // Renderiza o badge de status com o ícone apropriado
  const renderStatusBadge = () => {
    switch (status) {
      case 'pago':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30">
            <CheckCircle className="mr-1 h-3.5 w-3.5" />
            Pago
          </Badge>
        );
      case 'pendente':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/30">
            <Clock className="mr-1 h-3.5 w-3.5" />
            Pendente
          </Badge>
        );
      case 'expirado':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30">
            <XCircle className="mr-1 h-3.5 w-3.5" />
            Expirado
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2 text-center">
      <h1 className="text-xl font-semibold">{nomeLoja}</h1>
      
      <div className="mt-4">
        <h2 className="text-3xl font-bold">{formatCurrency(valor)}</h2>
        <div className="mt-2 flex justify-center">
          {renderStatusBadge()}
        </div>
      </div>
    </div>
  );
} 
import React from 'react';

/**
 * Formata um status de cobrança com elemento visual
 * @param status String com o status da cobrança
 * @returns Elemento React formatado
 */
export function formatStatus(status: string): React.ReactNode {
  switch (status) {
    case 'pago':
      return <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">Pago</span>;
    case 'pendente':
      return <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">Pendente</span>;
    case 'expirado':
      return <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">Expirado</span>;
    case 'cancelado':
      return <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-medium">Cancelado</span>;
    case 'estornado':
      return <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">Estornado</span>;
    default:
      return <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
  }
} 
import React from 'react';
import { cn } from '@/lib/utils';

// COMPONENTE ISOLADO PARA PAINEL ADMINISTRATIVO
// Este componente é uma cópia isolada do textarea.tsx do painel cliente
// Mantém a mesma funcionalidade mas evita conflitos entre painéis

interface AdminTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function AdminTextarea({ className = '', ...props }: AdminTextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
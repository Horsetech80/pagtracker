import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentMethodCardProps {
  method: string;
  percentage: number;
  amount?: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  className?: string;
}

export function PaymentMethodCard({
  method,
  percentage,
  amount,
  icon: Icon,
  color,
  bgColor,
  className
}: PaymentMethodCardProps) {
  return (
    <div className={cn(
      'group relative overflow-hidden rounded-xl border border-border/50',
      'bg-gradient-to-br from-background to-muted/20',
      'p-4 transition-all duration-300',
      'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1',
      'hover:border-border',
      className
    )}>
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0" />
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn(
            'p-2.5 rounded-xl transition-all duration-300',
            bgColor,
            'group-hover:scale-110'
          )}>
            <Icon className={cn('h-5 w-5', color)} />
          </div>
          <div>
            <span className="font-medium text-foreground">
              {method}
            </span>
            {amount && (
              <p className="text-sm text-muted-foreground mt-0.5">
                R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <span className="text-2xl font-bold text-foreground">
            {percentage}%
          </span>
          <div className="mt-1">
            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn('h-full rounded-full transition-all duration-500', bgColor.replace('bg-', 'bg-').replace('/10', '/60'))}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Variantes pré-definidas para diferentes métodos de pagamento
export const PaymentMethodVariants = {
  card: {
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20'
  },
  boleto: {
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20'
  },
  pix: {
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/20'
  },
  crypto: {
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20'
  }
};
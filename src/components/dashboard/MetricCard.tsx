import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  icon: LucideIcon;
  iconColor?: string;
  gradient?: string;
  className?: string;
}

export const MetricCard = memo(function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-primary',
  className
}: MetricCardProps) {
  const changeColorMap = {
    positive: 'text-emerald-600 dark:text-emerald-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-muted-foreground'
  };

  return (
    <Card className={cn(
      'rounded-responsive border-0 shadow-responsive bg-card',
      className
    )}>
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 spacing-responsive-sm">
        <CardTitle className="text-responsive-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 sm:p-2.5 rounded-responsive bg-primary/10 dark:bg-primary/20">
          <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5 text-primary')} />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 sm:space-y-3">
          <div className="text-responsive-xl font-bold text-foreground tracking-tight">
            {typeof value === 'number' && value.toLocaleString ? 
              value.toLocaleString('pt-BR') : 
              value
            }
          </div>
          
          {change && (
            <div className="flex items-center space-x-1 sm:space-x-2">
              <span className={cn(
                'text-responsive-xs font-medium px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-responsive bg-muted/50',
                changeColorMap[change.type]
              )}>
                {change.value}
              </span>
              <span className="text-responsive-xs text-muted-foreground hidden sm:inline">vs período anterior</span>
              <span className="text-responsive-xs text-muted-foreground sm:hidden">vs anterior</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
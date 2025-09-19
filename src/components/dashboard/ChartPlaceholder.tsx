import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon, TrendingUp, BarChart3, PieChart, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartPlaceholderProps {
  title: string;
  description?: string;
  type?: 'line' | 'bar' | 'pie' | 'area';
  height?: string;
  className?: string;
}

export function ChartPlaceholder({
  title,
  description,
  type = 'line',
  height = 'h-[300px]',
  className
}: ChartPlaceholderProps) {
  const iconMap: Record<string, LucideIcon> = {
    line: LineChart,
    bar: BarChart3,
    pie: PieChart,
    area: TrendingUp
  };

  const Icon = iconMap[type];

  return (
    <Card className={cn('group transition-all duration-300 hover:shadow-lg hover:shadow-primary/5', className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-primary" />
          <span>{title}</span>
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn(
          'flex items-center justify-center rounded-lg border-2 border-dashed border-border/50',
          'bg-gradient-to-br from-muted/20 to-muted/5',
          'transition-all duration-300 group-hover:border-primary/30 group-hover:bg-primary/5',
          height
        )}>
          <div className="text-center space-y-4">
            {/* Animated chart mockup */}
            <div className="flex items-end justify-center space-x-1 mb-4">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'bg-primary/20 rounded-sm transition-all duration-300',
                    'group-hover:bg-primary/40'
                  )}
                  style={{
                    width: '8px',
                    height: `${20 + Math.random() * 40}px`,
                    animationDelay: `${i * 100}ms`
                  }}
                />
              ))}
            </div>
            
            <div className="space-y-2">
              <Icon className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                Gráfico será exibido aqui
              </p>
              <p className="text-xs text-muted-foreground/70">
                Dados em tempo real quando disponíveis
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente específico para gráfico de vendas diárias
export function DailySalesChart({ className }: { className?: string }) {
  return (
    <ChartPlaceholder
      title="Vendas por dia"
      description="Acompanhe o volume diário da sua empresa"
      type="area"
      height="h-[250px]"
      className={className}
    />
  );
}

// Componente específico para gráfico de métodos de pagamento
export function PaymentMethodsChart({ className }: { className?: string }) {
  return (
    <ChartPlaceholder
      title="Distribuição por método"
      description="Proporção de vendas por forma de pagamento"
      type="pie"
      height="h-[200px]"
      className={className}
    />
  );
}

// Componente específico para gráfico de conversão
export function ConversionChart({ className }: { className?: string }) {
  return (
    <ChartPlaceholder
      title="Taxa de conversão"
      description="Acompanhe a performance de conversão"
      type="line"
      height="h-[200px]"
      className={className}
    />
  );
}
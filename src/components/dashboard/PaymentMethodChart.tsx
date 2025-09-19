'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, FileText, Smartphone, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Importação dinâmica para evitar problemas de SSR
let Chart: any = null;
let Doughnut: any = null;

interface PaymentMethodChartProps {
  data?: {
    cartao: number;
    boleto: number;
    pix: number;
  };
  className?: string;
}

export function PaymentMethodChart({ data, className }: PaymentMethodChartProps) {
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    const loadChart = async () => {
      if (typeof window !== 'undefined' && !Chart) {
        try {
          // Importar Chart.js com registro de componentes
          const chartModule = await import('chart.js');
          const {
            Chart: ChartJS,
            CategoryScale,
            LinearScale,
            ArcElement,
            Title,
            Tooltip,
            Legend,
          } = chartModule;
          
          // Registrar componentes necessários
          ChartJS.register(
            CategoryScale,
            LinearScale,
            ArcElement,
            Title,
            Tooltip,
            Legend
          );
          
          const { Doughnut: DoughnutChart } = await import('react-chartjs-2');
          
          Chart = ChartJS;
          Doughnut = DoughnutChart;
          setIsChartReady(true);
        } catch (error) {
          console.error('Erro ao carregar Chart.js:', error);
        }
      } else if (Chart && Doughnut) {
        setIsChartReady(true);
      }
    };

    loadChart();
  }, []);

  // Dados de exemplo se não fornecidos
  const defaultData = {
    cartao: 45,
    boleto: 25,
    pix: 30
  };

  const chartData = data || defaultData;
  const total = chartData.cartao + chartData.boleto + chartData.pix;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'hsl(var(--popover))',
        titleColor: 'hsl(var(--popover-foreground))',
        bodyColor: 'hsl(var(--popover-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${percentage}%`;
          }
        }
      },
    },
    cutout: '60%',
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: 'hsl(var(--background))',
      },
    },
  };

  const data_config = {
    labels: ['Cartão', 'Boleto', 'PIX'],
    datasets: [
      {
        data: [chartData.cartao, chartData.boleto, chartData.pix],
        backgroundColor: [
          'hsl(var(--primary))',
          'hsl(var(--secondary))',
          'hsl(220 70% 50%)', // Azul para PIX
        ],
        borderColor: [
          'hsl(var(--primary))',
          'hsl(var(--secondary))',
          'hsl(220 70% 50%)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const paymentMethods = [
    {
      name: 'Cartão',
      value: chartData.cartao,
      percentage: ((chartData.cartao / total) * 100).toFixed(1),
      icon: CreditCard,
      color: 'hsl(var(--primary))',
      bgColor: 'bg-primary/10'
    },
    {
      name: 'Boleto',
      value: chartData.boleto,
      percentage: ((chartData.boleto / total) * 100).toFixed(1),
      icon: FileText,
      color: 'hsl(var(--secondary))',
      bgColor: 'bg-secondary/10'
    },
    {
      name: 'PIX',
      value: chartData.pix,
      percentage: ((chartData.pix / total) * 100).toFixed(1),
      icon: Smartphone,
      color: 'hsl(220 70% 50%)',
      bgColor: 'bg-blue-500/10'
    },
  ];

  return (
    <Card className={cn(
      'rounded-responsive border-0 shadow-responsive bg-card',
      className
    )}>
      <CardHeader className="spacing-responsive-sm">
        <CardTitle className="flex items-center space-x-1 sm:space-x-2">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <span className="text-responsive-lg">Vendas por método</span>
        </CardTitle>
        <CardDescription className="text-responsive-sm">
          Distribuição dos métodos de pagamento
        </CardDescription>
      </CardHeader>
      <CardContent className="spacing-responsive-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Gráfico */}
          <div className="relative h-[180px] sm:h-[200px] lg:h-[220px] w-full flex items-center justify-center">
            <div className="w-[200px] h-[200px] relative">
              {isChartReady && Doughnut ? (
                <Doughnut 
                  options={options} 
                  data={data_config}
                  width={200}
                  height={200}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-responsive-xs text-muted-foreground">Carregando gráfico...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </div>

          {/* Legenda */}
          <div className="space-y-2 sm:space-y-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <div key={method.name} className="flex items-center justify-between p-2 sm:p-3 rounded-responsive bg-muted/30">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className={cn('p-2 rounded-lg', method.bgColor)}>
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: method.color }} />
                    </div>
                    <div>
                      <p className="font-medium text-responsive-sm text-foreground">{method.name}</p>
                      <p className="text-responsive-xs text-muted-foreground">{method.value} vendas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-responsive-sm text-foreground">{method.percentage}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insights */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-muted/30 rounded-responsive">
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
            <p className="text-responsive-xs font-medium text-foreground">Insight</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {paymentMethods[0].name} é o método mais utilizado com {paymentMethods[0].percentage}% das vendas.
            {parseFloat(paymentMethods[2].percentage) > 25 && ' PIX está crescendo rapidamente!'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
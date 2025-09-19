'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Importação dinâmica para evitar problemas de SSR
let Chart: any = null;
let Line: any = null;

interface SalesChartProps {
  data?: {
    labels: string[];
    values: number[];
  };
  className?: string;
}

export function SalesChart({ data, className }: SalesChartProps) {
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    const loadChart = async () => {
      if (typeof window !== 'undefined' && !Chart) {
        try {
          const chartModule = await import('chart.js');
          const { Line: LineChart } = await import('react-chartjs-2');
          
          const {
            Chart: ChartJS,
            CategoryScale,
            LinearScale,
            PointElement,
            LineElement,
            Title,
            Tooltip,
            Legend,
            Filler,
          } = chartModule;
          
          ChartJS.register(
            CategoryScale,
            LinearScale,
            PointElement,
            LineElement,
            Title,
            Tooltip,
            Legend,
            Filler
          );
          
          Chart = ChartJS;
          Line = LineChart;
          setIsChartReady(true);
        } catch (error) {
          console.error('Erro ao carregar Chart.js:', error);
        }
      } else if (Chart && Line) {
        setIsChartReady(true);
      }
    };

    loadChart();
  }, []);



  // Dados de exemplo se não fornecidos
  const defaultData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    values: [1200, 1900, 3000, 5000, 2000, 3000, 4500]
  };

  const chartData = data || defaultData;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 10,
        right: 10,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#1f2937',
        bodyColor: '#1f2937',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `Vendas: R$ ${context.parsed.y.toLocaleString('pt-BR')}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: '#e5e7eb',
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
          },
          callback: function(value: any) {
            return `R$ ${value.toLocaleString('pt-BR')}`;
          },
        },
      },
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 6,
      },
      line: {
        borderJoinStyle: 'round',
      },
    },
  };

  const data_config = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Vendas',
        data: chartData.values,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        borderWidth: 3,
      },
    ],
  };

  return (
    <Card className={cn(
      'rounded-responsive border-0 shadow-responsive bg-card',
      className
    )}>
      <CardHeader className="spacing-responsive-sm">
        <CardTitle className="flex items-center space-x-1 sm:space-x-2">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <span className="text-responsive-lg">Vendas por dia</span>
        </CardTitle>
        <CardDescription className="text-responsive-sm">
          Acompanhe o volume diário da sua empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="spacing-responsive-sm">
        <div className="h-[200px] sm:h-[250px] lg:h-[300px] w-full relative">
          {isChartReady && Line ? (
            <Line 
              options={options} 
              data={data_config} 
              width={undefined}
              height={undefined}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Carregando gráfico...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Estatísticas resumidas */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-border/50">
          <div className="text-center">
            <p className="text-responsive-lg font-bold text-foreground">
              R$ {chartData.values.reduce((a, b) => a + b, 0).toLocaleString('pt-BR')}
            </p>
            <p className="text-responsive-xs text-muted-foreground">Total da semana</p>
          </div>
          <div className="text-center">
            <p className="text-responsive-lg font-bold text-foreground">
              R$ {Math.round(chartData.values.reduce((a, b) => a + b, 0) / chartData.values.length).toLocaleString('pt-BR')}
            </p>
            <p className="text-responsive-xs text-muted-foreground">Média diária</p>
          </div>
          <div className="text-center">
            <p className="text-responsive-lg font-bold text-emerald-600 dark:text-emerald-400">
              +12.5%
            </p>
            <p className="text-responsive-xs text-muted-foreground">vs. semana anterior</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  ShoppingCart, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceStatsProps {
  data?: {
    conversionRate: number;
    averageOrderValue: number;
    customerRetention: number;
    salesGrowth: number;
    activeUsers: number;
    completedOrders: number;
  };
  className?: string;
}

export function PerformanceStats({ data, className }: PerformanceStatsProps) {
  // Dados de exemplo se não fornecidos
  const defaultData = {
    conversionRate: 3.2,
    averageOrderValue: 156.80,
    customerRetention: 68,
    salesGrowth: 12.5,
    activeUsers: 1247,
    completedOrders: 89
  };

  const stats = data || defaultData;

  const performanceMetrics = [
    {
      title: 'Taxa de Conversão',
      value: `${stats.conversionRate}%`,
      target: 5.0,
      current: stats.conversionRate,
      icon: Target,
      trend: stats.conversionRate > 3 ? 'up' : 'down',
      trendValue: '+0.3%',
      description: 'vs. mês anterior',
      color: 'text-green-600',
      bgColor: 'bg-muted',
      progressColor: 'bg-green-600'
    },
    {
      title: 'Ticket Médio',
      value: `R$ ${stats.averageOrderValue.toFixed(2)}`,
      target: 200,
      current: stats.averageOrderValue,
      icon: DollarSign,
      trend: stats.averageOrderValue > 150 ? 'up' : 'down',
      trendValue: '+R$ 12.30',
      description: 'vs. mês anterior',
      color: 'text-blue-600',
      bgColor: 'bg-muted',
      progressColor: 'bg-blue-600'
    },
    {
      title: 'Retenção de Clientes',
      value: `${stats.customerRetention}%`,
      target: 80,
      current: stats.customerRetention,
      icon: Users,
      trend: stats.customerRetention > 65 ? 'up' : 'down',
      trendValue: '+2.1%',
      description: 'vs. mês anterior',
      color: 'text-purple-600',
      bgColor: 'bg-muted',
      progressColor: 'bg-purple-600'
    },
    {
      title: 'Crescimento de Vendas',
      value: `${stats.salesGrowth}%`,
      target: 15,
      current: stats.salesGrowth,
      icon: TrendingUp,
      trend: stats.salesGrowth > 10 ? 'up' : 'down',
      trendValue: '+1.8%',
      description: 'vs. mês anterior',
      color: 'text-orange-600',
      bgColor: 'bg-muted',
      progressColor: 'bg-orange-600'
    }
  ];

  const quickStats = [
    {
      label: 'Usuários Ativos',
      value: stats.activeUsers.toLocaleString('pt-BR'),
      icon: Users,
      change: '+5.2%',
      positive: true
    },
    {
      label: 'Pedidos Concluídos',
      value: stats.completedOrders.toString(),
      icon: ShoppingCart,
      change: '+12.1%',
      positive: true
    }
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Métricas de Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
            <span>Performance & Conversão</span>
          </CardTitle>
          <CardDescription>
            Acompanhe as principais métricas de performance do seu negócio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {performanceMetrics.map((metric, index) => {
              const Icon = metric.icon;
              const TrendIcon = metric.trend === 'up' ? ArrowUpRight : ArrowDownRight;
              const progressPercentage = (metric.current / metric.target) * 100;
              
              return (
                <div 
                  key={metric.title}
                  className="p-4 rounded-lg border"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={cn('p-2 rounded-lg', metric.bgColor)}>
                        <Icon className={cn('h-4 w-4', metric.color)} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{metric.title}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{metric.value}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={metric.trend === 'up' ? 'default' : 'destructive'}
                      className="flex items-center space-x-1"
                    >
                      <TrendIcon className="h-3 w-3" />
                      <span className="text-xs">{metric.trendValue}</span>
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Meta: {metric.target}{metric.title.includes('%') ? '%' : metric.title.includes('R$') ? '' : ''}</span>
                      <span className="text-muted-foreground">{progressPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(progressPercentage, 100)} 
                      className="h-2"
                    />
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={stat.positive ? 'default' : 'destructive'}
                    className="flex items-center space-x-1"
                  >
                    {stat.positive ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    <span className="text-xs">{stat.change}</span>
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
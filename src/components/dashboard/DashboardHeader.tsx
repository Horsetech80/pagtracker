'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  userName?: string;
  tenantName?: string;
  lastUpdate?: string;
  className?: string;
}

export function DashboardHeader({ 
  userName,
  tenantName = "Sua Empresa", 
  lastUpdate = "Há 2 minutos",
  className 
}: DashboardHeaderProps) {
  // Debug removido - funcionando corretamente
  
  // Exibir apenas o nome do usuário
  const displayName = userName || "Usuário";
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={cn('space-y-4 sm:space-y-6', className)}>
      {/* Header Principal */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <p className="text-responsive-sm text-muted-foreground">
            <span className="hidden sm:inline">{currentDate} • </span>
            <span className="sm:hidden">Hoje • </span>
            Acompanhe o desempenho do seu negócio
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-3">
          {/* Status de Atualização */}
          <div className="flex items-center space-x-1 sm:space-x-2 text-responsive-xs text-muted-foreground">
            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="hidden sm:inline">Atualizado {lastUpdate}</span>
            <span className="sm:hidden">{lastUpdate}</span>
          </div>

          {/* Ações Rápidas */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button variant="outline" size="sm" className="hidden md:flex btn-responsive-sm">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden lg:inline">Período</span>
            </Button>
            <Button variant="outline" size="sm" className="hidden md:flex btn-responsive-sm">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden lg:inline">Filtros</span>
            </Button>
            <Button variant="outline" size="sm" className="btn-responsive-sm">
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button variant="outline" size="sm" className="btn-responsive-sm">
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>


    </div>
  );
}
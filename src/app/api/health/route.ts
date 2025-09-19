/**
 * Health Check API - PagTracker v4.0
 * 
 * Endpoint simples para verificar a saúde da aplicação
 * Usado para monitoramento e load balancers
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  service: string;
  database?: {
    status: 'healthy' | 'unhealthy';
    responseTime?: number;
    error?: string;
  };
}

/**
 * GET /api/health - Health check simples
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const dbCheck = await checkDatabase();
    
    const healthStatus: HealthStatus = {
      status: dbCheck.status === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '4.0.0',
      service: 'PagTracker',
      database: dbCheck
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    return NextResponse.json(healthStatus, { status: statusCode });

  } catch (error) {
    console.error('Erro no health check:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '4.0.0',
      service: 'PagTracker',
      error: (error as Error).message
    }, { status: 503 });
  }
}

/**
 * Verifica o status do banco de dados
 */
async function checkDatabase() {
  const startTime = Date.now();
  
  try {
    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from('charges')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'unhealthy' as const,
        responseTime,
        error: error.message
      };
    }

    return {
      status: 'healthy' as const,
      responseTime
    };

  } catch (error) {
    return {
      status: 'unhealthy' as const,
      responseTime: Date.now() - startTime,
      error: (error as Error).message
    };
  }
}

/**
 * HEAD /api/health - Health check simples para load balancers
 */
export async function HEAD(): Promise<NextResponse> {
  try {
    const dbCheck = await checkDatabase();
    return new NextResponse(null, { 
      status: dbCheck.status === 'healthy' ? 200 : 503 
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
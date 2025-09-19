import { NextResponse } from 'next/server';

export type ApiErrorResponse = {
  error: string;
  message: string;
  status: number;
  details?: any;
};

/**
 * Cria uma resposta padronizada para erros de API
 */
export function createApiErrorResponse(
  status: number, 
  error: string, 
  message: string, 
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { error, message, status, details },
    { status }
  );
}

/**
 * Resposta para erro de não autorizado (401)
 */
export function createUnauthorizedResponse(message = 'Não autorizado'): NextResponse {
  return createApiErrorResponse(401, 'unauthorized', message);
}

/**
 * Resposta para erro de acesso negado (403)
 */
export function createForbiddenResponse(message = 'Acesso negado'): NextResponse {
  return createApiErrorResponse(403, 'forbidden', message);
}

/**
 * Resposta para erro de não encontrado (404)
 */
export function createNotFoundResponse(message = 'Recurso não encontrado'): NextResponse {
  return createApiErrorResponse(404, 'not_found', message);
}

/**
 * Resposta para erro de método não permitido (405)
 */
export function createMethodNotAllowedResponse(allowedMethods: string[]): NextResponse {
  return createApiErrorResponse(
    405, 
    'method_not_allowed', 
    'Método não permitido',
    { allowedMethods }
  );
}

/**
 * Resposta para erro de validação (422)
 */
export function createValidationErrorResponse(errors: Record<string, string[]>): NextResponse {
  return createApiErrorResponse(
    422, 
    'validation_failed', 
    'Falha na validação de dados',
    { errors }
  );
}

/**
 * Resposta para erro interno do servidor (500)
 */
export function createServerErrorResponse(error?: Error): NextResponse {
  const message = process.env.NODE_ENV === 'production'
    ? 'Erro interno do servidor'
    : error?.message || 'Erro interno do servidor';
    
  return createApiErrorResponse(500, 'server_error', message);
} 
/**
 * Classes de Erro Customizadas - PagTracker v4.0
 * 
 * Sistema padronizado de tratamento de erros com tipos específicos
 * para diferentes contextos da aplicação.
 */

export enum ErrorCode {
  // Erros de Autenticação
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Erros de Tenant
  TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
  TENANT_INACTIVE = 'TENANT_INACTIVE',
  TENANT_SUSPENDED = 'TENANT_SUSPENDED',
  
  // Erros de Validação
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Erros de PIX/EfiPay
  EFIPAY_API_ERROR = 'EFIPAY_API_ERROR',
  PIX_CREATION_FAILED = 'PIX_CREATION_FAILED',
  PIX_NOT_FOUND = 'PIX_NOT_FOUND',
  WEBHOOK_VALIDATION_FAILED = 'WEBHOOK_VALIDATION_FAILED',
  INVALID_PIX_KEY = 'INVALID_PIX_KEY',
  
  // Erros de Banco de Dados
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  
  // Erros de Sistema
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Erros de Configuração
  MISSING_CONFIGURATION = 'MISSING_CONFIGURATION',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION'
}

export interface ErrorContext {
  service?: string;
  tenantId?: string;
  userId?: string;
  requestId?: string;
  txid?: string;
  chave?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  originalError?: Error;
  [key: string]: any;
}

/**
 * Classe base para todos os erros customizados
 */
export abstract class BaseError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly context?: ErrorContext;
  public readonly timestamp: Date;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    context?: ErrorContext,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date();
    this.isOperational = isOperational;
    
    // Mantém o stack trace correto
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    };
  }
}

/**
 * Erros de Autenticação e Autorização
 */
export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication failed', context?: ErrorContext) {
    super(message, ErrorCode.UNAUTHORIZED, 401, context);
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string = 'Access forbidden', context?: ErrorContext) {
    super(message, ErrorCode.FORBIDDEN, 403, context);
  }
}

export class TokenExpiredError extends BaseError {
  constructor(message: string = 'Token has expired', context?: ErrorContext) {
    super(message, ErrorCode.TOKEN_EXPIRED, 401, context);
  }
}

/**
 * Erros de Tenant
 */
export class TenantNotFoundError extends BaseError {
  constructor(tenantId: string, context?: ErrorContext) {
    super(`Tenant not found: ${tenantId}`, ErrorCode.TENANT_NOT_FOUND, 404, {
      ...context,
      tenantId
    });
  }
}

export class TenantInactiveError extends BaseError {
  constructor(tenantId: string, context?: ErrorContext) {
    super(`Tenant is inactive: ${tenantId}`, ErrorCode.TENANT_INACTIVE, 403, {
      ...context,
      tenantId
    });
  }
}

/**
 * Erros de Validação
 */
export class ValidationError extends BaseError {
  public readonly fields?: Record<string, string[]>;

  constructor(
    message: string = 'Validation failed',
    fields?: Record<string, string[]>,
    context?: ErrorContext
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, context);
    this.fields = fields;
  }

  public toJSON() {
    return {
      ...super.toJSON(),
      fields: this.fields
    };
  }
}

export class InvalidInputError extends BaseError {
  constructor(field: string, value: any, context?: ErrorContext) {
    super(`Invalid input for field '${field}': ${value}`, ErrorCode.INVALID_INPUT, 400, {
      ...context,
      field,
      value
    });
  }
}

/**
 * Erros de PIX/EfiPay
 */
export class EfiPayError extends BaseError {
  public readonly efiPayCode?: string;
  public readonly efiPayMessage?: string;

  constructor(
    message: string,
    efiPayCode?: string,
    efiPayMessage?: string,
    context?: ErrorContext
  ) {
    super(message, ErrorCode.EFIPAY_API_ERROR, 502, {
      ...context,
      service: 'efipay',
      efiPayCode,
      efiPayMessage
    });
    this.efiPayCode = efiPayCode;
    this.efiPayMessage = efiPayMessage;
  }

  public toJSON() {
    return {
      ...super.toJSON(),
      efiPayCode: this.efiPayCode,
      efiPayMessage: this.efiPayMessage
    };
  }
}

export class PixCreationError extends BaseError {
  constructor(reason: string, context?: ErrorContext) {
    super(`Failed to create PIX: ${reason}`, ErrorCode.PIX_CREATION_FAILED, 500, {
      ...context,
      service: 'pix'
    });
  }
}

export class PixNotFoundError extends BaseError {
  constructor(txid: string, context?: ErrorContext) {
    super(`PIX not found: ${txid}`, ErrorCode.PIX_NOT_FOUND, 404, {
      ...context,
      service: 'pix',
      txid
    });
  }
}

export class WebhookValidationError extends BaseError {
  constructor(reason: string, context?: ErrorContext) {
    super(`Webhook validation failed: ${reason}`, ErrorCode.WEBHOOK_VALIDATION_FAILED, 400, {
      ...context,
      service: 'webhook'
    });
  }
}

/**
 * Erros de Banco de Dados
 */
export class DatabaseError extends BaseError {
  constructor(message: string, originalError?: Error, context?: ErrorContext) {
    super(message, ErrorCode.DATABASE_ERROR, 500, {
      ...context,
      originalError
    });
  }
}

export class RecordNotFoundError extends BaseError {
  constructor(entity: string, id: string, context?: ErrorContext) {
    super(`${entity} not found: ${id}`, ErrorCode.RECORD_NOT_FOUND, 404, {
      ...context,
      entity,
      id
    });
  }
}

/**
 * Erros de Sistema
 */
export class InternalServerError extends BaseError {
  constructor(message: string = 'Internal server error', context?: ErrorContext) {
    super(message, ErrorCode.INTERNAL_SERVER_ERROR, 500, context, false);
  }
}

export class ServiceUnavailableError extends BaseError {
  constructor(service: string, context?: ErrorContext) {
    super(`Service unavailable: ${service}`, ErrorCode.SERVICE_UNAVAILABLE, 503, {
      ...context,
      service
    });
  }
}

/**
 * Erros de Configuração
 */
export class ConfigurationError extends BaseError {
  constructor(setting: string, context?: ErrorContext) {
    super(`Missing or invalid configuration: ${setting}`, ErrorCode.MISSING_CONFIGURATION, 500, {
      ...context,
      setting
    }, false);
  }
}

/**
 * Utilitários para tratamento de erros
 */
export class ErrorUtils {
  /**
   * Verifica se um erro é operacional (esperado) ou um bug do sistema
   */
  static isOperationalError(error: Error): boolean {
    if (error instanceof BaseError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Converte um erro genérico em um erro customizado
   */
  static fromGenericError(error: Error, context?: ErrorContext): BaseError {
    if (error instanceof BaseError) {
      return error;
    }

    // Tenta identificar o tipo de erro baseado na mensagem
    if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
      return new AuthenticationError(error.message, context);
    }

    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return new ValidationError(error.message, undefined, context);
    }

    if (error.message.includes('not found')) {
      return new RecordNotFoundError('Resource', 'unknown', context);
    }

    // Erro genérico do sistema
    return new InternalServerError(error.message, {
      ...context,
      originalError: error
    });
  }

  /**
   * Extrai informações relevantes de um erro para logging
   */
  static extractErrorInfo(error: Error): {
    message: string;
    code?: string;
    statusCode?: number;
    context?: ErrorContext;
    stack?: string;
  } {
    if (error instanceof BaseError) {
      return {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        context: error.context,
        stack: error.stack
      };
    }

    return {
      message: error.message,
      stack: error.stack
    };
  }

  /**
   * Cria uma resposta HTTP padronizada para erros
   */
  static toHttpResponse(error: Error): {
    statusCode: number;
    body: {
      error: {
        code: string;
        message: string;
        context?: any;
        timestamp: string;
      };
    };
  } {
    if (error instanceof BaseError) {
      return {
        statusCode: error.statusCode,
        body: {
          error: {
            code: error.code,
            message: error.message,
            context: error.context,
            timestamp: error.timestamp.toISOString()
          }
        }
      };
    }

    return {
      statusCode: 500,
      body: {
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString()
        }
      }
    };
  }
}

// Exports de conveniência
export const createError = {
  auth: (message?: string, context?: ErrorContext) => new AuthenticationError(message, context),
  forbidden: (message?: string, context?: ErrorContext) => new AuthorizationError(message, context),
  validation: (message?: string, fields?: Record<string, string[]>, context?: ErrorContext) => 
    new ValidationError(message, fields, context),
  tenantNotFound: (tenantId: string, context?: ErrorContext) => new TenantNotFoundError(tenantId, context),
  efipay: (message: string, code?: string, efiMessage?: string, context?: ErrorContext) => 
    new EfiPayError(message, code, efiMessage, context),
  pixNotFound: (txid: string, context?: ErrorContext) => new PixNotFoundError(txid, context),
  database: (message: string, originalError?: Error, context?: ErrorContext) => 
    new DatabaseError(message, originalError, context),
  notFound: (entity: string, id: string, context?: ErrorContext) => 
    new RecordNotFoundError(entity, id, context),
  internal: (message?: string, context?: ErrorContext) => new InternalServerError(message, context),
  config: (setting: string, context?: ErrorContext) => new ConfigurationError(setting, context)
};
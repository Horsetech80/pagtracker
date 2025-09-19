/**
 * Erros de Domínio - Clean Architecture
 * Centraliza todos os erros de negócio da aplicação
 */

export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
}

export class AuthenticationError extends DomainError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly statusCode = 401;
}

export class AuthorizationError extends DomainError {
  readonly code = 'AUTHORIZATION_ERROR';
  readonly statusCode = 403;
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND_ERROR';
  readonly statusCode = 404;
}

export class BusinessRuleError extends DomainError {
  readonly code = 'BUSINESS_RULE_ERROR';
  readonly statusCode = 422;
}

export class ExternalServiceError extends DomainError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly statusCode = 502;
}

export class TenantAccessError extends DomainError {
  readonly code = 'TENANT_ACCESS_ERROR';
  readonly statusCode = 403;
}

export class ChargeError extends DomainError {
  readonly code = 'CHARGE_ERROR';
  readonly statusCode = 422;
}

export class PaymentError extends DomainError {
  readonly code = 'PAYMENT_ERROR';
  readonly statusCode = 422;
}

// Factory para criação de erros
export class DomainErrorFactory {
  static invalidCharge(message: string): ChargeError {
    return new ChargeError(message);
  }
  
  static chargeNotFound(): NotFoundError {
    return new NotFoundError('Cobrança não encontrada');
  }
  
  static invalidPayment(message: string): PaymentError {
    return new PaymentError(message);
  }
  
  static tenantAccessDenied(): TenantAccessError {
    return new TenantAccessError('Acesso negado ao tenant');
  }
  
  static invalidCredentials(): AuthenticationError {
    return new AuthenticationError('Credenciais inválidas');
  }
  
  static unauthorized(): AuthorizationError {
    return new AuthorizationError('Não autorizado');
  }
} 
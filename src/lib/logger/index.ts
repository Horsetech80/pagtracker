/**
 * Sistema de Logging Estruturado - PagTracker v4.0
 * 
 * Substitui console.log/console.error por um sistema profissional
 * com níveis de log, contexto e formatação estruturada.
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogContext {
  service?: string;
  tenantId?: string;
  userId?: string;
  requestId?: string;
  txid?: string;
  chave?: string;
  method?: string;
  endpoint?: string;
  duration?: number;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  stack?: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      ...(context && { context }),
      ...(error && { error: { name: error.name, message: error.message }, stack: error.stack })
    };

    if (this.isDevelopment) {
      // Formato colorido para desenvolvimento
      const colors = {
        [LogLevel.ERROR]: '\x1b[31m', // Vermelho
        [LogLevel.WARN]: '\x1b[33m',  // Amarelo
        [LogLevel.INFO]: '\x1b[36m',  // Ciano
        [LogLevel.DEBUG]: '\x1b[35m', // Magenta
        [LogLevel.TRACE]: '\x1b[37m'  // Branco
      };
      const reset = '\x1b[0m';
      const color = colors[level] || reset;
      
      return `${color}[${timestamp}] ${levelName}: ${message}${reset}${context ? '\n' + JSON.stringify(context, null, 2) : ''}${error ? '\n' + error.stack : ''}`;
    } else {
      // Formato JSON estruturado para produção
      return JSON.stringify(logEntry);
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context, error);
    
    if (level <= LogLevel.WARN) {
      console.error(formattedMessage);
    } else {
      console.log(formattedMessage);
    }

    // Em produção, aqui poderíamos enviar para serviços externos
    // como Sentry, DataDog, CloudWatch, etc.
    if (!this.isDevelopment && level <= LogLevel.ERROR) {
      this.sendToExternalService(level, message, context, error);
    }
  }

  private sendToExternalService(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    // Integração com serviços de monitoramento será implementada quando necessário
    // Exemplos: Sentry, DataDog, CloudWatch, etc.
  }

  // Métodos públicos para diferentes níveis de log
  public error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  public warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  public debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  public trace(message: string, context?: LogContext): void {
    this.log(LogLevel.TRACE, message, context);
  }

  // Métodos de conveniência para contextos específicos
  public efipay(level: 'error' | 'warn' | 'info' | 'debug', message: string, context?: LogContext): void {
    const efiContext = { service: 'efipay', ...context };
    this[level](message, efiContext);
  }

  public webhook(level: 'error' | 'warn' | 'info' | 'debug', message: string, context?: LogContext): void {
    const webhookContext = { service: 'webhook', ...context };
    this[level](message, webhookContext);
  }

  public pix(level: 'error' | 'warn' | 'info' | 'debug', message: string, context?: LogContext): void {
    const pixContext = { service: 'pix', ...context };
    this[level](message, pixContext);
  }

  public api(level: 'error' | 'warn' | 'info' | 'debug', message: string, context?: LogContext): void {
    const apiContext = { service: 'api', ...context };
    this[level](message, apiContext);
  }

  public auth(level: 'error' | 'warn' | 'info' | 'debug', message: string, context?: LogContext): void {
    const authContext = { service: 'auth', ...context };
    this[level](message, authContext);
  }

  // Método para criar contexto de request
  public createRequestContext(requestId: string, tenantId?: string, userId?: string): LogContext {
    return {
      requestId,
      ...(tenantId && { tenantId }),
      ...(userId && { userId })
    };
  }

  // Método para medir performance
  public time(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`Timer: ${label}`, { duration });
    };
  }
}

// Instância singleton
const logger = Logger.getInstance();

// Exports para facilitar o uso
export { logger };
export default logger;

// Exports de conveniência
export const log = {
  error: (message: string, context?: LogContext, error?: Error) => logger.error(message, context, error),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  trace: (message: string, context?: LogContext) => logger.trace(message, context),
  
  // Contextos específicos
  efipay: (level: 'error' | 'warn' | 'info' | 'debug', message: string, context?: LogContext) => 
    logger.efipay(level, message, context),
  webhook: (level: 'error' | 'warn' | 'info' | 'debug', message: string, context?: LogContext) => 
    logger.webhook(level, message, context),
  pix: (level: 'error' | 'warn' | 'info' | 'debug', message: string, context?: LogContext) => 
    logger.pix(level, message, context),
  api: (level: 'error' | 'warn' | 'info' | 'debug', message: string, context?: LogContext) => 
    logger.api(level, message, context),
  auth: (level: 'error' | 'warn' | 'info' | 'debug', message: string, context?: LogContext) => 
    logger.auth(level, message, context),
    
  // Utilitários
  time: (label: string) => logger.time(label),
  createContext: (requestId: string, tenantId?: string, userId?: string) => 
    logger.createRequestContext(requestId, tenantId, userId)
};
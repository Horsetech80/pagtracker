/**
 * Sistema de Configuração por Ambiente - PagTracker v4.0
 * 
 * Gerencia configurações específicas para desenvolvimento e produção,
 * incluindo logging, cache, rate limiting e integrações externas.
 */

import { LogLevel } from '../logger';

export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
  ssl: boolean;
}

export interface EfiPayConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  certificatePath: string;
  sandbox: boolean;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface LoggingConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableExternal: boolean;
  externalService?: {
    type: 'sentry' | 'datadog' | 'cloudwatch';
    dsn?: string;
    apiKey?: string;
    region?: string;
  };
}

export interface CacheConfig {
  enabled: boolean;
  provider: 'memory' | 'redis';
  ttl: number; // Time to live in seconds
  maxSize: number; // Max items in memory cache
  redis?: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
}

export interface RateLimitConfig {
  enabled: boolean;
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export interface SecurityConfig {
  cors: {
    origin: string | string[];
    credentials: boolean;
    methods: string[];
  };
  helmet: {
    enabled: boolean;
    contentSecurityPolicy: boolean;
    crossOriginEmbedderPolicy: boolean;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
}

export interface WebhookConfig {
  enabled: boolean;
  validateSignature: boolean;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface AppConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  adminPort: number;
  baseUrl: string;
  adminBaseUrl: string;
  database: DatabaseConfig;
  efipay: EfiPayConfig;
  logging: LoggingConfig;
  cache: CacheConfig;
  rateLimit: RateLimitConfig;
  security: SecurityConfig;
  webhook: WebhookConfig;
}

/**
 * Configurações padrão para desenvolvimento
 */
const developmentConfig: AppConfig = {
  env: 'development',
  port: 3000,
  adminPort: 3001,
  baseUrl: 'http://localhost:3000',
  adminBaseUrl: 'http://localhost:3001',
  
  database: {
    url: process.env.SUPABASE_URL || '',
    maxConnections: 10,
    connectionTimeout: 5000,
    queryTimeout: 10000,
    ssl: false
  },
  
  efipay: {
    baseUrl: 'https://pix-h.api.efipay.com.br',
    clientId: process.env.EFIPAY_CLIENT_ID || '',
    clientSecret: process.env.EFIPAY_CLIENT_SECRET || '',
    certificatePath: process.env.EFIPAY_CERTIFICATE_PATH || './certificates/efipay-prod.crt',
    sandbox: true,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  
  logging: {
    level: LogLevel.DEBUG,
    enableConsole: true,
    enableFile: false,
    enableExternal: false
  },
  
  cache: {
    enabled: true,
    provider: 'memory',
    ttl: 300, // 5 minutes
    maxSize: 1000
  },
  
  rateLimit: {
    enabled: false, // Desabilitado em desenvolvimento
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  
  security: {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    },
    helmet: {
      enabled: false, // Desabilitado em desenvolvimento
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'dev-secret-key',
      expiresIn: '24h',
      refreshExpiresIn: '7d'
    }
  },
  
  webhook: {
    enabled: true,
    validateSignature: true,
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 2000
  }
};

/**
 * Configurações para produção
 */
const productionConfig: AppConfig = {
  env: 'production',
  port: parseInt(process.env.PORT || '3000'),
  adminPort: parseInt(process.env.ADMIN_PORT || '3001'),
  baseUrl: process.env.BASE_URL || 'https://app.pagtracker.com',
  adminBaseUrl: process.env.ADMIN_BASE_URL || 'https://admin.pagtracker.com',
  
  database: {
    url: process.env.SUPABASE_URL || '',
    maxConnections: 50,
    connectionTimeout: 10000,
    queryTimeout: 30000,
    ssl: true
  },
  
  efipay: {
    baseUrl: 'https://pix.api.efipay.com.br',
    clientId: process.env.EFIPAY_CLIENT_ID || '',
    clientSecret: process.env.EFIPAY_CLIENT_SECRET || '',
    certificatePath: process.env.EFIPAY_CERTIFICATE_PATH || '/app/certificates/efipay-prod.crt',
    sandbox: false,
    timeout: 30000,
    retryAttempts: 5,
    retryDelay: 2000
  },
  
  logging: {
    level: LogLevel.INFO,
    enableConsole: false,
    enableFile: true,
    enableExternal: true,
    externalService: {
      type: 'sentry',
      dsn: process.env.SENTRY_DSN
    }
  },
  
  cache: {
    enabled: true,
    provider: 'redis',
    ttl: 3600, // 1 hour
    maxSize: 10000,
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 0
    }
  },
  
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },
  
  security: {
    cors: {
      origin: [
        process.env.BASE_URL || 'https://app.pagtracker.com',
        process.env.ADMIN_BASE_URL || 'https://admin.pagtracker.com'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    },
    helmet: {
      enabled: true,
      contentSecurityPolicy: true,
      crossOriginEmbedderPolicy: true
    },
    jwt: {
      secret: process.env.JWT_SECRET || '',
      expiresIn: '1h',
      refreshExpiresIn: '24h'
    }
  },
  
  webhook: {
    enabled: true,
    validateSignature: true,
    timeout: 15000,
    retryAttempts: 5,
    retryDelay: 5000
  }
};

/**
 * Configurações para testes
 */
const testConfig: AppConfig = {
  ...developmentConfig,
  env: 'test',
  port: 3002,
  adminPort: 3003,
  
  database: {
    ...developmentConfig.database,
    url: process.env.TEST_SUPABASE_URL || process.env.SUPABASE_URL || ''
  },
  
  logging: {
    level: LogLevel.ERROR, // Apenas erros em testes
    enableConsole: false,
    enableFile: false,
    enableExternal: false
  },
  
  cache: {
    enabled: false, // Cache desabilitado em testes
    provider: 'memory',
    ttl: 300,
    maxSize: 1000
  },
  
  webhook: {
    ...developmentConfig.webhook,
    enabled: false // Webhooks desabilitados em testes
  }
};

/**
 * Classe para gerenciar configurações
 */
class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    const env = process.env.NODE_ENV || 'development';
    
    switch (env) {
      case 'production':
        this.config = productionConfig;
        break;
      case 'test':
        this.config = testConfig;
        break;
      default:
        this.config = developmentConfig;
    }
    
    this.validateConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  public isDevelopment(): boolean {
    return this.config.env === 'development';
  }

  public isProduction(): boolean {
    return this.config.env === 'production';
  }

  public isTest(): boolean {
    return this.config.env === 'test';
  }

  private validateConfig(): void {
    const required = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    if (this.isProduction()) {
      required.push(
        'EFIPAY_CLIENT_ID',
        'EFIPAY_CLIENT_SECRET',
        'JWT_SECRET',
        'BASE_URL'
      );
    }

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Atualiza uma configuração específica (útil para testes)
   */
  public updateConfig<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config[key] = value;
  }

  /**
   * Reseta as configurações para os valores padrão
   */
  public resetConfig(): void {
    const env = process.env.NODE_ENV || 'development';
    
    switch (env) {
      case 'production':
        this.config = { ...productionConfig };
        break;
      case 'test':
        this.config = { ...testConfig };
        break;
      default:
        this.config = { ...developmentConfig };
    }
  }
}

// Instância singleton
const configManager = ConfigManager.getInstance();

// Exports
export { configManager };
export default configManager;

// Export de conveniência para acessar a configuração
export const config = configManager.getConfig();

// Utilitários de configuração
export const configUtils = {
  isDev: () => configManager.isDevelopment(),
  isProd: () => configManager.isProduction(),
  isTest: () => configManager.isTest(),
  get: <K extends keyof AppConfig>(key: K) => configManager.get(key),
  getConfig: () => configManager.getConfig()
};

// Validação de variáveis de ambiente obrigatórias
export function validateEnvironment(): void {
  configManager.getConfig(); // Isso irá validar automaticamente
}

// Helper para verificar se uma feature está habilitada
export function isFeatureEnabled(feature: keyof Pick<AppConfig, 'cache' | 'rateLimit' | 'webhook'>): boolean {
  const featureConfig = config[feature];
  return typeof featureConfig === 'object' && 'enabled' in featureConfig ? featureConfig.enabled : false;
}
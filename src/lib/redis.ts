/**
 * Redis Standard Connection - PagTracker v4.0
 * Versão padrão para gateway de pagamento
 */

let redisClient: any = null;

/**
 * Conectar ao Redis apenas no servidor
 */
export async function getRedisClient() {
  // Verificar se estamos no servidor
  if (typeof window !== 'undefined') {
    console.warn('[Redis] Cliente só funciona no servidor');
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  try {
    // Importar Redis dinamicamente apenas no servidor
    const { Redis } = await import('ioredis');
    
    const config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    };

    redisClient = new Redis(config);
    
    redisClient.on('connect', () => {
      console.log('✅ [Redis] Conectado');
    });
    
    redisClient.on('error', (error: Error) => {
      console.error('❌ [Redis] Erro:', error.message);
    });

    return redisClient;
    
  } catch (error) {
    console.error('❌ [Redis] Falha ao conectar:', error);
    
    // Fallback para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ [Redis] Usando mock para desenvolvimento');
      return createMockRedis();
    }
    
    return null;
  }
}

/**
 * Cache simples em memória para desenvolvimento
 */
function createMockRedis() {
  const store = new Map<string, { value: string; expiry?: number }>();
  
  return {
    async get(key: string) {
      const item = store.get(key);
      if (item?.expiry && Date.now() > item.expiry) {
        store.delete(key);
        return null;
      }
      return item?.value || null;
    },
    
    async set(key: string, value: string, mode?: string, duration?: number) {
      const expiry = mode === 'EX' && duration ? Date.now() + (duration * 1000) : undefined;
      store.set(key, { value, expiry });
      return 'OK';
    },
    
    async setex(key: string, seconds: number, value: string) {
      const expiry = Date.now() + (seconds * 1000);
      store.set(key, { value, expiry });
      return 'OK';
    },
    
    async del(key: string) {
      const existed = store.has(key);
      store.delete(key);
      return existed ? 1 : 0;
    },
    
    async ping() {
      return 'PONG';
    }
  };
}

/**
 * Fechar conexão Redis
 */
export async function closeRedis() {
  if (redisClient && typeof window === 'undefined') {
    try {
      await redisClient.quit();
      redisClient = null;
      console.log('✅ [Redis] Desconectado');
    } catch (error) {
      console.error('❌ [Redis] Erro ao desconectar:', error);
    }
  }
}

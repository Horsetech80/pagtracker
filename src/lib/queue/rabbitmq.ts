/**
 * RabbitMQ Mock/Stub para desenvolvimento
 * Em produção, deve ser substituído por implementação real
 */

import client from 'amqplib';

/**
 * Configuração do RabbitMQ
 */
export interface RabbitMQConfig {
  url: string;
  exchange?: string;
  queues?: {
    [key: string]: string;
  };
}

// Configuração padrão
const defaultConfig: RabbitMQConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://localhost',
  exchange: 'pagtracker',
  queues: {
    split: 'pagtracker.split',
    webhook: 'pagtracker.webhook',
    email: 'pagtracker.email',
  }
};

// Estado da conexão
class RabbitMQConnection {
  private connection: any = null;
  private channel: any = null;
  private connected: boolean = false;

  async connect(config: RabbitMQConfig = defaultConfig) {
    if (this.connected && this.channel) return;

    try {
      console.log('Conectando ao RabbitMQ:', config.url);
      this.connection = await client.connect(config.url);
      
      // Lidar com eventos da conexão
      this.connection.on('error', (err: Error) => {
        console.error('Erro na conexão RabbitMQ:', err);
        this.connection = null;
        this.channel = null;
        this.connected = false;
        setTimeout(() => this.connect(config), 5000);
      });
      
      this.connection.on('close', () => {
        console.log('Conexão RabbitMQ fechada, tentando reconectar...');
        this.connection = null;
        this.channel = null;
        this.connected = false;
        setTimeout(() => this.connect(config), 5000);
      });
      
      // Criar canal
      this.channel = await this.connection.createChannel();
      this.connected = true;
      
      // Configurar exchange
      if (config.exchange) {
        await this.channel.assertExchange(config.exchange, 'direct', { durable: true });
      }
      
      // Configurar filas
      if (config.queues) {
        for (const [name, routingKey] of Object.entries(config.queues)) {
          await this.channel.assertQueue(name, { durable: true });
          
          if (config.exchange) {
            await this.channel.bindQueue(name, config.exchange, routingKey);
          }
        }
      }
      
      console.log('Conexão com RabbitMQ estabelecida com sucesso');
    } catch (error) {
      console.error('Falha ao conectar ao RabbitMQ:', error);
      this.connection = null;
      this.channel = null;
      this.connected = false;
      setTimeout(() => this.connect(config), 5000);
    }
  }

  async sendToQueue(queue: string, message: any, options: any = {}) {
    try {
      if (!this.channel) {
        await this.connect();
        if (!this.channel) return false;
      }

      this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        persistent: true,
        ...options
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem para fila:', error);
      return false;
    }
  }

  async publish(exchange: string, routingKey: string, message: any, options: any = {}) {
    try {
      if (!this.channel) {
        await this.connect();
        if (!this.channel) return false;
      }

      return this.channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { persistent: true, ...options }
      );
    } catch (error) {
      console.error('Erro ao publicar mensagem:', error);
      return false;
    }
  }

  async consume(queue: string, callback: (message: any) => Promise<void>) {
    try {
      if (!this.channel) {
        await this.connect();
        if (!this.channel) return null;
      }
      
      // Garantir que a fila existe
      await this.channel.assertQueue(queue, { durable: true });
      
      // Configurar o prefetch
      this.channel.prefetch(1);
      
      // Consumir mensagens
      const consumeResult = await this.channel.consume(queue, async (msg: any) => {
        if (!msg || !this.channel) return;
        
        try {
          const content = JSON.parse(msg.content.toString());
          await callback(content);
          this.channel.ack(msg);
        } catch (error) {
          console.error(`Erro ao processar mensagem da fila ${queue}:`, error);
          this.channel.nack(msg, false, true);
        }
      });
      
      return consumeResult ? { consumerTag: consumeResult.consumerTag } : null;
    } catch (error) {
      console.error(`Erro ao consumir mensagens da fila ${queue}:`, error);
      return null;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      
      this.connected = false;
      console.log('Conexão com RabbitMQ fechada');
    } catch (error) {
      console.error('Erro ao fechar conexão com RabbitMQ:', error);
    }
  }
}

// Instância singleton
const mqConnection = new RabbitMQConnection();

/**
 * Inicializa a conexão com o RabbitMQ
 */
export async function initializeRabbitMQ(config: RabbitMQConfig = defaultConfig): Promise<void> {
  await mqConnection.connect(config);
}

/**
 * Publica uma mensagem na fila
 */
export async function publishMessage(
  queue: string,
  message: any,
  options: any = {},
  config: RabbitMQConfig = defaultConfig
): Promise<boolean> {
  if (config.exchange) {
    return mqConnection.publish(config.exchange, queue, message, options);
  } else {
    return mqConnection.sendToQueue(queue, message, options);
  }
}

/**
 * Consome mensagens de uma fila
 */
export async function consumeMessages(
  queue: string,
  callback: (message: any) => Promise<void>,
  config: RabbitMQConfig = defaultConfig
): Promise<{ consumerTag: string } | null> {
  return mqConnection.consume(queue, callback);
}

/**
 * Fecha a conexão com o RabbitMQ
 */
export async function closeRabbitMQ(): Promise<void> {
  await mqConnection.close();
} 
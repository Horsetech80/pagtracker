/**
 * Dependency Injection Container - Clean Architecture
 * Gerencia todas as dependências da aplicação
 */

import { ChargeRepository } from '@/application/repositories/ChargeRepository';
import { CreateChargeUseCase } from '@/application/use-cases/CreateCharge';
import { SupabaseChargeRepository } from '@/infrastructure/repositories/SupabaseChargeRepository';

// Definir tipos dos containers
export interface ApplicationContainer {
  chargeRepository: ChargeRepository;
  createChargeUseCase: CreateChargeUseCase;
}

// Container principal
class DIContainer {
  private static instance: DIContainer;
  private dependencies: Map<string, any> = new Map();

  private constructor() {
    this.setupDependencies();
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  private setupDependencies(): void {
    // Infrastructure
    this.register('chargeRepository', () => new SupabaseChargeRepository());

    // Use Cases
    this.register('createChargeUseCase', () => 
      new CreateChargeUseCase(this.resolve('chargeRepository'))
    );
  }

  register<T>(name: string, factory: () => T): void {
    this.dependencies.set(name, factory);
  }

  resolve<T>(name: string): T {
    const factory = this.dependencies.get(name);
    if (!factory) {
      throw new Error(`Dependency '${name}' not found in container`);
    }
    return factory();
  }

  // Helpers específicos para facilitar uso
  getChargeRepository(): ChargeRepository {
    return this.resolve<ChargeRepository>('chargeRepository');
  }

  getCreateChargeUseCase(): CreateChargeUseCase {
    return this.resolve<CreateChargeUseCase>('createChargeUseCase');
  }
}

// Factory functions para facilitar uso
export const container = DIContainer.getInstance();

export function getChargeRepository(): ChargeRepository {
  return container.getChargeRepository();
}

export function getCreateChargeUseCase(): CreateChargeUseCase {
  return container.getCreateChargeUseCase();
} 
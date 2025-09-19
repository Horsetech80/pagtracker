import { Charge } from "../../types/charge";

// LocalStorage wrapper para charges
const CHARGES_KEY = 'pagtracker_charges';

export function saveChargeToLocalStorage(charge: Charge): void {
  try {
    const charges = getChargesFromLocalStorage();
    const existingIndex = charges.findIndex(c => c.id === charge.id);
    
    if (existingIndex >= 0) {
      charges[existingIndex] = charge;
    } else {
      charges.push(charge);
    }
    
    localStorage.setItem(CHARGES_KEY, JSON.stringify(charges));
  } catch (error) {
    console.error('Erro ao salvar charge no localStorage:', error);
  }
}

export function getChargesFromLocalStorage(): Charge[] {
  try {
    const chargesStr = localStorage.getItem(CHARGES_KEY);
    return chargesStr ? JSON.parse(chargesStr) : [];
  } catch (error) {
    console.error('Erro ao obter charges do localStorage:', error);
    return [];
  }
}

export function getChargeFromLocalStorage(id: string): Charge | null {
  try {
    const charges = getChargesFromLocalStorage();
    return charges.find(c => c.id === id) || null;
  } catch (error) {
    console.error('Erro ao obter charge do localStorage:', error);
    return null;
  }
}

export function removeChargeFromLocalStorage(id: string): void {
  try {
    const charges = getChargesFromLocalStorage();
    const filteredCharges = charges.filter(c => c.id !== id);
    localStorage.setItem(CHARGES_KEY, JSON.stringify(filteredCharges));
  } catch (error) {
    console.error('Erro ao remover charge do localStorage:', error);
  }
}

export function clearChargesFromLocalStorage(): void {
  try {
    localStorage.removeItem(CHARGES_KEY);
  } catch (error) {
    console.error('Erro ao limpar charges do localStorage:', error);
  }
} 
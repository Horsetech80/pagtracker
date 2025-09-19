import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina classes CSS condicionalmente, mesclando classes do Tailwind de maneira inteligente
 * @param inputs Classes CSS para combinar
 * @returns String de classes CSS mescladas
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formata um valor monetário para o formato brasileiro (R$)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata uma data para o formato brasileiro DD/MM/YYYY HH:MM
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Calcula a diferença entre duas datas e retorna em formato amigável
 * Ex: "há 2 dias", "há 5 minutos", etc.
 */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Menos de 1 minuto
  if (seconds < 60) {
    return 'agora mesmo';
  }
  
  // Menos de 1 hora
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }
  
  // Menos de 1 dia
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }
  
  // Menos de 1 mês
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  }
  
  // Menos de 1 ano
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
  }
  
  // Mais de 1 ano
  const years = Math.floor(months / 12);
  return `há ${years} ${years === 1 ? 'ano' : 'anos'}`;
}

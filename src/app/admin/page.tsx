import { redirect } from 'next/navigation'

/**
 * PÁGINA PRINCIPAL DO PAINEL ADMINISTRATIVO
 * 
 * Esta página redireciona automaticamente para /admin/painel
 * quando alguém acessa /admin diretamente
 * 
 * Contexto: Painel administrativo do sistema (não confundir com cliente)
 */
export default function AdminRootPage() {
  // Redirecionamento server-side para evitar loops
  redirect('/admin/painel')
}
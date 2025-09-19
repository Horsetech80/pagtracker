'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * REDIRECIONAMENTO PARA LOGIN DO CLIENTE
 * 
 * Esta página redireciona /client/login para a página real de login do cliente
 * Redireciona para a página de login padrão do sistema
 */
export default function ClientLoginRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para a página real do login do cliente
    router.replace('/login')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando para o login do cliente...</p>
      </div>
    </div>
  )
}
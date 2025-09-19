'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * REDIRECIONAMENTO PARA PAINEL DO CLIENTE
 * 
 * ATENÇÃO: Esta página é apenas um redirecionamento simples
 * O painel do cliente REAL está em src/app/(dashboard)/
 * 
 * Função: Redirecionar /client para /dashboard (painel do cliente)
 * NÃO CONFUNDIR: Este não é o painel administrativo (que está em src/app/(admin)/)
 */
export default function ClientRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para o painel do cliente
    router.replace('/dashboard')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando para o painel do cliente...</p>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { AdminCard, AdminCardContent, AdminCardDescription, AdminCardHeader, AdminCardTitle } from '@/components/admin/ui/card'
import { AdminButton } from '@/components/admin/ui/button'
import { AdminInput } from '@/components/admin/ui/input'
import { AdminLabel } from '@/components/admin/ui/label'
import { Shield, Building2 } from 'lucide-react'

/**
 * LOGIN DO PAINEL ADMINISTRATIVO
 * 
 * EXCLUSIVO para super administradores do SISTEMA
 * NÃO CONFUNDIR com login do cliente (src/app/login/)
 * 
 * Função: Autenticação de admins que gerenciam o sistema
 * Acesso: Apenas emails autorizados na lista SUPER_ADMIN_EMAILS
 * Contexto: Administração global, sem tenant específico
 */
export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      alert('Por favor, preencha todos os campos')
      return
    }
    
    setIsLoading(true)
    
    try {
      const { adminSignIn } = await import('@/lib/supabase/admin-client')
      const { data, error } = await adminSignIn(email, password)
      
      if (error) {
        console.error('Erro no login admin:', error)
        alert('Erro no login: ' + error.message)
        return
      }
      
      if (data?.user) {
        console.log('Login admin realizado com sucesso')
        window.location.href = '/admin/painel'
      }
    } catch (error) {
      console.error('Erro inesperado:', error)
      alert('Erro inesperado no login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-6">
        <AdminCard className="card-modern">
          <AdminCardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <AdminCardTitle className="text-2xl font-bold text-foreground">
              Seja bem-vindo(a)!
            </AdminCardTitle>
            <AdminCardDescription className="text-muted-foreground">
              Faça o login para continuar
            </AdminCardDescription>
            <p className="text-sm text-muted-foreground mt-2">
              Para fazer o login, preencha os dados abaixo e clique em entrar.
            </p>
            <div className="flex items-center justify-center mt-2">
              <Building2 className="h-4 w-4 text-primary mr-2" />
              <span className="text-sm font-medium text-primary">PagTracker Admin v4.0</span>
            </div>
          </AdminCardHeader>
          <AdminCardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <AdminLabel htmlFor="admin-email">Email Administrativo</AdminLabel>
                <AdminInput
                  id="admin-email"
                  type="email"
                  placeholder="admin@pagtracker.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="border-input focus:border-ring focus:ring-ring"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <AdminLabel htmlFor="admin-password">Senha</AdminLabel>
                <AdminInput
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="border-input focus:border-ring focus:ring-ring"
                  required
                />
              </div>

              <AdminButton 
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-primary-foreground" 
                disabled={isLoading}
              >
                {isLoading ? 'Acessando...' : 'Acessar Painel Administrativo'}
              </AdminButton>
            </form>
            
            <div className="mt-6 text-center">
              <div className="bg-muted border border-border rounded-lg p-3">
                <p className="text-xs text-foreground font-medium">
                  🔐 Painel Administrativo
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Acesso restrito para super administradores
                </p>
              </div>
            </div>
          </AdminCardContent>
        </AdminCard>
      </div>
    </div>
  )
}
// LOGIN DO PAINEL CLIENTE/GATEWAY
// 
// EXCLUSIVO para usuários de TENANTS/CLIENTES
// NÃO CONFUNDIR com login administrativo (src/app/(admin)/login/)
// 
// Função: Autenticação de usuários que operam dentro de um tenant
// Acesso: Usuários cadastrados em tenant_users
// Contexto: Operações específicas do tenant (vendas, cobranças, etc.)

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/lib/hooks/use-toast';
import { signIn } from '@/lib/supabase/auth';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mostrar mensagens de erro relacionadas a tenant
  useEffect(() => {
    const error = searchParams.get('error');
    
    if (error) {
      let title = "Erro de Acesso";
      let description = "";
      
      switch (error) {
        case 'no-tenant-access':
          title = "Acesso Negado";
          description = "Você não tem acesso a nenhum tenant. Entre em contato com o administrador.";
          break;
        case 'invalid-tenant':
          title = "Tenant Inválido";
          description = "O tenant associado à sua conta está inativo ou foi removido.";
          break;
        case 'tenant-error':
          title = "Erro de Sistema";
          description = "Erro ao verificar permissões de tenant. Tente novamente.";
          break;
        default:
          title = "Erro";
          description = "Ocorreu um erro. Tente novamente.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Erro ao fazer login",
          description: error.message || "Credenciais inválidas",
          variant: "destructive",
        });
        return;
      }

      if (data?.user) {
        toast({
          title: "Login realizado com sucesso",
          description: "Redirecionando...",
        });
        
        // Verificar se há um parâmetro redirect
        const redirectTo = searchParams.get('redirect') || '/dashboard';
        
        // Redireciona para a URL especificada ou dashboard por padrão
        router.push(redirectTo);
        router.refresh(); // Garante que a sessão do cliente seja atualizada
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer login. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Entrar no PagTracker
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Acesse sua conta para gerenciar pagamentos
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Digite suas credenciais para acessar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            
            <div className="mt-4 text-center space-y-2">
              <div>
                <span className="text-sm text-gray-600">Não tem uma conta? </span>
                <Link href="/register" className="text-sm text-blue-600 hover:text-blue-500">
                  Criar conta
                </Link>
              </div>
              <div>
                <Link href="/" className="text-sm text-blue-600 hover:text-blue-500">
                  Voltar para a página inicial
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
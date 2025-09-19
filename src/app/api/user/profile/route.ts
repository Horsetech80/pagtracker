import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth } from '@/middleware/api/tenant-auth';
import { createServerClient } from '@supabase/ssr';

export const GET = withTenantAuth(async (request: NextRequest, tenantInfo) => {
  try {
    console.log('[PROFILE API] Iniciando busca do perfil do usuário');
    console.log('[PROFILE API] Tenant Info:', { tenantId: tenantInfo.tenantId, userId: tenantInfo.userId });
    
    // Usar o mesmo cliente que o middleware para manter consistência
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
        global: {
          headers: bearerToken ? {
            Authorization: `Bearer ${bearerToken}`
          } : {}
        }
      }
    );
    
    // Buscar dados do usuário na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', tenantInfo.userId)
      .eq('tenant_id', tenantInfo.tenantId)
      .single();
    if (userError) {
      console.error('[PROFILE API] Erro ao buscar dados do usuário:', userError);
      return NextResponse.json(
        { error: 'Erro ao carregar dados do perfil' },
        { status: 500 }
      );
    }

    if (!userData) {
      console.log('[PROFILE API] Usuário não encontrado');
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    console.log('[PROFILE API] Retornando dados do usuário:', {
      id: userData.id,
      nome: userData.nome,
      email: userData.email,
      hasAvatar: !!userData.avatar_url,
      verificationStatus: userData.verification_status
    });

    return NextResponse.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('[PROFILE API] Erro interno:', {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

export const PUT = withTenantAuth(async (request: NextRequest, tenantInfo) => {
  try {
    console.log('[PROFILE API] Iniciando atualização do perfil');
    console.log('[PROFILE API] Tenant Info:', { tenantId: tenantInfo.tenantId, userId: tenantInfo.userId });
    
    // Usar o mesmo cliente que o middleware para manter consistência
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
        global: {
          headers: bearerToken ? {
            Authorization: `Bearer ${bearerToken}`
          } : {}
        }
      }
    );

    const body = await request.json();
    const { nome, telefone, cpf, endereco, cidade, estado, cep } = body;
    
    console.log('[PROFILE API] Dados recebidos para atualização:', {
      nome: nome || 'vazio',
      telefone: telefone || 'vazio',
      cpf: cpf || 'vazio',
      endereco: endereco || 'vazio',
      cidade: cidade || 'vazio',
      estado: estado || 'vazio',
      cep: cep || 'vazio'
    });

    // Validar dados obrigatórios (nome é sempre obrigatório)
    if (!nome || nome.trim() === '') {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }
    
    // Validar formato do CPF se fornecido
    if (cpf && cpf.replace(/\D/g, '').length !== 11) {
      return NextResponse.json(
        { error: 'CPF deve ter 11 dígitos' },
        { status: 400 }
      );
    }
    
    // Validar formato do telefone se fornecido
    if (telefone && telefone.replace(/\D/g, '').length < 10) {
      return NextResponse.json(
        { error: 'Telefone deve ter pelo menos 10 dígitos' },
        { status: 400 }
      );
    }

    // Atualizar dados do usuário
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        nome,
        telefone,
        cpf,
        endereco,
        cidade,
        estado,
        cep,
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantInfo.userId)
      .eq('tenant_id', tenantInfo.tenantId)
      .select('id, nome, email, telefone, cpf, endereco, cidade, estado, cep, avatar_url, created_at, last_login, email_verified, two_factor_enabled')
      .single();

    if (updateError) {
      console.error('[PROFILE API] Erro ao atualizar dados do usuário:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar dados do usuário' },
        { status: 500 }
      );
    }

    console.log('[PROFILE API] Perfil atualizado com sucesso:', {
      id: updatedUser.id,
      nome: updatedUser.nome
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'Perfil atualizado com sucesso',
        user: updatedUser 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[PROFILE API] Erro interno na atualização:', {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [KYC-API] Iniciando requisição...');
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    console.log('🔍 [KYC-API] Parâmetros:', { status, priority, page, limit, offset });

    const supabase = await createClient();

    // Verificar se o usuário está autenticado e é admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ [KYC-API] Erro de autenticação:', authError);
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    console.log('✅ [KYC-API] Usuário autenticado:', user.id);

    // Verificar se é admin na tabela admin_users
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('role, is_active, name')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    console.log('🔍 [KYC-API] Verificação de admin:', { adminData, adminError });

    if (adminError || !adminData) {
      console.error('❌ [KYC-API] Usuário não é administrador:', adminError);
      return NextResponse.json(
        { error: 'Acesso negado - usuário não é administrador' },
        { status: 403 }
      );
    }

    console.log('✅ [KYC-API] Admin verificado:', adminData);

    // Construir query base
    console.log('🔍 [KYC-API] Construindo query...');
    
    let query = supabase
      .from('kyc_verifications')
      .select(`
        *,
        users!inner(
          id,
          email,
          full_name,
          cpf,
          phone
        ),
        tenants!inner(
          id,
          name,
          cnpj
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    console.log('🔍 [KYC-API] Query construída, aplicando filtros...');

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('status', status);
      console.log('🔍 [KYC-API] Filtro de status aplicado:', status);
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
      console.log('🔍 [KYC-API] Filtro de prioridade aplicado:', priority);
    }

    console.log('🔍 [KYC-API] Executando query principal...');

    const { data: verifications, error: fetchError } = await query;

    if (fetchError) {
      console.error('❌ [KYC-API] Erro ao buscar verificações KYC:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao buscar verificações' },
        { status: 500 }
      );
    }

    console.log('✅ [KYC-API] Verificações encontradas:', verifications?.length || 0);

    // Buscar total de registros para paginação
    console.log('🔍 [KYC-API] Buscando total de registros...');
    
    let countQuery = supabase
      .from('kyc_verifications')
      .select('*', { count: 'exact', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    if (priority && priority !== 'all') {
      countQuery = countQuery.eq('priority', priority);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('⚠️ [KYC-API] Erro ao contar verificações:', countError);
    }

    console.log('✅ [KYC-API] Total de registros:', count);

    const response = {
      verifications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

    console.log('✅ [KYC-API] Resposta preparada, enviando...');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [KYC-API] Erro na API de verificações KYC:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { document_urls } = body;

    if (!document_urls) {
      return NextResponse.json(
        { error: 'URLs dos documentos são obrigatórias' },
        { status: 400 }
      );
    }

    // Validar se todos os documentos obrigatórios estão presentes
    const requiredDocuments = ['identity', 'address', 'selfie'];
    const missingDocuments = requiredDocuments.filter(doc => !document_urls[doc]);

    if (missingDocuments.length > 0) {
      return NextResponse.json(
        { error: `Documentos obrigatórios faltando: ${missingDocuments.join(', ')}` },
        { status: 400 }
      );
    }

    // Verificar se o usuário já tem uma verificação em andamento
    const { data: existingVerification, error: checkError } = await supabase
      .from('kyc_verifications')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erro ao verificar verificação existente:', checkError);
      return NextResponse.json(
        { error: 'Erro ao verificar status de verificação' },
        { status: 500 }
      );
    }

    if (existingVerification) {
      return NextResponse.json(
        { error: 'Já existe uma verificação KYC pendente' },
        { status: 400 }
      );
    }

    // Criar nova verificação KYC
    const { data: verification, error: createError } = await supabase
      .from('kyc_verifications')
      .insert({
        user_id: user.id,
        identity_document_url: document_urls.identity,
        address_document_url: document_urls.address,
        selfie_url: document_urls.selfie,
        status: 'pending',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Erro ao criar verificação KYC:', createError);
      return NextResponse.json(
        { error: 'Erro ao criar verificação KYC' },
        { status: 500 }
      );
    }

    // Atualizar status de verificação do usuário
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ 
        verification_status: 'in_review',
        document_urls: document_urls
      })
      .eq('id', user.id);

    if (updateUserError) {
      console.error('Erro ao atualizar status do usuário:', updateUserError);
      return NextResponse.json(
        { error: 'Erro ao atualizar status de verificação' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Documentos enviados para verificação com sucesso',
      verification_id: verification.id,
      status: 'in_review'
    });

  } catch (error) {
    console.error('Erro na API de submissão KYC:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar verificações KYC do usuário
    const { data: verifications, error: fetchError } = await supabase
      .from('kyc_verifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Erro ao buscar verificações KYC:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao buscar verificações' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      verifications: verifications || []
    });

  } catch (error) {
    console.error('Erro na API de consulta KYC:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
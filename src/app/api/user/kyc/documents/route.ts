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

    const formData = await request.formData();
    const file = formData.get('document') as File;
    const documentType = formData.get('type') as string;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'Arquivo e tipo de documento são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar tipo de documento
    const validTypes = ['identity', 'address', 'selfie'];
    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        { error: 'Tipo de documento inválido' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedMimeTypes = documentType === 'selfie'
      ? ['image/jpeg', 'image/png', 'image/webp']
      : ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de arquivo não permitido para ${documentType}` },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 10MB' },
        { status: 400 }
      );
    }

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split('.').pop();
    const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExtension}`;

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(fileName, uint8Array, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      return NextResponse.json(
        { error: 'Erro ao fazer upload do arquivo' },
        { status: 500 }
      );
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(fileName);

    const documentUrl = urlData.publicUrl;

    // Buscar document_urls atual do usuário
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('document_urls')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar dados do usuário:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao buscar dados do usuário' },
        { status: 500 }
      );
    }

    // Atualizar document_urls
    const currentDocuments = userData.document_urls || {};
    const updatedDocuments = {
      ...currentDocuments,
      [documentType]: documentUrl
    };

    // Atualizar no banco de dados
    const { error: updateError } = await supabase
      .from('users')
      .update({ document_urls: updatedDocuments })
      .eq('id', user.id);

    if (updateError) {
      console.error('Erro ao atualizar document_urls:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar documento no perfil' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Documento enviado com sucesso',
      document_url: documentUrl,
      document_type: documentType
    });

  } catch (error) {
    console.error('Erro na API de upload de documentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('type');

    if (!documentType) {
      return NextResponse.json(
        { error: 'Tipo de documento é obrigatório' },
        { status: 400 }
      );
    }

    // Validar tipo de documento
    const validTypes = ['identity', 'address', 'selfie'];
    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        { error: 'Tipo de documento inválido' },
        { status: 400 }
      );
    }

    // Buscar document_urls atual do usuário
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('document_urls')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar dados do usuário:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao buscar dados do usuário' },
        { status: 500 }
      );
    }

    const currentDocuments = userData.document_urls || {};
    const documentUrl = currentDocuments[documentType];

    if (documentUrl) {
      // Extrair o caminho do arquivo da URL
      const urlParts = documentUrl.split('/kyc-documents/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        
        // Remover arquivo do storage
        const { error: deleteError } = await supabase.storage
          .from('kyc-documents')
          .remove([filePath]);

        if (deleteError) {
          console.error('Erro ao remover arquivo:', deleteError);
        }
      }
    }

    // Remover documento do document_urls
    const updatedDocuments = { ...currentDocuments };
    delete updatedDocuments[documentType];

    // Atualizar no banco de dados
    const { error: updateError } = await supabase
      .from('users')
      .update({ document_urls: updatedDocuments })
      .eq('id', user.id);

    if (updateError) {
      console.error('Erro ao atualizar document_urls:', updateError);
      return NextResponse.json(
        { error: 'Erro ao remover documento do perfil' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Documento removido com sucesso'
    });

  } catch (error) {
    console.error('Erro na API de remoção de documentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth } from '@/middleware/api/tenant-auth';
import { createServerClient } from '@supabase/ssr';

export const POST = withTenantAuth(async (request: NextRequest, tenantInfo) => {
  try {
    console.log('[AVATAR API] Iniciando upload de avatar');
    console.log('[AVATAR API] Tenant Info:', { tenantId: tenantInfo.tenantId, userId: tenantInfo.userId });
    
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[AVATAR API] Auth check:', { user: user?.id, authError });

    if (authError || !user) {
      console.log('[AVATAR API] Usuário não autenticado:', authError);
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.' },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 5MB.' },
        { status: 400 }
      );
    }

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`;
    const filePath = `avatars/${fileName}`;

    // Upload para o Supabase Storage
    console.log('[AVATAR API] Tentando upload para:', filePath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    console.log('[AVATAR API] Resultado do upload:', { uploadData, uploadError });

    if (uploadError) {
      console.error('[AVATAR API] Erro no upload:', uploadError);
      return NextResponse.json(
        { error: 'Erro ao fazer upload do arquivo' },
        { status: 500 }
      );
    }

    // Obter URL pública do arquivo
    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);

    // Atualizar avatar_url na tabela users
    console.log('[AVATAR API] Atualizando avatar_url para usuário:', user.id);
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    console.log('[AVATAR API] Resultado da atualização:', { updateError });

    if (updateError) {
      console.error('[AVATAR API] Erro ao atualizar avatar:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar foto de perfil' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Foto de perfil atualizada com sucesso',
        avatar_url: publicUrl
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[AVATAR API] Erro na API de avatar:', error);
    console.error('[AVATAR API] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

export const DELETE = withTenantAuth(async (request: NextRequest, tenantInfo) => {
  try {
    console.log('[AVATAR API] Iniciando remoção de avatar');
    console.log('[AVATAR API] Tenant Info:', { tenantId: tenantInfo.tenantId, userId: tenantInfo.userId });
    
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[AVATAR API] Auth check:', { user: user?.id, authError });

    if (authError || !user) {
      console.log('[AVATAR API] Usuário não autenticado:', authError);
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar avatar atual
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Erro ao buscar dados do usuário' },
        { status: 500 }
      );
    }

    // Se há um avatar, remover do storage
    if (userData.avatar_url) {
      const fileName = userData.avatar_url.split('/').pop();
      if (fileName) {
        const filePath = `avatars/${fileName}`;
        
        const { error: deleteError } = await supabase.storage
          .from('user-uploads')
          .remove([filePath]);

        if (deleteError) {
          console.error('Erro ao deletar arquivo:', deleteError);
        }
      }
    }

    // Remover avatar_url da tabela users
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Erro ao remover avatar:', updateError);
      return NextResponse.json(
        { error: 'Erro ao remover foto de perfil' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Foto de perfil removida com sucesso' },
      { status: 200 }
    );

  } catch (error) {
    console.error('[AVATAR API] Erro na API de remoção de avatar:', error);
    console.error('[AVATAR API] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});
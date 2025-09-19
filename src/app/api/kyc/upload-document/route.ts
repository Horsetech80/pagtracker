import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface UploadResponse {
  success: boolean;
  url?: string;
  documentId?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const tenantId = formData.get('tenantId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      );
    }

    if (!type || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tipo de documento e tenantId são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de arquivo não suportado' },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Tamanho máximo: 5MB' },
        { status: 400 }
      );
    }

    // Criar diretório se não existir
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'kyc', tenantId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${type}_${timestamp}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    // Salvar arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // URL pública do arquivo
    const publicUrl = `/uploads/kyc/${tenantId}/${fileName}`;
    const documentId = `${type}_${timestamp}`;

    // Aqui você pode salvar as informações no banco de dados
    // await saveDocumentToDatabase({
    //   id: documentId,
    //   tenantId,
    //   type,
    //   fileName,
    //   filePath: publicUrl,
    //   originalName: file.name,
    //   size: file.size,
    //   mimeType: file.type,
    //   status: 'pending_review',
    //   uploadedAt: new Date().toISOString()
    // });

    // Notificar o painel admin sobre o novo documento
    // await notifyAdminNewDocument({
    //   tenantId,
    //   documentType: type,
    //   documentId,
    //   uploadedAt: new Date().toISOString()
    // });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      documentId
    });

  } catch (error) {
    console.error('Erro no upload do documento:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para salvar documento no banco de dados (implementar conforme seu ORM/banco)
async function saveDocumentToDatabase(documentData: any) {
  // Implementar salvamento no banco de dados
  // Exemplo com Prisma:
  // return await prisma.kycDocument.create({
  //   data: documentData
  // });
  
  console.log('Salvando documento no banco:', documentData);
}

// Função para notificar admin sobre novo documento (implementar conforme seu sistema de notificações)
async function notifyAdminNewDocument(notificationData: any) {
  // Implementar notificação para o admin
  // Pode ser via WebSocket, email, push notification, etc.
  
  console.log('Notificando admin sobre novo documento:', notificationData);
}
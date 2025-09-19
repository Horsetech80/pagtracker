'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Eye,
  Trash2,
  Camera,
  FileImage,
  File
} from 'lucide-react';
import { useTenantId } from '@/lib/hooks/useTenantId';

export interface DocumentFile {
  id: string;
  type: 'rg' | 'cnh' | 'comprovante_endereco';
  file: File;
  url?: string;
  status: 'uploading' | 'uploaded' | 'error' | 'pending_review' | 'approved' | 'rejected';
  uploadProgress?: number;
  rejectionReason?: string;
  uploadedAt?: string;
}

interface DocumentUploadProps {
  onDocumentsChange?: (documents: DocumentFile[]) => void;
  initialDocuments?: DocumentFile[];
  disabled?: boolean;
}

const DOCUMENT_TYPES = {
  rg: {
    label: 'RG (Registro Geral)',
    description: 'Documento de identidade com foto',
    icon: FileText,
    acceptedFormats: '.pdf,.jpg,.jpeg,.png',
    maxSize: 5 * 1024 * 1024, // 5MB
    required: true
  },
  cnh: {
    label: 'CNH (Carteira de Motorista)',
    description: 'Carteira Nacional de Habilitação',
    icon: FileImage,
    acceptedFormats: '.pdf,.jpg,.jpeg,.png',
    maxSize: 5 * 1024 * 1024, // 5MB
    required: false
  },
  comprovante_endereco: {
    label: 'Comprovante de Endereço',
    description: 'Conta de luz, água, telefone ou extrato bancário (últimos 3 meses)',
    icon: File,
    acceptedFormats: '.pdf,.jpg,.jpeg,.png',
    maxSize: 5 * 1024 * 1024, // 5MB
    required: true
  }
};

export function DocumentUpload({ 
  onDocumentsChange, 
  initialDocuments = [], 
  disabled = false 
}: DocumentUploadProps) {
  const [documents, setDocuments] = useState<DocumentFile[]>(initialDocuments);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const tenantId = useTenantId();
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const updateDocuments = (newDocuments: DocumentFile[]) => {
    setDocuments(newDocuments);
    onDocumentsChange?.(newDocuments);
  };

  const handleFileSelect = async (type: keyof typeof DOCUMENT_TYPES, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const documentType = DOCUMENT_TYPES[type];

    // Validar tamanho do arquivo
    if (file.size > documentType.maxSize) {
      toast.error(`Arquivo muito grande. Tamanho máximo: ${documentType.maxSize / (1024 * 1024)}MB`);
      return;
    }

    // Validar tipo do arquivo
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!documentType.acceptedFormats.includes(fileExtension)) {
      toast.error(`Formato não suportado. Formatos aceitos: ${documentType.acceptedFormats}`);
      return;
    }

    // Remover documento existente do mesmo tipo
    const filteredDocuments = documents.filter(doc => doc.type !== type);

    // Criar novo documento
    const newDocument: DocumentFile = {
      id: `${type}_${Date.now()}`,
      type,
      file,
      status: 'uploading',
      uploadProgress: 0
    };

    const updatedDocuments = [...filteredDocuments, newDocument];
    updateDocuments(updatedDocuments);

    // Simular upload
    await uploadDocument(newDocument);
  };

  const uploadDocument = async (document: DocumentFile) => {
    try {
      // Simular progresso de upload
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setDocuments(prev => prev.map(doc => 
          doc.id === document.id 
            ? { ...doc, uploadProgress: progress }
            : doc
        ));
      }

      // Simular chamada para API
      const formData = new FormData();
      formData.append('file', document.file);
      formData.append('type', document.type);
      formData.append('tenantId', String(tenantId || ''));

      // Aqui seria feita a chamada real para a API
      // const response = await fetch('/api/kyc/upload-document', {
      //   method: 'POST',
      //   body: formData
      // });

      // Simular resposta de sucesso
      const mockResponse = {
        success: true,
        url: `/uploads/kyc/${document.type}_${Date.now()}.${document.file.name.split('.').pop()}`,
        documentId: document.id
      };

      if (mockResponse.success) {
        setDocuments(prev => prev.map(doc => 
          doc.id === document.id 
            ? { 
                ...doc, 
                status: 'pending_review',
                url: mockResponse.url,
                uploadedAt: new Date().toISOString(),
                uploadProgress: 100
              }
            : doc
        ));
        
        toast.success(`${DOCUMENT_TYPES[document.type].label} enviado com sucesso!`);
      } else {
        throw new Error('Erro no upload');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      
      setDocuments(prev => prev.map(doc => 
        doc.id === document.id 
          ? { ...doc, status: 'error' }
          : doc
      ));
      
      toast.error(`Erro ao enviar ${DOCUMENT_TYPES[document.type].label}. Tente novamente.`);
    }
  };

  const removeDocument = (documentId: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    updateDocuments(updatedDocuments);
    toast.success('Documento removido');
  };

  const getDocumentByType = (type: keyof typeof DOCUMENT_TYPES) => {
    return documents.find(doc => doc.type === type);
  };

  const getStatusIcon = (status: DocumentFile['status']) => {
    switch (status) {
      case 'uploaded':
      case 'pending_review':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-600 animate-pulse" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: DocumentFile['status']) => {
    switch (status) {
      case 'uploaded':
      case 'pending_review':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Aguardando Análise</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro no Upload</Badge>;
      case 'uploading':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Enviando...</Badge>;
      default:
        return <Badge variant="secondary">Não Enviado</Badge>;
    }
  };

  const handleDragOver = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    setDragOver(type);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, type: keyof typeof DOCUMENT_TYPES) => {
    e.preventDefault();
    setDragOver(null);
    
    const files = e.dataTransfer.files;
    handleFileSelect(type, files);
  };

  const allRequiredDocumentsUploaded = () => {
    const requiredTypes = Object.entries(DOCUMENT_TYPES)
      .filter(([_, config]) => config.required)
      .map(([type, _]) => type as keyof typeof DOCUMENT_TYPES);
    
    return requiredTypes.every(type => {
      const doc = getDocumentByType(type);
      return doc && ['uploaded', 'pending_review', 'approved'].includes(doc.status);
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Upload de Documentos</span>
          </CardTitle>
          <CardDescription>
            Envie seus documentos para verificação de identidade. Os documentos marcados como obrigatórios são necessários para completar o processo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(DOCUMENT_TYPES).map(([type, config]) => {
            const document = getDocumentByType(type as keyof typeof DOCUMENT_TYPES);
            const Icon = config.icon;
            
            return (
              <div key={type} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium flex items-center space-x-2">
                        <span>{config.label}</span>
                        {config.required && (
                          <Badge variant="outline" className="text-xs">Obrigatório</Badge>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Formatos: {config.acceptedFormats} | Tamanho máximo: {config.maxSize / (1024 * 1024)}MB
                      </p>
                    </div>
                  </div>
                  
                  {document && (
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(document.status)}
                      {getStatusBadge(document.status)}
                    </div>
                  )}
                </div>
                
                {document ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4" />
                        <div>
                          <p className="text-sm font-medium">{document.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(document.file.size / (1024 * 1024)).toFixed(2)} MB
                            {document.uploadedAt && (
                              <> • Enviado em {new Date(document.uploadedAt).toLocaleString()}</>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {document.url && (
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => removeDocument(document.id)}
                          disabled={disabled}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {document.status === 'uploading' && document.uploadProgress !== undefined && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Enviando...</span>
                          <span>{document.uploadProgress}%</span>
                        </div>
                        <Progress value={document.uploadProgress} className="h-2" />
                      </div>
                    )}
                    
                    {document.status === 'rejected' && document.rejectionReason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Motivo da rejeição:</strong> {document.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragOver === type
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-primary/50'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onDragOver={(e) => handleDragOver(e, type)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, type as keyof typeof DOCUMENT_TYPES)}
                    onClick={() => {
                      if (!disabled) {
                        fileInputRefs.current[type]?.click();
                      }
                    }}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium mb-1">Clique para enviar ou arraste o arquivo</p>
                    <p className="text-xs text-muted-foreground">
                      {config.acceptedFormats} até {config.maxSize / (1024 * 1024)}MB
                    </p>
                    
                    <input
                      ref={(el) => {
                        fileInputRefs.current[type] = el;
                      }}
                      type="file"
                      accept={config.acceptedFormats}
                      onChange={(e) => handleFileSelect(type as keyof typeof DOCUMENT_TYPES, e.target.files)}
                      className="hidden"
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Status Summary */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Status dos Documentos</p>
                <p className="text-sm text-muted-foreground">
                  {documents.filter(doc => ['uploaded', 'pending_review', 'approved'].includes(doc.status)).length} de {Object.values(DOCUMENT_TYPES).filter(config => config.required).length} documentos obrigatórios enviados
                </p>
              </div>
              
              {allRequiredDocumentsUploaded() && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completo
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
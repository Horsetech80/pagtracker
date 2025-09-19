'use client';

import { Smartphone } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

type QRCodeViewerProps = {
  qrCodeBase64: string;
  codigoPix: string;
};

export default function QRCodeViewer({ qrCodeBase64, codigoPix }: QRCodeViewerProps) {
  // Função para abrir o app do banco
  const handleOpenBankApp = () => {
    // Em dispositivos móveis, tenta abrir o app do banco com o código Pix
    // O formato pode variar dependendo do sistema (iOS/Android)
    
    // Para iOS: Tentamos uma abordagem genérica, mas os bancos podem ter schemas específicos
    // Para Android: Tentamos o intent para pagamentos Pix
    
    // Verificar se é um dispositivo móvel
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      try {
        // Esta é uma abordagem genérica - alguns bancos podem necessitar de formatos específicos
        // Criamos uma URL PIX com o código como parâmetro
        const pixUrl = `pix://qr/v0?${encodeURIComponent(codigoPix)}`;
        window.location.href = pixUrl;
      } catch (error) {
        console.error('Erro ao abrir app do banco:', error);
        // Fallback - mostrar uma mensagem ou sugerir copiar o código
        alert('Não foi possível abrir o app do banco. Por favor, copie o código Pix e use no seu aplicativo bancário.');
      }
    } else {
      // Em desktop, orientar o usuário a utilizar o app no celular
      alert('Essa opção funciona melhor em dispositivos móveis. Por favor, escaneie o QR Code com o app do seu banco ou copie o código Pix.');
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* QR Code */}
      <div className="bg-white p-6 rounded-lg mb-4 w-64 h-64 flex items-center justify-center">
        {qrCodeBase64 ? (
          <Image 
            src={qrCodeBase64} 
            alt="QR Code para pagamento Pix" 
            width={200} 
            height={200}
            className="max-w-full max-h-full"
          />
        ) : (
          <div className="text-sm text-gray-500">QR Code não disponível</div>
        )}
      </div>
      
      {/* Botão para abrir o app do banco */}
      <Button 
        variant="outline" 
        onClick={handleOpenBankApp}
        className="flex items-center"
      >
        <Smartphone className="mr-2 h-4 w-4" />
        Abrir no app do banco
      </Button>
    </div>
  );
} 
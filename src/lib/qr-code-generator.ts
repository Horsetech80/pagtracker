import QRCode from 'qrcode';

/**
 * Gera um QR Code como Data URL (base64) a partir de um texto
 * @param text - Texto para gerar o QR Code
 * @param options - Opções de configuração do QR Code
 * @returns Promise com a Data URL do QR Code
 */
export async function generateQRCodeDataURL(
  text: string,
  options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }
): Promise<string> {
  try {
    const qrOptions = {
      width: options?.width || 256,
      margin: options?.margin || 2,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF'
      },
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M' as const
    };

    const dataURL = await QRCode.toDataURL(text, qrOptions);
    return dataURL;
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    throw new Error('Falha na geração do QR Code');
  }
}

/**
 * Gera um QR Code como buffer PNG
 * @param text - Texto para gerar o QR Code
 * @param options - Opções de configuração do QR Code
 * @returns Promise com o buffer do QR Code
 */
export async function generateQRCodeBuffer(
  text: string,
  options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }
): Promise<Buffer> {
  try {
    const qrOptions = {
      width: options?.width || 256,
      margin: options?.margin || 2,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF'
      },
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M' as const
    };

    const buffer = await QRCode.toBuffer(text, qrOptions);
    return buffer;
  } catch (error) {
    console.error('Erro ao gerar QR Code buffer:', error);
    throw new Error('Falha na geração do QR Code buffer');
  }
}

/**
 * Valida se um texto é um código PIX válido
 * @param pixCode - Código PIX para validar
 * @returns boolean indicando se é válido
 */
export function validatePixCode(pixCode: string): boolean {
  // Verifica se começa com padrões PIX válidos:
  // 00020126 - BR Code padrão
  // 00020101 - Formato EfiPay e outros PSPs
  if (!pixCode.startsWith('00020126') && !pixCode.startsWith('00020101')) {
    return false;
  }

  // Verifica se tem pelo menos 4 caracteres para o CRC
  if (pixCode.length < 4) {
    return false;
  }

  // Extrai o CRC (últimos 4 caracteres)
  const providedCRC = pixCode.slice(-4);
  const payload = pixCode.slice(0, -4);

  // Calcula o CRC16 esperado
  const calculatedCRC = calculateCRC16(payload);

  return providedCRC.toUpperCase() === calculatedCRC.toUpperCase();
}

/**
 * Calcula o CRC16 para validação de código PIX
 * @param data - Dados para calcular o CRC
 * @returns CRC16 em hexadecimal
 */
function calculateCRC16(data: string): string {
  const polynomial = 0x1021;
  let crc = 0xFFFF;

  for (let i = 0; i < data.length; i++) {
    crc ^= (data.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Gera QR Code PIX com validação
 * @param pixCode - Código PIX
 * @param options - Opções de configuração
 * @returns Promise com a Data URL do QR Code ou erro
 */
export async function generatePixQRCode(
  pixCode: string,
  options?: {
    width?: number;
    margin?: number;
    validateCode?: boolean;
  }
): Promise<{ success: boolean; dataURL?: string; error?: string }> {
  try {
    // Valida o código PIX se solicitado
    if (options?.validateCode !== false && !validatePixCode(pixCode)) {
      return {
        success: false,
        error: 'Código PIX inválido - CRC ou formato incorreto'
      };
    }

    const dataURL = await generateQRCodeDataURL(pixCode, {
      width: options?.width || 256,
      margin: options?.margin || 2,
      errorCorrectionLevel: 'M'
    });

    return {
      success: true,
      dataURL
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
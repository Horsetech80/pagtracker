# 🧪 Guia de Testes - EfiPay Homologação

## 📋 Resumo

Este guia documenta as práticas recomendadas para testes no ambiente de homologação da EfiPay, incluindo limitações conhecidas e workarounds.

## ⚠️ Limitações do Ambiente de Homologação

### 🚫 Módulo EVP (Chaves PIX Aleatórias)

**Status**: ❌ **DESABILITADO** no ambiente de homologação

**Endpoints Afetados**:
- `POST /v2/gn/evp` (criar chave PIX aleatória)
- `GET /v2/gn/evp` (listar chaves PIX)

**Erro Retornado**:
```json
{
  "nome": "erro_interno_servidor",
  "mensagem": "Erro interno do servidor"
}
```

**Causa Raiz**: Funcionalidade desabilitada intencionalmente pela EfiPay no sandbox.

## ✅ Endpoints Funcionais em Homologação

### 🔧 Configurações e Saldo
- ✅ `GET /v2/gn/config` - Configurações da conta
- ✅ `GET /v2/gn/saldo` - Saldo da conta
- ✅ Autenticação OAuth2

### 💰 PIX - Cobranças e Pagamentos
- ✅ `POST /v2/cob` - Criar cobrança PIX
- ✅ `GET /v2/cob/{txid}` - Consultar cobrança
- ✅ `POST /v2/gn/pix/{idEnvio}` - Enviar PIX

## 🧪 Estratégias de Teste

### 1. Testes de Chaves PIX

**Para Desenvolvimento**: Use a chave de teste oficial:
```
efipay@sejaefi.com.br
```

**Exemplo de Implementação**:
```typescript
// Função para obter chave PIX para testes
function getTestPixKey(environment: 'sandbox' | 'production'): string {
  if (environment === 'sandbox') {
    return 'efipay@sejaefi.com.br'; // Chave oficial de teste
  }
  // Em produção, usar chaves reais da conta
  return getRandomPixKeyFromAccount();
}
```

### 2. Testes de Envio PIX

**Valores para Simulação**:
- `R$ 0,01 - R$ 10,00`: PIX confirmado ✅
- `R$ 10,01 - R$ 20,00`: PIX rejeitado ❌
- `Acima de R$ 20,00`: Rejeitado na requisição ❌

**Valores Especiais**:
- `R$ 4,00`: Gera 2 estornos de R$ 2,00 cada
- `R$ 5,00`: Gera 1 estorno de R$ 5,00

### 3. Tratamento de Erros EVP

**Implementação Recomendada**:
```typescript
export class EfiPayEvpService {
  async createRandomPixKey(): Promise<PixKeyResponse> {
    // Verificar ambiente
    if (this.isSandbox()) {
      throw new Error(
        'EFIPAY_EVP_DISABLED_SANDBOX: ' +
        'Módulo EVP desabilitado em homologação. ' +
        'Use chaves fixas para testes.'
      );
    }
    
    // Lógica normal para produção
    return this.makeEvpRequest();
  }
  
  async listPixKeys(): Promise<PixKey[]> {
    if (this.isSandbox()) {
      // Retornar chaves mockadas para desenvolvimento
      return this.getMockPixKeys();
    }
    
    // Lógica normal para produção
    return this.makeListRequest();
  }
  
  private getMockPixKeys(): PixKey[] {
    return [
      {
        tipo: 'email',
        chave: 'efipay@sejaefi.com.br',
        situacao: 'ATIVA'
      }
    ];
  }
}
```

## 🔄 Fluxo de Desenvolvimento

### Fase 1: Desenvolvimento (Sandbox)
1. ✅ Testar autenticação OAuth2
2. ✅ Testar configurações da conta
3. ✅ Criar cobranças PIX com chave fixa
4. ✅ Simular pagamentos com valores de teste
5. ❌ **Pular** testes de criação/listagem EVP

### Fase 2: Homologação Interna
1. ✅ Validar tratamento de erros EVP
2. ✅ Testar fallbacks para chaves fixas
3. ✅ Verificar logs e monitoramento

### Fase 3: Produção
1. ✅ Configurar certificados de produção
2. ✅ Testar criação de chaves EVP reais
3. ✅ Validar fluxo completo

## 📝 Checklist de Testes

### ✅ Testes Obrigatórios (Sandbox)
- [ ] Autenticação OAuth2
- [ ] Consulta de saldo
- [ ] Criação de cobrança PIX
- [ ] Webhook de pagamento
- [ ] Tratamento de erro EVP
- [ ] Fallback para chaves fixas

### ✅ Testes de Produção
- [ ] Certificados válidos
- [ ] Criação de chave EVP
- [ ] Listagem de chaves EVP
- [ ] Remoção de chave EVP
- [ ] Fluxo completo de pagamento

## 🚨 Alertas Importantes

1. **Nunca** assumir que erro 500 em EVP é problema de código
2. **Sempre** verificar ambiente antes de chamar endpoints EVP
3. **Implementar** fallbacks apropriados para sandbox
4. **Documentar** limitações para a equipe

## 📚 Referências

- [Documentação Oficial EfiPay](https://dev.efipay.com.br/)
- [Endpoints Exclusivos Efí](https://dev.efipay.com.br/en/docs/api-pix/endpoints-exclusivos-efi/)
- [Credenciais e Certificados](https://dev.efipay.com.br/en/docs/api-pix/credenciais/)

---

**Última Atualização**: Janeiro 2025  
**Versão**: 1.0  
**Status**: ✅ Validado
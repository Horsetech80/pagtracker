# Certificados EfiPay

## ⚠️ Importante: Certificados .p12 Necessários

Para que o PagTracker funcione corretamente com a EfiPay, você precisa dos certificados no formato **.p12** (PKCS#12), que contêm tanto o certificado público quanto a chave privada.

## 📥 Como Obter os Certificados

### 1. Acesse o Painel EfiPay
- **Homologação**: https://sejaefi.com.br/central/
- **Produção**: https://sejaefi.com.br/central/

### 2. Baixe os Certificados
1. Faça login na sua conta EfiPay
2. Vá em **Configurações** > **Certificados**
3. Baixe o certificado no formato **.p12**
4. Anote a senha do certificado (se houver)

### 3. Coloque os Arquivos na Pasta Correta
```
certificates/
├── efipay-homolog.p12  # Certificado de homologação
├── efipay-prod.p12     # Certificado de produção
└── README.md           # Este arquivo
```

### 4. Configure as Variáveis de Ambiente (Opcional)

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Homologação
EFIPAY_CLIENT_ID=seu_client_id_homolog
EFIPAY_CLIENT_SECRET=seu_client_secret_homolog
EFIPAY_CERT_PATH=./certificates/efipay-homolog.p12
EFIPAY_CERT_PASSWORD=senha_do_certificado_homolog

# Produção
EFIPAY_CLIENT_ID_PROD=seu_client_id_prod
EFIPAY_CLIENT_SECRET_PROD=seu_client_secret_prod
EFIPAY_CERT_PATH_PROD=./certificates/efipay-prod.p12
EFIPAY_CERT_PASSWORD_PROD=senha_do_certificado_prod

# Chave PIX
EFIPAY_PIX_KEY=sua_chave_pix
```

## 🔧 Modo de Desenvolvimento

Se você não tiver os certificados .p12, o sistema funcionará em **modo temporário** com dados mockados:
- QR codes serão gerados localmente
- Cobranças terão status simulado
- Webhooks não funcionarão

## ✅ Verificação

Após configurar os certificados, reinicie o servidor:

```bash
npm run dev
```

Você deve ver no console:
```
✅ [EFIPAY_CERT] Usando certificado: ./certificates/efipay-homolog.p12
✅ [EFIPAY_CONFIG] Configuração EfiPay válida
```

## 🚨 Problemas Comuns

### Erro: "Certificado .p12 não encontrado"
- Verifique se o arquivo está na pasta `certificates/`
- Confirme que o nome do arquivo está correto
- Baixe novamente do painel EfiPay

### Erro: "401 Unauthorized"
- Verifique se CLIENT_ID e CLIENT_SECRET estão corretos
- Confirme se a senha do certificado está correta
- Verifique se está usando o ambiente correto (homolog/prod)

### Erro: "socket hang up"
- Geralmente indica problema com o certificado
- Baixe novamente o certificado .p12 do painel EfiPay
- Verifique se o certificado não está corrompido

## 📞 Suporte

Se precisar de ajuda:
- **EfiPay**: https://sejaefi.com.br/suporte/
- **Documentação**: https://dev.efipay.com.br/
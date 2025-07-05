# EVO to Base64 🔐

API REST simples e eficiente para descriptografar binários criptografados do WhatsApp e convertê-los para base64.

## 🚀 Características

- ✅ Descriptografia completa de mídias do WhatsApp
- ✅ Suporte a áudio, imagem, vídeo e documentos
- ✅ Validação de integridade com SHA256
- ✅ Detecção automática de tipo MIME
- ✅ Rate limiting e segurança
- ✅ Pronto para deploy na Vercel
- ✅ Documentação completa

## 📋 Requisitos

- Node.js 18+
- NPM ou Yarn

## 🔧 Instalação

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/evo-to-base64.git
cd evo-to-base64

# Instalar dependências
npm install

# Executar localmente
npm run dev
```

## 🌐 Deploy na Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/seu-usuario/evo-to-base64)

### Deploy Manual

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 🔗 Endpoints

### `POST /decrypt`

Descriptografa binários criptografados do WhatsApp e retorna em base64.

**Corpo da Requisição:**

```json
{
  "audioMessage": {
    "url": "https://mmg.whatsapp.net/v/t62.7117-24/...",
    "mimetype": "audio/ogg; codecs=opus",
    "fileSha256": "nj691htV6grggiiuQyxSfEONVQ7Hdlmx+h5uif4BkzE=",
    "fileLength": "7490",
    "mediaKey": "IhEchJTS7Biz4gOzogb+XDfE5dx50WPVG2WVAiKZpUI=",
    "fileEncSha256": "4wY6mJIezytwRyUJW3nlpmZszLFpGZ/900quyTmz1YI="
  }
}
```

**Resposta de Sucesso:**

```json
{
  "success": true,
  "data": {
    "base64": "T2dnUwACAAAAAAAAAAAAAAAAAAA...",
    "mimetype": "audio/ogg",
    "detectedMimeType": "audio/ogg",
    "size": 7490,
    "originalSize": 7490,
    "mediaType": "audio"
  },
  "validation": {
    "encryptedHashVerified": true,
    "decryptedHashVerified": true
  }
}
```

### `POST /verify`

Verifica se uma URL do WhatsApp é acessível.

**Corpo da Requisição:**

```json
{
  "url": "https://mmg.whatsapp.net/v/t62.7117-24/..."
}
```

**Resposta:**

```json
{
  "success": true,
  "accessible": true,
  "status": 200,
  "headers": {
    "content-type": "application/octet-stream",
    "content-length": "7500"
  }
}
```

### `GET /health`

Verifica o status da API e mostra endpoints disponíveis.

**Resposta:**

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "endpoints": {
    "/decrypt": "POST - Descriptografar e converter mídia para base64",
    "/verify": "POST - Verificar acessibilidade da URL",
    "/health": "GET - Status da API"
  }
}
```

## 📝 Tipos de Mídia Suportados

A API suporta os seguintes tipos de mensagem do WhatsApp:

- `audioMessage` - Mensagens de áudio
- `imageMessage` - Mensagens de imagem
- `videoMessage` - Mensagens de vídeo
- `documentMessage` - Mensagens de documento

## 🔐 Segurança

A API implementa várias camadas de segurança:

- **Rate Limiting**: Máximo 100 requisições por IP a cada 15 minutos
- **Helmet**: Configuração de cabeçalhos de segurança
- **CORS**: Controle de acesso cross-origin
- **Validação**: Verificação de integridade dos dados
- **Compressão**: Compressão gzip para responses

## 📄 Exemplo de Uso

### cURL

```bash
curl -X POST https://sua-api.vercel.app/decrypt \
  -H "Content-Type: application/json" \
  -d '{
    "audioMessage": {
      "url": "https://mmg.whatsapp.net/v/t62.7117-24/...",
      "mimetype": "audio/ogg; codecs=opus",
      "fileSha256": "nj691htV6grggiiuQyxSfEONVQ7Hdlmx+h5uif4BkzE=",
      "fileLength": "7490",
      "mediaKey": "IhEchJTS7Biz4gOzogb+XDfE5dx50WPVG2WVAiKZpUI=",
      "fileEncSha256": "4wY6mJIezytwRyUJW3nlpmZszLFpGZ/900quyTmz1YI="
    }
  }'
```

### JavaScript/Node.js

```javascript
const response = await fetch('https://sua-api.vercel.app/decrypt', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    audioMessage: {
      url: 'https://mmg.whatsapp.net/v/t62.7117-24/...',
      mimetype: 'audio/ogg; codecs=opus',
      fileSha256: 'nj691htV6grggiiuQyxSfEONVQ7Hdlmx+h5uif4BkzE=',
      fileLength: '7490',
      mediaKey: 'IhEchJTS7Biz4gOzogb+XDfE5dx50WPVG2WVAiKZpUI=',
      fileEncSha256: '4wY6mJIezytwRyUJW3nlpmZszLFpGZ/900quyTmz1YI='
    }
  })
});

const data = await response.json();
console.log(data.data.base64); // String base64 do arquivo descriptografado
```

### Python

```python
import requests
import json

url = 'https://sua-api.vercel.app/decrypt'
data = {
    'audioMessage': {
        'url': 'https://mmg.whatsapp.net/v/t62.7117-24/...',
        'mimetype': 'audio/ogg; codecs=opus',
        'fileSha256': 'nj691htV6grggiiuQyxSfEONVQ7Hdlmx+h5uif4BkzE=',
        'fileLength': '7490',
        'mediaKey': 'IhEchJTS7Biz4gOzogb+XDfE5dx50WPVG2WVAiKZpUI=',
        'fileEncSha256': '4wY6mJIezytwRyUJW3nlpmZszLFpGZ/900quyTmz1YI='
    }
}

response = requests.post(url, json=data)
result = response.json()
print(result['data']['base64'])  # String base64 do arquivo descriptografado
```

## 🛠️ Desenvolvimento

### Scripts disponíveis

```bash
npm start          # Iniciar servidor em produção
npm run dev        # Iniciar servidor em desenvolvimento com nodemon
npm test           # Executar testes (não implementado)
```

### Estrutura do projeto

```
evo-to-base64/
├── index.js           # Servidor principal da API
├── utils/
│   └── crypto-utils.js # Utilitários de criptografia
├── package.json       # Dependências e scripts
├── vercel.json        # Configuração da Vercel
├── .gitignore         # Arquivos ignorados pelo Git
└── README.md          # Esta documentação
```

## 🔧 Configuração

### Variáveis de ambiente

```env
PORT=3000                    # Porta do servidor (padrão: 3000)
NODE_ENV=production          # Ambiente (development/production)
CORS_ORIGIN=*               # Origem permitida para CORS
```

## 📊 Tratamento de Erros

A API retorna erros padronizados:

```json
{
  "error": "Descrição do erro",
  "message": "Detalhes técnicos do erro",
  "details": ["Lista de erros específicos"]
}
```

### Códigos de erro comuns

- `400` - Dados inválidos na requisição
- `429` - Muitas requisições (rate limit)
- `500` - Erro interno do servidor

## 🧪 Como Funciona

1. **Recepção**: A API recebe dados de mídia criptografada do WhatsApp
2. **Validação**: Verifica se os dados têm o formato correto
3. **Download**: Baixa o arquivo criptografado da URL fornecida
4. **Descriptografia**: Usa HKDF-SHA256 + AES-256-CBC para descriptografar
5. **Verificação**: Valida a integridade usando SHA256
6. **Conversão**: Converte os dados para base64
7. **Resposta**: Retorna o arquivo descriptografado em base64

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📜 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🔍 Troubleshooting

### Problemas comuns

**Erro de MAC inválido:**
- Verifique se a `mediaKey` está correta
- Confirme que o arquivo não foi corrompido

**URL inacessível:**
- Use o endpoint `/verify` para testar a URL
- Verifique se a URL não expirou

**Formato inválido:**
- Certifique-se de que está enviando o tipo correto de mensagem
- Verifique se todos os campos obrigatórios estão presentes

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório do GitHub.

---

**Feito com ❤️ para a comunidade WhatsApp** 
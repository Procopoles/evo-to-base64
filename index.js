const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const fetch = require('node-fetch');
const { 
  decryptWhatsAppMedia, 
  validateEncryptedData, 
  validateMediaKey, 
  verifyFileSha256, 
  verifyEncryptedFileSha256, 
  detectMimeType 
} = require('./utils/crypto-utils');

// Configurações da aplicação
const app = express();
const PORT = process.env.PORT || 3000;

// Configurar trust proxy para Vercel
app.set('trust proxy', true);

// Middlewares de segurança
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP
  message: {
    error: 'Muitas requisições. Tente novamente em 15 minutos.'
  }
});
app.use(limiter);

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));

// Função para validar dados de mídia do WhatsApp
function validateMediaData(mediaData) {
  const errors = [];
  
  if (!mediaData.url) {
    errors.push('URL é obrigatória');
  }
  
  if (!mediaData.mediaKey) {
    errors.push('mediaKey é obrigatória');
  } else if (!validateMediaKey(mediaData.mediaKey)) {
    errors.push('mediaKey tem formato inválido');
  }
  
  return errors;
}

// Função para baixar arquivo criptografado
async function downloadEncryptedFile(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.buffer();
  } catch (error) {
    throw new Error(`Erro ao baixar arquivo: ${error.message}`);
  }
}

// Endpoint principal para descriptografar e converter para base64
app.post('/decrypt', async (req, res) => {
  try {
    const { audioMessage, imageMessage, videoMessage, documentMessage } = req.body;
    
    // Determinar o tipo de mídia
    let mediaData;
    let mediaType;
    
    if (audioMessage) {
      mediaData = audioMessage;
      mediaType = 'audio';
    } else if (imageMessage) {
      mediaData = imageMessage;
      mediaType = 'image';
    } else if (videoMessage) {
      mediaData = videoMessage;
      mediaType = 'video';
    } else if (documentMessage) {
      mediaData = documentMessage;
      mediaType = 'document';
    } else {
      return res.status(400).json({
        error: 'Nenhuma mídia válida encontrada na requisição',
        supportedTypes: ['audioMessage', 'imageMessage', 'videoMessage', 'documentMessage']
      });
    }
    
    // Validar campos obrigatórios
    const validationErrors = validateMediaData(mediaData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Dados de mídia inválidos',
        details: validationErrors
      });
    }
    
    // Baixar arquivo criptografado
    const encryptedData = await downloadEncryptedFile(mediaData.url);
    
    // Validar formato dos dados criptografados
    if (!validateEncryptedData(encryptedData)) {
      return res.status(400).json({
        error: 'Formato dos dados criptografados inválido'
      });
    }
    
    // Verificar hash do arquivo criptografado se fornecido
    if (mediaData.fileEncSha256) {
      const encHashValid = verifyEncryptedFileSha256(encryptedData, mediaData.fileEncSha256);
      if (!encHashValid) {
        return res.status(400).json({
          error: 'Hash do arquivo criptografado não confere'
        });
      }
    }
    
    // Descriptografar
    const decryptedData = decryptWhatsAppMedia(mediaData.mediaKey, encryptedData);
    
    // Verificar hash do arquivo descriptografado se fornecido
    if (mediaData.fileSha256) {
      const hashValid = verifyFileSha256(decryptedData, mediaData.fileSha256);
      if (!hashValid) {
        return res.status(400).json({
          error: 'Hash do arquivo descriptografado não confere'
        });
      }
    }
    
    // Detectar tipo MIME automaticamente
    const detectedMimeType = detectMimeType(decryptedData);
    const finalMimeType = mediaData.mimetype || detectedMimeType;
    
    // Converter para base64
    const base64Data = decryptedData.toString('base64');
    
    // Preparar resposta
    const response = {
      success: true,
      data: {
        base64: base64Data,
        mimetype: finalMimeType,
        detectedMimeType: detectedMimeType,
        size: decryptedData.length,
        originalSize: parseInt(mediaData.fileLength) || null,
        mediaType: mediaType
      },
      validation: {
        encryptedHashVerified: mediaData.fileEncSha256 ? true : 'not_provided',
        decryptedHashVerified: mediaData.fileSha256 ? true : 'not_provided'
      }
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Erro no endpoint /decrypt:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// Endpoint para verificar apenas a URL (sem descriptografar)
app.post('/verify', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        error: 'URL é obrigatória'
      });
    }
    
    // Verificar se a URL é acessível
    const response = await fetch(url, { method: 'HEAD' });
    
    res.json({
      success: true,
      accessible: response.ok,
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type'),
        'content-length': response.headers.get('content-length')
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao verificar URL',
      message: error.message
    });
  }
});

// Endpoint de status da API
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      '/decrypt': 'POST - Descriptografar e converter mídia para base64',
      '/verify': 'POST - Verificar acessibilidade da URL',
      '/health': 'GET - Status da API'
    }
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    message: 'Consulte /health para ver os endpoints disponíveis'
  });
});

// Middleware para tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📖 Documentação disponível em: http://localhost:${PORT}/health`);
});

module.exports = app; 
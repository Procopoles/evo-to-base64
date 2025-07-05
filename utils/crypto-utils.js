const crypto = require('crypto');

/**
 * Descriptografa mídia do WhatsApp usando a chave de mídia
 * @param {string} mediaKey - Chave de mídia em base64
 * @param {Buffer} encryptedData - Dados criptografados
 * @returns {Buffer} - Dados descriptografados
 */
function decryptWhatsAppMedia(mediaKey, encryptedData) {
  try {
    // Garantir que encryptedData seja um Buffer
    if (!Buffer.isBuffer(encryptedData)) {
      // Pode vir como ArrayBuffer, Uint8Array, etc.
      encryptedData = Buffer.from(encryptedData);
    }

    // Converter mediaKey de base64 para buffer
    const mediaKeyBuffer = Buffer.from(mediaKey, 'base64');
    
    // Expandir a chave de mídia usando HKDF-SHA256
    const expandedKey = crypto.hkdfSync('sha256', mediaKeyBuffer, Buffer.alloc(0), 'WhatsApp Media Keys', 112);
    
    // Separar as chaves derivadas
    const iv = expandedKey.slice(0, 16);           // IV para AES-CBC
    const cipherKey = expandedKey.slice(16, 48);   // Chave AES-256
    const macKey = expandedKey.slice(48, 80);      // Chave HMAC-SHA256
    
    // Separar dados criptografados e MAC
    const encryptedMedia = encryptedData.slice(0, -10);
    const receivedMac = encryptedData.slice(-10);
    
    // Calcular MAC dos dados
    const computedMac = crypto.createHmac('sha256', macKey)
      .update(iv)
      .update(encryptedMedia)
      .digest()
      .slice(0, 10);
    
    // Verificar integridade usando MAC
    if (!crypto.timingSafeEqual(receivedMac, computedMac)) {
      throw new Error('Falha na verificação de integridade (MAC inválido)');
    }
    
    // Descriptografar usando AES-256-CBC
    const decipher = crypto.createDecipheriv('aes-256-cbc', cipherKey, iv);
    decipher.setAutoPadding(true);
    
    const decrypted = Buffer.concat([
      decipher.update(encryptedMedia),
      decipher.final()
    ]);
    
    return decrypted;
  } catch (error) {
    throw new Error(`Erro na descriptografia: ${error.message}`);
  }
}

/**
 * Valida se os dados criptografados têm o formato correto
 * @param {Buffer} encryptedData - Dados criptografados
 * @returns {boolean} - True se o formato for válido
 */
function validateEncryptedData(encryptedData) {
  // Garantir que encryptedData seja um Buffer para evitar erros de length/slice
  if (!Buffer.isBuffer(encryptedData)) {
    encryptedData = Buffer.from(encryptedData);
  }
  
  // Verificar se tem pelo menos 10 bytes (MAC)
  if (encryptedData.length < 10) {
    return false;
  }
  
  // Verificar se o tamanho é válido (múltiplo de 16 + 10 bytes do MAC)
  const mediaSize = encryptedData.length - 10;
  if (mediaSize % 16 !== 0) {
    return false;
  }
  
  return true;
}

/**
 * Verifica se a chave de mídia tem o formato correto
 * @param {string} mediaKey - Chave de mídia em base64
 * @returns {boolean} - True se o formato for válido
 */
function validateMediaKey(mediaKey) {
  try {
    const keyBuffer = Buffer.from(mediaKey, 'base64');
    // Chave de mídia do WhatsApp deve ter 32 bytes
    return keyBuffer.length === 32;
  } catch (error) {
    return false;
  }
}

/**
 * Verifica hash SHA256 do arquivo descriptografado
 * @param {Buffer} decryptedData - Dados descriptografados
 * @param {string} expectedSha256 - Hash SHA256 esperado em base64
 * @returns {boolean} - True se o hash for válido
 */
function verifyFileSha256(decryptedData, expectedSha256) {
  try {
    if (!Buffer.isBuffer(decryptedData)) {
      decryptedData = Buffer.from(decryptedData);
    }
    const computedHash = crypto.createHash('sha256').update(decryptedData).digest('base64');
    return computedHash === expectedSha256;
  } catch (error) {
    return false;
  }
}

/**
 * Verifica hash SHA256 do arquivo criptografado
 * @param {Buffer} encryptedData - Dados criptografados
 * @param {string} expectedEncSha256 - Hash SHA256 esperado em base64
 * @returns {boolean} - True se o hash for válido
 */
function verifyEncryptedFileSha256(encryptedData, expectedEncSha256) {
  try {
    if (!Buffer.isBuffer(encryptedData)) {
      encryptedData = Buffer.from(encryptedData);
    }
    const computedHash = crypto.createHash('sha256').update(encryptedData).digest('base64');
    return computedHash === expectedEncSha256;
  } catch (error) {
    return false;
  }
}

/**
 * Detecta o tipo de arquivo pelos magic bytes
 * @param {Buffer} data - Dados do arquivo
 * @returns {string} - Tipo MIME detectado
 */
function detectMimeType(data) {
  const magicBytes = data.slice(0, 12);
  
  // Verificar diferentes tipos de arquivo
  if (magicBytes.slice(0, 4).equals(Buffer.from([0xFF, 0xD8, 0xFF, 0xE0])) ||
      magicBytes.slice(0, 4).equals(Buffer.from([0xFF, 0xD8, 0xFF, 0xE1]))) {
    return 'image/jpeg';
  }
  
  if (magicBytes.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) {
    return 'image/png';
  }
  
  if (magicBytes.slice(0, 4).equals(Buffer.from('OggS'))) {
    return 'audio/ogg';
  }
  
  if (magicBytes.slice(0, 4).equals(Buffer.from('fLaC'))) {
    return 'audio/flac';
  }
  
  if (magicBytes.slice(0, 4).equals(Buffer.from([0x00, 0x00, 0x00, 0x18])) ||
      magicBytes.slice(0, 4).equals(Buffer.from([0x00, 0x00, 0x00, 0x20]))) {
    return 'video/mp4';
  }
  
  if (magicBytes.slice(0, 3).equals(Buffer.from('ID3')) ||
      magicBytes.slice(0, 2).equals(Buffer.from([0xFF, 0xFB]))) {
    return 'audio/mpeg';
  }
  
  return 'application/octet-stream';
}

module.exports = {
  decryptWhatsAppMedia,
  validateEncryptedData,
  validateMediaKey,
  verifyFileSha256,
  verifyEncryptedFileSha256,
  detectMimeType
}; 
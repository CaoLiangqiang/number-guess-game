/**
 * 加密工具模块
 * 用于敏感数据加密处理
 */

/**
 * 简单的XOR加密（仅用于演示，生产环境应使用专业加密库）
 * @param {string} data - 待加密数据
 * @param {string} key - 密钥
 * @returns {string}
 */
function xorEncrypt(data, key) {
  let result = ''
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(
      data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    )
  }
  return result
}

/**
 * 简单的XOR解密
 * @param {string} data - 待解密数据
 * @param {string} key - 密钥
 * @returns {string}
 */
function xorDecrypt(data, key) {
  return xorEncrypt(data, key) // XOR加密解密相同
}

/**
 * Base64编码
 * @param {string} str
 * @returns {string}
 */
function base64Encode(str) {
  // 小程序环境下使用内置方法
  return wx.arrayBufferToBase64(
    new TextEncoder().encode(str).buffer
  )
}

/**
 * Base64解码
 * @param {string} base64
 * @returns {string}
 */
function base64Decode(base64) {
  const buffer = wx.base64ToArrayBuffer(base64)
  return new TextDecoder().decode(buffer)
}

/**
 * 生成随机字符串
 * @param {number} length
 * @returns {string}
 */
function generateRandomString(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 生成简单的哈希值（非密码学安全）
 * @param {string} str
 * @returns {string}
 */
function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}

/**
 * 验证数字签名（模拟）
 * 在实际应用中，应使用微信提供的签名验证方法
 * @param {object} data
 * @param {string} signature
 * @param {string} secret
 * @returns {boolean}
 */
function verifySignature(data, signature, secret) {
  // 模拟验证：实际应使用 HMAC-SHA256
  const expectedSignature = simpleHash(JSON.stringify(data) + secret)
  return signature === expectedSignature
}

/**
 * 对称加密（用于本地数据加密存储）
 * @param {string} plaintext
 * @param {string} key
 * @returns {string}
 */
function encryptData(plaintext, key) {
  const encrypted = xorEncrypt(plaintext, key)
  return base64Encode(encrypted)
}

/**
 * 对称解密
 * @param {string} ciphertext
 * @param {string} key
 * @returns {string}
 */
function decryptData(ciphertext, key) {
  const decoded = base64Decode(ciphertext)
  return xorDecrypt(decoded, key)
}

module.exports = {
  xorEncrypt,
  xorDecrypt,
  base64Encode,
  base64Decode,
  generateRandomString,
  simpleHash,
  verifySignature,
  encryptData,
  decryptData
}
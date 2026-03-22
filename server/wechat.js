/**
 * 微信 API 封装模块
 * 处理微信登录、用户信息获取等
 */

const https = require('https')

// 微信小程序配置
const WX_CONFIG = {
  appid: process.env.WX_APPID || '',
  secret: process.env.WX_SECRET || ''
}

/**
 * 发起 HTTPS GET 请求
 * @param {string} url
 * @returns {Promise<object>}
 */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

/**
 * 通过 code 换取 openid 和 session_key
 * @param {string} code - wx.login 获取的 code
 * @returns {Promise<{openid: string, session_key: string}>}
 */
async function code2Session(code) {
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_CONFIG.appid}&secret=${WX_CONFIG.secret}&js_code=${code}&grant_type=authorization_code`

  const result = await httpsGet(url)

  if (result.errcode) {
    throw new Error(`微信登录失败: ${result.errmsg}`)
  }

  return {
    openid: result.openid,
    sessionKey: result.session_key,
    unionid: result.unionid
  }
}

/**
 * 获取微信 access_token
 * @returns {Promise<{access_token: string, expires_in: number}>}
 */
async function getAccessToken() {
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WX_CONFIG.appid}&secret=${WX_CONFIG.secret}`

  const result = await httpsGet(url)

  if (result.errcode) {
    throw new Error(`获取 access_token 失败: ${result.errmsg}`)
  }

  return {
    accessToken: result.access_token,
    expiresIn: result.expires_in
  }
}

/**
 * 生成小程序码
 * @param {string} scene - 场景值
 * @param {string} page - 页面路径
 * @returns {Promise<Buffer>}
 */
async function getWXACode(scene, page = 'pages/index/index') {
  // 需要先获取 access_token
  const { accessToken } = await getAccessToken()

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ scene, page })

    const options = {
      hostname: 'api.weixin.qq.com',
      path: `/wxa/getwxacodeunlimit?access_token=${accessToken}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = https.request(options, (res) => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        resolve(buffer)
      })
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

/**
 * 发送订阅消息
 * @param {string} openid - 用户 openid
 * @param {string} templateId - 模板 ID
 * @param {object} data - 消息数据
 * @returns {Promise<object>}
 */
async function sendSubscribeMessage(openid, templateId, data) {
  const { accessToken } = await getAccessToken()

  const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`

  const postData = JSON.stringify({
    touser: openid,
    template_id: templateId,
    data
  })

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.weixin.qq.com',
      path: `/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(e)
        }
      })
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

/**
 * 验证签名
 * @param {string} rawData - 原始数据
 * @param {string} signature - 签名
 * @param {string} sessionKey - 会话密钥
 * @returns {boolean}
 */
function verifySignature(rawData, signature, sessionKey) {
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', sessionKey)
    .update(rawData)
    .digest('hex')

  return signature === expectedSignature
}

/**
 * 解密加密数据
 * @param {string} encryptedData - 加密数据
 * @param {string} iv - 初始向量
 * @param {string} sessionKey - 会话密钥
 * @returns {object}
 */
function decryptData(encryptedData, iv, sessionKey) {
  const crypto = require('crypto')

  const decipher = crypto.createDecipheriv(
    'aes-128-cbc',
    Buffer.from(sessionKey, 'base64'),
    Buffer.from(iv, 'base64')
  )

  let decoded = decipher.update(Buffer.from(encryptedData, 'base64'))
  decoded = Buffer.concat([decoded, decipher.final()])

  return JSON.parse(decoded.toString())
}

module.exports = {
  code2Session,
  getAccessToken,
  getWXACode,
  sendSubscribeMessage,
  verifySignature,
  decryptData,
  WX_CONFIG
}
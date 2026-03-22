/**
 * 每日挑战模块
 * 处理每日挑战题目的生成、验证和排行榜
 */

const crypto = require('crypto')
const cloudDB = require('./cloud-db')

// 加密密钥（生产环境应使用环境变量）
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key'

/**
 * 生成随机数字（不重复）
 * @param {number} digits - 位数
 * @returns {string}
 */
function generateSecretNumber(digits = 4) {
  const available = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
  const result = []

  // 第一位不能为0
  result.push(available.splice(Math.floor(Math.random() * available.length), 1)[0])

  // 添加0到可选池
  available.push('0')

  // 生成剩余位数
  for (let i = 1; i < digits; i++) {
    result.push(available.splice(Math.floor(Math.random() * available.length), 1)[0])
  }

  return result.join('')
}

/**
 * 加密数字
 * @param {string} text
 * @returns {string}
 */
function encryptSecret(text) {
  const iv = crypto.randomBytes(16)
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return iv.toString('hex') + ':' + encrypted
}

/**
 * 解密数字
 * @param {string} encrypted
 * @returns {string}
 */
function decryptSecret(encrypted) {
  const [ivHex, encryptedData] = encrypted.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * 生成今日挑战
 * @returns {Promise<object>}
 */
async function generateTodayChallenge() {
  const today = new Date().toISOString().split('T')[0]

  // 检查是否已存在
  const existing = await cloudDB.getDailyChallenge(today)
  if (existing) {
    return {
      date: today,
      exists: true,
      participants: existing.participants
    }
  }

  // 生成新挑战
  const secret = generateSecretNumber(4)
  const encrypted = encryptSecret(secret)

  await cloudDB.createDailyChallenge(today, encrypted)

  console.log(`[DailyChallenge] 生成 ${today} 挑战: ${secret}`)

  return {
    date: today,
    exists: false,
    participants: 0
  }
}

/**
 * 验证猜测
 * @param {string} date - 日期
 * @param {string} guess - 猜测数字
 * @returns {Promise<{hits: number, blows: number}>}
 */
async function verifyGuess(date, guess) {
  const challenge = await cloudDB.getDailyChallenge(date)
  if (!challenge) {
    throw new Error('当日挑战不存在')
  }

  const secret = decryptSecret(challenge.secretEncrypted)

  // 计算 hits 和 blows
  let hits = 0
  let blows = 0

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === secret[i]) {
      hits++
    } else if (secret.includes(guess[i])) {
      blows++
    }
  }

  return { hits, blows }
}

/**
 * 提交挑战结果
 * @param {string} date
 * @param {string} openid
 * @param {object} result
 */
async function submitChallengeResult(date, openid, result) {
  // 检查是否已提交
  const rankings = await cloudDB.getDailyRanking(date)
  const existing = rankings.find(r => r.openid === openid)

  if (existing) {
    throw new Error('今日已参与挑战')
  }

  // 验证答案正确性
  const { hits } = await verifyGuess(date, result.lastGuess)
  if (hits !== 4) {
    throw new Error('答案不正确')
  }

  // 提交结果
  await cloudDB.submitDailyResult(date, openid, {
    steps: result.steps,
    duration: result.duration,
    nickname: result.nickname,
    avatar: result.avatar
  })

  return { success: true }
}

/**
 * 获取每日排行榜
 * @param {string} date
 * @param {number} limit
 */
async function getDailyLeaderboard(date, limit = 100) {
  const rankings = await cloudDB.getDailyRanking(date, limit)

  // 添加排名
  return rankings.map((r, index) => ({
    rank: index + 1,
    openid: r.openid,
    nickname: r.nickname,
    avatar: r.avatar,
    steps: r.steps,
    duration: r.duration,
    completedAt: r.completedAt
  }))
}

/**
 * 获取用户今日排名
 * @param {string} date
 * @param {string} openid
 */
async function getUserDailyRank(date, openid) {
  const rankings = await cloudDB.getDailyRanking(date)
  const index = rankings.findIndex(r => r.openid === openid)

  if (index === -1) {
    return null
  }

  return {
    rank: index + 1,
    ...rankings[index]
  }
}

/**
 * 检查用户今日是否已挑战
 * @param {string} date
 * @param {string} openid
 */
async function hasCompletedToday(date, openid) {
  const rankings = await cloudDB.getDailyRanking(date)
  return rankings.some(r => r.openid === openid)
}

module.exports = {
  generateSecretNumber,
  generateTodayChallenge,
  verifyGuess,
  submitChallengeResult,
  getDailyLeaderboard,
  getUserDailyRank,
  hasCompletedToday
}
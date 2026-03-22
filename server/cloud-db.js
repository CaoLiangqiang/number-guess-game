/**
 * 云数据库操作模块
 * 封装微信云数据库的操作
 */

// 模拟云数据库（开发环境）
// 生产环境替换为真实的云数据库 SDK

/**
 * 内存数据存储（开发环境模拟）
 */
const memoryDB = {
  users: new Map(),
  games: new Map(),
  dailyChallenges: new Map(),
  dailyRankings: new Map(),
  rankings: new Map(),
  sessions: new Map()
}

/**
 * 是否使用云数据库
 */
const USE_CLOUD_DB = process.env.USE_CLOUD_DB === 'true'

/**
 * 获取云数据库实例
 */
function getDB() {
  if (USE_CLOUD_DB) {
    // 生产环境：使用微信云数据库 SDK
    // const cloud = require('wx-server-sdk')
    // cloud.init()
    // return cloud.database()
    throw new Error('云数据库未配置')
  }

  // 开发环境：返回内存数据库
  return {
    collection: (name) => ({
      doc: (id) => ({
        get: async () => {
          const collection = memoryDB[name]
          if (!collection) return { data: null }
          const doc = collection.get(id)
          return { data: doc || null }
        },
        update: async (data) => {
          const collection = memoryDB[name]
          if (!collection) return { stats: { updated: 0 } }
          const existing = collection.get(id)
          if (existing) {
            collection.set(id, { ...existing, ...data, updatedAt: new Date() })
            return { stats: { updated: 1 } }
          }
          return { stats: { updated: 0 } }
        },
        remove: async () => {
          const collection = memoryDB[name]
          if (!collection) return { stats: { removed: 0 } }
          if (collection.has(id)) {
            collection.delete(id)
            return { stats: { removed: 1 } }
          }
          return { stats: { removed: 0 } }
        }
      }),
      add: async ({ data }) => {
        const collection = memoryDB[name]
        if (!collection) {
          memoryDB[name] = new Map()
        }
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
        const doc = { _id: id, ...data, createdAt: new Date() }
        memoryDB[name].set(id, doc)
        return { _id: id }
      },
      where: (condition) => ({
        get: async () => {
          const collection = memoryDB[name]
          if (!collection) return { data: [] }
          const results = []
          for (const [key, value] of collection) {
            let match = true
            for (const [field, fieldValue] of Object.entries(condition)) {
              if (value[field] !== fieldValue) {
                match = false
                break
              }
            }
            if (match) results.push(value)
          }
          return { data: results }
        },
        count: async () => {
          const collection = memoryDB[name]
          if (!collection) return { total: 0 }
          let count = 0
          for (const [key, value] of collection) {
            let match = true
            for (const [field, fieldValue] of Object.entries(condition)) {
              if (value[field] !== fieldValue) {
                match = false
                break
              }
            }
            if (match) count++
          }
          return { total: count }
        },
        update: async ({ data }) => {
          const collection = memoryDB[name]
          if (!collection) return { stats: { updated: 0 } }
          let updated = 0
          for (const [key, value] of collection) {
            let match = true
            for (const [field, fieldValue] of Object.entries(condition)) {
              if (value[field] !== fieldValue) {
                match = false
                break
              }
            }
            if (match) {
              collection.set(key, { ...value, ...data, updatedAt: new Date() })
              updated++
            }
          }
          return { stats: { updated } }
        }
      }),
      orderBy: (field, order) => ({
        limit: (count) => ({
          get: async () => {
            const collection = memoryDB[name]
            if (!collection) return { data: [] }
            const results = Array.from(collection.values())
            results.sort((a, b) => {
              if (order === 'desc') return (b[field] || 0) - (a[field] || 0)
              return (a[field] || 0) - (b[field] || 0)
            })
            return { data: results.slice(0, count) }
          }
        })
      })
    })
  }
}

// ==================== 用户相关操作 ====================

/**
 * 创建或更新用户
 */
async function upsertUser(openid, userData) {
  const db = getDB()
  const collection = db.collection('users')

  const existing = await collection.where({ openid }).get()

  if (existing.data.length > 0) {
    await collection.doc(existing.data[0]._id).update({
      ...userData,
      updatedAt: new Date()
    })
    return existing.data[0]._id
  } else {
    const result = await collection.add({
      data: {
        openid,
        ...userData,
        stats: {
          totalGames: 0,
          wins: 0,
          losses: 0,
          winStreak: 0,
          maxWinStreak: 0,
          avgSteps: 0,
          fastestWin: null
        },
        createdAt: new Date()
      }
    })
    return result._id
  }
}

/**
 * 获取用户信息
 */
async function getUser(openid) {
  const db = getDB()
  const result = await db.collection('users').where({ openid }).get()
  return result.data[0] || null
}

/**
 * 更新用户统计
 */
async function updateUserStats(openid, stats) {
  const db = getDB()
  const user = await getUser(openid)
  if (!user) return

  await db.collection('users').doc(user._id).update({
    stats: { ...user.stats, ...stats }
  })
}

// ==================== 游戏记录操作 ====================

/**
 * 保存游戏记录
 */
async function saveGameRecord(gameData) {
  const db = getDB()
  const result = await db.collection('games').add({
    data: {
      ...gameData,
      createdAt: new Date()
    }
  })
  return result._id
}

/**
 * 获取用户游戏历史
 */
async function getUserGameHistory(openid, limit = 20) {
  const db = getDB()
  const result = await db.collection('games')
    .where({ 'players.host.openid': openid })
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()
  return result.data
}

// ==================== 每日挑战操作 ====================

/**
 * 获取每日挑战
 */
async function getDailyChallenge(date) {
  const db = getDB()
  const result = await db.collection('dailyChallenges').where({ date }).get()
  return result.data[0] || null
}

/**
 * 创建每日挑战
 */
async function createDailyChallenge(date, secretEncrypted) {
  const db = getDB()
  const result = await db.collection('dailyChallenges').add({
    data: {
      date,
      secretEncrypted,
      difficulty: 4,
      participants: 0,
      createdAt: new Date()
    }
  })
  return result._id
}

/**
 * 提交每日挑战结果
 */
async function submitDailyResult(date, openid, result) {
  const db = getDB()
  await db.collection('dailyRankings').add({
    data: {
      date,
      openid,
      ...result,
      completedAt: new Date()
    }
  })
}

/**
 * 获取每日排行榜
 */
async function getDailyRanking(date, limit = 100) {
  const db = getDB()
  const result = await db.collection('dailyRankings')
    .where({ date })
    .orderBy('steps', 'asc')
    .limit(limit)
    .get()
  return result.data
}

// ==================== 排行榜操作 ====================

/**
 * 更新排行榜
 */
async function updateRanking(type, ranks) {
  const db = getDB()
  const collection = db.collection('rankings')

  const existing = await collection.where({ type }).get()

  if (existing.data.length > 0) {
    await collection.doc(existing.data[0]._id).update({
      ranks,
      updatedAt: new Date()
    })
  } else {
    await collection.add({
      data: {
        type,
        ranks,
        updatedAt: new Date()
      }
    })
  }
}

/**
 * 获取排行榜
 */
async function getRanking(type) {
  const db = getDB()
  const result = await db.collection('rankings').where({ type }).get()
  return result.data[0]?.ranks || []
}

module.exports = {
  getDB,
  // 用户
  upsertUser,
  getUser,
  updateUserStats,
  // 游戏
  saveGameRecord,
  getUserGameHistory,
  // 每日挑战
  getDailyChallenge,
  createDailyChallenge,
  submitDailyResult,
  getDailyRanking,
  // 排行榜
  updateRanking,
  getRanking
}
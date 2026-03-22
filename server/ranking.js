/**
 * 排行榜模块
 * 处理各维度排行榜的计算和更新
 */

const cloudDB = require('./cloud-db')

/**
 * 排行榜类型
 */
const RANKING_TYPES = {
  WIN_RATE: 'winRate',       // 胜率榜
  WIN_STREAK: 'winStreak',   // 连胜榜
  FASTEST_WIN: 'fastestWin', // 最快猜中榜
  DAILY: 'daily'             // 每日挑战榜
}

/**
 * 计算用户排名
 * @param {Array} users - 用户列表
 * @param {string} type - 排行榜类型
 * @returns {Array}
 */
function calculateRanks(users, type) {
  let sortedUsers = []

  switch (type) {
    case RANKING_TYPES.WIN_RATE:
      // 按胜率排序，要求至少10场
      sortedUsers = users
        .filter(u => u.stats && u.stats.totalGames >= 10)
        .map(u => ({
          openid: u.openid,
          nickname: u.nickname,
          avatar: u.avatar,
          value: Math.round((u.stats.wins / u.stats.totalGames) * 100),
          extra: `${u.stats.wins}胜/${u.stats.totalGames}场`
        }))
        .sort((a, b) => b.value - a.value)
      break

    case RANKING_TYPES.WIN_STREAK:
      // 按当前连胜排序
      sortedUsers = users
        .filter(u => u.stats && u.stats.winStreak > 0)
        .map(u => ({
          openid: u.openid,
          nickname: u.nickname,
          avatar: u.avatar,
          value: u.stats.winStreak,
          extra: `最高${u.stats.maxWinStreak}连胜`
        }))
        .sort((a, b) => b.value - a.value)
      break

    case RANKING_TYPES.FASTEST_WIN:
      // 按最快猜中步数排序
      sortedUsers = users
        .filter(u => u.stats && u.stats.fastestWin)
        .map(u => ({
          openid: u.openid,
          nickname: u.nickname,
          avatar: u.avatar,
          value: u.stats.fastestWin,
          extra: `${u.stats.avgSteps.toFixed(1)}步平均`
        }))
        .sort((a, b) => a.value - b.value)
      break

    default:
      sortedUsers = users.map(u => ({
        openid: u.openid,
        nickname: u.nickname,
        avatar: u.avatar,
        value: 0,
        extra: ''
      }))
  }

  // 添加排名编号
  return sortedUsers.map((u, index) => ({
    rank: index + 1,
    ...u
  }))
}

/**
 * 更新所有排行榜
 */
async function updateAllRankings() {
  console.log('[Ranking] 开始更新排行榜...')

  // 获取所有用户（这里简化处理，实际应该分页查询）
  const db = cloudDB.getDB()
  const result = await db.collection('users').limit(1000).get()
  const users = result.data

  // 更新各类型排行榜
  for (const type of Object.values(RANKING_TYPES)) {
    const ranks = calculateRanks(users, type)
    await cloudDB.updateRanking(type, ranks)
    console.log(`[Ranking] 更新 ${type} 排行榜: ${ranks.length} 人`)
  }

  console.log('[Ranking] 排行榜更新完成')
}

/**
 * 获取排行榜
 * @param {string} type - 排行榜类型
 * @param {number} limit - 返回数量
 */
async function getRankingList(type, limit = 100) {
  const ranks = await cloudDB.getRanking(type)
  return ranks.slice(0, limit)
}

/**
 * 获取用户在排行榜中的位置
 * @param {string} type
 * @param {string} openid
 */
async function getUserRankPosition(type, openid) {
  const ranks = await cloudDB.getRanking(type)
  const index = ranks.findIndex(r => r.openid === openid)

  if (index === -1) {
    return null
  }

  return {
    rank: index + 1,
    ...ranks[index]
  }
}

/**
 * 更新用户游戏统计
 * @param {string} openid
 * @param {object} gameResult
 */
async function updateGameStats(openid, gameResult) {
  const user = await cloudDB.getUser(openid)
  if (!user) return

  const stats = { ...user.stats }

  stats.totalGames = (stats.totalGames || 0) + 1

  if (gameResult.isWin) {
    stats.wins = (stats.wins || 0) + 1
    stats.winStreak = (stats.winStreak || 0) + 1
    stats.maxWinStreak = Math.max(stats.maxWinStreak || 0, stats.winStreak)

    // 更新最快猜中
    if (!stats.fastestWin || gameResult.steps < stats.fastestWin) {
      stats.fastestWin = gameResult.steps
    }
  } else {
    stats.losses = (stats.losses || 0) + 1
    stats.winStreak = 0
  }

  // 更新平均步数
  const totalSteps = (stats.avgSteps || 0) * (stats.totalGames - 1) + gameResult.steps
  stats.avgSteps = totalSteps / stats.totalGames

  await cloudDB.updateUserStats(openid, stats)

  return stats
}

/**
 * 获取排行榜类型列表
 */
function getRankingTypes() {
  return [
    { type: RANKING_TYPES.WIN_RATE, name: '胜率榜', description: '胜率最高的玩家' },
    { type: RANKING_TYPES.WIN_STREAK, name: '连胜榜', description: '当前连胜场次' },
    { type: RANKING_TYPES.FASTEST_WIN, name: '最快猜中', description: '最少步数猜中' }
  ]
}

module.exports = {
  RANKING_TYPES,
  calculateRanks,
  updateAllRankings,
  getRankingList,
  getUserRankPosition,
  updateGameStats,
  getRankingTypes
}
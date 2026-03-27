/**
 * 游戏核心逻辑模块 - 微信小程序版
 * 包含游戏规则、验证和工具函数
 */

/**
 * 生成谜数字
 * @param {number} digits - 数字位数，默认4
 * @param {boolean} allowDuplicates - 是否允许重复数字，默认true
 * @returns {string} 生成的谜数字
 */
function generateSecretNumber(digits = 4, allowDuplicates = true) {
  let secret = '';

  if (allowDuplicates) {
    // 允许重复数字：每位随机生成0-9
    for (let i = 0; i < digits; i++) {
      secret += Math.floor(Math.random() * 10).toString();
    }
  } else {
    // 不允许重复数字：传统规则（首位不能为0）
    const digitsArr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    // 第一个数字不能为0
    let firstDigit = digitsArr.splice(Math.floor(Math.random() * 9) + 1, 1)[0];
    secret += firstDigit;

    // 其余数字随机（不重复）
    for (let i = 1; i < digits; i++) {
      const randomIndex = Math.floor(Math.random() * digitsArr.length);
      secret += digitsArr.splice(randomIndex, 1)[0];
    }
  }

  return secret;
}

/**
 * 验证输入是否为有效的谜数字（宽松验证：允许重复和首位为0）
 * @param {string} input - 用户输入
 * @param {number} digits - 期望的数字位数
 * @returns {object} 验证结果 {valid: boolean, error?: string}
 */
function validateInput(input, digits = 4) {
  // 检查是否为数字
  if (!/^\d+$/.test(input)) {
    return { valid: false, error: '请输入数字' };
  }

  // 检查长度
  if (input.length !== digits) {
    return { valid: false, error: `请输入${digits}位数字` };
  }

  return { valid: true };
}

/**
 * 计算正确位置数（网页端规则：只显示位置正确的个数）
 * @param {string} secret - 谜数字
 * @param {string} guess - 猜测数字
 * @returns {number} 正确位置数 (0-digits)
 */
function calculateMatch(secret, guess) {
  let correct = 0;
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === secret[i]) {
      correct++;
    }
  }
  return correct;
}

/**
 * 检查猜测是否正确（全部匹配）
 * @param {string} secret - 谜数字
 * @param {string} guess - 猜测数字
 * @returns {boolean} 是否完全正确
 */
function isCorrect(secret, guess) {
  return secret === guess;
}

/**
 * 格式化时间
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * 生成每日挑战谜题（根据日期固定）
 * @param {number} digits - 数字位数，默认4
 * @returns {object} { secret: 谜题数字, date: 日期字符串 }
 */
function generateDailySecret(digits = 4) {
  // 获取当前日期（UTC+8）
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`

  // 使用日期作为种子生成固定随机数
  const seed = year * 10000 + month * 100 + day
  let random = seed
  const seededRandom = () => {
    random = (random * 9301 + 49297) % 233280
    return random / 233280
  }

  // 生成谜题（允许重复数字）
  let secret = ''
  for (let i = 0; i < digits; i++) {
    secret += Math.floor(seededRandom() * 10).toString()
  }

  return { secret, date: dateStr }
}

module.exports = {
  generateSecretNumber,
  validateInput,
  calculateMatch,
  isCorrect,
  formatTime,
  generateId,
  generateDailySecret
};
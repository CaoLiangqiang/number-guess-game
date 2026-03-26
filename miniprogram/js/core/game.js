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
    return { valid: false, error: '🔢 请输入数字' };
  }

  // 检查长度
  if (input.length !== digits) {
    return { valid: false, error: `📏 请输入${digits}位数字` };
  }

  return { valid: true };
}

/**
 * 验证输入是否为有效的谜数字（严格验证：不允许重复，首位不能为0）
 * 用于单机AI模式
 * @param {string} input - 用户输入
 * @param {number} digits - 期望的数字位数
 * @returns {object} 验证结果 {valid: boolean, error?: string}
 */
function validateInputStrict(input, digits = 4) {
  // 检查是否为数字
  if (!/^\d+$/.test(input)) {
    return { valid: false, error: '🔢 请输入数字' };
  }

  // 检查长度
  if (input.length !== digits) {
    return { valid: false, error: `📏 请输入${digits}位数字` };
  }

  // 检查是否有重复数字
  if (new Set(input.split('')).size !== input.length) {
    return { valid: false, error: '🚫 数字不能重复' };
  }

  // 检查第一个数字是否为0
  if (input[0] === '0') {
    return { valid: false, error: '⚠️ 第一位不能是0' };
  }

  return { valid: true };
}

/**
 * 计算命中和提示
 * @param {string} secret - 谜数字
 * @param {string} guess - 猜测数字
 * @returns {object} {hits: number, blows: number}
 */
function calculateHint(secret, guess) {
  let hits = 0;
  let blows = 0;

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === secret[i]) {
      hits++;
    } else if (secret.includes(guess[i])) {
      blows++;
    }
  }

  return { hits, blows };
}

/**
 * 检查猜测是否正确（全部命中）
 * @param {string} secret - 谜数字
 * @param {string} guess - 猜测数字
 * @returns {boolean} 是否完全正确
 */
function isCorrect(secret, guess) {
  return secret === guess;
}

/**
 * 获取提示信息
 * @param {object} hint - {hits: number, blows: number}
 * @returns {string} 提示信息
 */
function getHintMessage(hint) {
  if (hint.hits === 0 && hint.blows === 0) {
    return '没有匹配的数字';
  }

  const parts = [];
  if (hint.hits > 0) {
    parts.push(`${hint.hits}A`);
  }
  if (hint.blows > 0) {
    parts.push(`${hint.blows}B`);
  }

  return parts.join('') || '没有匹配的数字';
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

module.exports = {
  generateSecretNumber,
  validateInput,
  validateInputStrict,
  calculateHint,
  isCorrect,
  getHintMessage,
  formatTime,
  generateId
};
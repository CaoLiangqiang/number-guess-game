/**
 * 游戏核心逻辑模块
 * 包含游戏规则、验证和工具函数
 */

/**
 * 生成谜数字
 * @param {number} digits - 数字位数，默认4
 * @returns {string} 生成的谜数字
 */
function generateSecretNumber(digits = 4) {
  const digitsArr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let secret = '';
  
  // 第一个数字不能为0
  let firstDigit = digitsArr.splice(Math.floor(Math.random() * 9) + 1, 1)[0];
  secret += firstDigit;
  
  // 其余数字随机
  for (let i = 1; i < digits; i++) {
    const randomIndex = Math.floor(Math.random() * digitsArr.length);
    secret += digitsArr.splice(randomIndex, 1)[0];
  }
  
  return secret;
}

/**
 * 验证输入是否为有效的谜数字
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
  
  // 检查是否有重复数字
  if (new Set(input.split('')).size !== input.length) {
    return { valid: false, error: '数字不能重复' };
  }
  
  // 检查第一个数字是否为0
  if (input[0] === '0') {
    return { valid: false, error: '第一位不能是0' };
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

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateSecretNumber,
    validateInput,
    calculateHint,
    isCorrect,
    getHintMessage
  };
}
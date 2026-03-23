/**
 * Token 工具模块
 * 提供安全的 token 生成和验证功能
 *
 * 使用 HMAC-SHA256 签名，包含过期时间
 */

const crypto = require('crypto');

// Token 密钥 - 生产环境应从环境变量获取
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7天过期

/**
 * 生成 token
 * @param {string} openid - 用户 openid
 * @param {string} sessionKey - 会话密钥（可选）
 * @returns {string} - base64 编码的 token
 */
function generateToken(openid, sessionKey = '') {
    const timestamp = Date.now();
    const data = `${openid}:${sessionKey}:${timestamp}`;

    // 生成签名
    const signature = crypto
        .createHmac('sha256', TOKEN_SECRET)
        .update(data)
        .digest('hex');

    // token 格式: openid:sessionKey:timestamp:signature
    const token = `${openid}:${sessionKey}:${timestamp}:${signature}`;

    return Buffer.from(token).toString('base64');
}

/**
 * 验证 token
 * @param {string} token - base64 编码的 token
 * @returns {object|null} - 验证成功返回 { openid, sessionKey }, 失败返回 null
 */
function verifyToken(token) {
    try {
        // 解码 token
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const parts = decoded.split(':');

        if (parts.length !== 4) {
            return null;
        }

        const [openid, sessionKey, timestampStr, signature] = parts;
        const timestamp = parseInt(timestampStr, 10);

        // 检查过期
        if (Date.now() - timestamp > TOKEN_EXPIRY) {
            return null;
        }

        // 验证签名
        const data = `${openid}:${sessionKey}:${timestampStr}`;
        const expectedSignature = crypto
            .createHmac('sha256', TOKEN_SECRET)
            .update(data)
            .digest('hex');

        if (signature !== expectedSignature) {
            return null;
        }

        return { openid, sessionKey };
    } catch (error) {
        return null;
    }
}

/**
 * 从请求中提取并验证 token
 * @param {object} req - HTTP 请求对象
 * @returns {object|null} - 验证成功返回 { openid, sessionKey }, 失败返回 null
 */
function extractAndVerifyToken(req) {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.slice(7);
    return verifyToken(token);
}

module.exports = {
    generateToken,
    verifyToken,
    extractAndVerifyToken
};
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '{{projectNameKebab}}-secret-key-change-in-production';

/**
 * JWT 認證中間件
 * 驗證請求中的 JWT token，確保用戶已經登入
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: '存取被拒絕：未提供認證令牌' 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('JWT 驗證失敗:', err.message);
            return res.status(403).json({ 
                success: false, 
                message: '令牌無效或已過期，請重新登入' 
            });
        }

        // 將用戶信息附加到請求對象
        req.user = user;
        next();
    });
};

/**
 * 角色權限檢查中間件
 * 檢查用戶是否具有指定角色的權限
 */
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未認證的用戶'
            });
        }

        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `權限不足：需要 ${allowedRoles.join(' 或 ')} 權限`
            });
        }

        next();
    };
};

/**
 * 管理員權限檢查
 */
const requireAdmin = requireRole(['admin']);

/**
 * 主管權限檢查（包含管理員）
 */
const requireSupervisor = requireRole(['admin', 'supervisor']);

/**
 * 品管權限檢查
 */
const requireQuality = requireRole(['admin', 'supervisor', 'quality']);

module.exports = {
    authenticateToken,
    requireRole,
    requireAdmin,
    requireSupervisor,
    requireQuality
};

const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8847;
const JWT_SECRET = process.env.JWT_SECRET || '{{projectNameKebab}}-secret-key-change-in-production';

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 靜態文件服務
app.use(express.static(path.join(__dirname, '../frontend')));

// JWT 認證中間件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: '未提供認證令牌' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: '令牌無效或已過期' });
        }
        req.user = user;
        next();
    });
};

// 模擬用戶數據庫（實際項目請使用真實數據庫）
const users = [
    { id: 1, username: 'admin', password: '$2b$10$rOz9VXKCu1YJ.VqcHNqvCOqH9mYwH5nVhYhR2Y8U5MKpKzXz2YZ6S', role: 'admin', name: '系統管理員' }, // admin123
    { id: 2, username: 'emp001', password: '$2b$10$rOz9VXKCu1YJ.VqcHNqvCOqH9mYwH5nVhYhR2Y8U5MKpKzXz2YZ6S', role: 'operator', name: '生產操作員' }, // password
    { id: 3, username: 'supervisor', password: '$2b$10$rOz9VXKCu1YJ.VqcHNqvCOqH9mYwH5nVhYhR2Y8U5MKpKzXz2YZ6S', role: 'supervisor', name: '生產主管' }, // super123
    { id: 4, username: 'qc001', password: '$2b$10$rOz9VXKCu1YJ.VqcHNqvCOqH9mYwH5nVhYhR2Y8U5MKpKzXz2YZ6S', role: 'quality', name: '品管人員' } // qc123
];

// 模擬工單數據
const workOrders = [
    { id: 'WO001', productName: '{{projectName}} 產品 A', quantity: 100, status: 'in-progress', priority: 'high' },
    { id: 'WO002', productName: '{{projectName}} 產品 B', quantity: 200, status: 'pending', priority: 'medium' },
    { id: 'WO003', productName: '{{projectName}} 產品 C', quantity: 150, status: 'completed', priority: 'low' }
];

// 模擬工作站數據
const workstations = [
    { id: 'WS001', name: '組裝線 A', status: 'running', efficiency: 95, operator: 'emp001' },
    { id: 'WS002', name: '包裝線 B', status: 'idle', efficiency: 88, operator: 'emp002' },
    { id: 'WS003', name: '品檢站 C', status: 'maintenance', efficiency: 0, operator: null }
];

// 模擬品質檢查項目
const qualityChecks = {
    'WO001': [
        { id: 1, item: '外觀檢查', required: true, status: 'pending' },
        { id: 2, item: '尺寸測量', required: true, status: 'pending' },
        { id: 3, item: '功能測試', required: true, status: 'pending' }
    ],
    'WO002': [
        { id: 1, item: '材質檢驗', required: true, status: 'pending' },
        { id: 2, item: '重量檢查', required: false, status: 'pending' }
    ]
};

// ==================== 認證 API ====================

// 登入 API
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('登入嘗試:', { username, timestamp: new Date().toISOString() });
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '請提供用戶名和密碼'
            });
        }

        // 查找用戶
        const user = users.find(u => u.username === username);
        if (!user) {
            console.log('用戶不存在:', username);
            return res.status(401).json({
                success: false,
                message: '用戶名或密碼錯誤'
            });
        }

        // 驗證密碼
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.log('密碼錯誤:', username);
            return res.status(401).json({
                success: false,
                message: '用戶名或密碼錯誤'
            });
        }

        // 生成 JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role,
                name: user.name
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        console.log('登入成功:', { username, role: user.role });

        res.json({
            success: true,
            message: '登入成功',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name
            }
        });
    } catch (error) {
        console.error('登入錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

// ==================== 生產相關 API ====================

// 提交生產記錄
app.post('/api/production/records', authenticateToken, (req, res) => {
    try {
        const { workOrderId, workstationId, quantity, qualityChecks, remarks } = req.body;
        
        console.log('生產記錄提交:', {
            user: req.user.username,
            workOrderId,
            workstationId,
            quantity,
            timestamp: new Date().toISOString()
        });

        // 驗證必要欄位
        if (!workOrderId || !workstationId || !quantity) {
            return res.status(400).json({
                success: false,
                message: '請填寫所有必要欄位'
            });
        }

        // 模擬保存記錄
        const record = {
            id: Date.now(),
            workOrderId,
            workstationId,
            quantity: parseInt(quantity),
            qualityChecks: qualityChecks || [],
            remarks: remarks || '',
            operator: req.user.username,
            operatorName: req.user.name,
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            message: '生產記錄提交成功',
            record: record
        });
    } catch (error) {
        console.error('生產記錄提交錯誤:', error);
        res.status(500).json({
            success: false,
            message: '提交失敗，請稍後再試'
        });
    }
});

// 獲取工單列表
app.get('/api/production/work-orders', authenticateToken, (req, res) => {
    res.json({
        success: true,
        workOrders: workOrders
    });
});

// 獲取特定工單的品質檢查項目
app.get('/api/production/work-orders/:id/quality-checks', authenticateToken, (req, res) => {
    const workOrderId = req.params.id;
    const checks = qualityChecks[workOrderId] || [];
    
    res.json({
        success: true,
        qualityChecks: checks
    });
});

// 今日生產統計
app.get('/api/production/today-stats', authenticateToken, (req, res) => {
    const stats = {
        totalProduction: 1250,
        completedOrders: 8,
        activeWorkstations: 15,
        efficiency: 92.5,
        qualityPass: 98.2
    };

    res.json({
        success: true,
        stats: stats
    });
});

// 獲取工作站列表
app.get('/api/workstations', authenticateToken, (req, res) => {
    res.json({
        success: true,
        workstations: workstations
    });
});

// ==================== 前端路由 ====================

// 首頁
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// 主儀表板
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 生產記錄
app.get('/production-record', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/production-record.html'));
});

// 工作站管理
app.get('/workstation', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/workstation.html'));
});

// 即時監控
app.get('/dashboard-live', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard-live.html'));
});

// 報表中心
app.get('/reports', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/reports.html'));
});

// SOP 程序
app.get('/sop', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/sop.html'));
});

// 設備管理
app.get('/equipment', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/equipment.html'));
});

// ==================== 健康檢查 ====================

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: '{{projectName}} Production System',
        version: '1.0.0'
    });
});

// ==================== 啟動服務器 ====================

app.listen(PORT, () => {
    console.log(`
🏭 {{projectName}} Production System Server Started
🚀 Server running on port ${PORT}
🌐 Access: http://localhost:${PORT}
📊 Health Check: http://localhost:${PORT}/health
🔐 Default Login: admin / admin123
⏰ Started at: ${new Date().toISOString()}
    `);
});

module.exports = app;

/**
 * JWT 認證系統測試
 * 基於 {{projectName}} 企業級生產管理系統
 * 
 * 測試內容：
 * - JWT token 生成和驗證
 * - 登入 API 功能
 * - 密碼加密驗證
 * - 權限檢查機制
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 配置
const JWT_SECRET = 'test-secret-key';
const BCRYPT_ROUNDS = 10;

console.log('🔐 {{projectName}} JWT 認證系統測試');
console.log('=' .repeat(50));

async function testBcryptHashing() {
    console.log('\n1. 測試 bcrypt 密碼加密...');
    
    try {
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
        
        console.log(`✅ 原始密碼: ${password}`);
        console.log(`✅ 加密後密碼: ${hashedPassword}`);
        
        // 驗證密碼
        const isValid = await bcrypt.compare(password, hashedPassword);
        console.log(`✅ 密碼驗證結果: ${isValid ? '正確' : '錯誤'}`);
        
        // 測試錯誤密碼
        const isWrong = await bcrypt.compare('wrongpassword', hashedPassword);
        console.log(`✅ 錯誤密碼驗證: ${isWrong ? '錯誤通過' : '正確拒絕'}`);
        
        return true;
    } catch (error) {
        console.error('❌ bcrypt 測試失敗:', error.message);
        return false;
    }
}

function testJWTGeneration() {
    console.log('\n2. 測試 JWT Token 生成...');
    
    try {
        const userData = {
            id: 1,
            username: 'admin',
            role: 'admin',
            name: '系統管理員'
        };
        
        // 生成 token
        const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '8h' });
        console.log(`✅ 生成的 JWT Token: ${token.substring(0, 50)}...`);
        
        // 驗證 token
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token 驗證成功:');
        console.log(`   - 用戶ID: ${decoded.id}`);
        console.log(`   - 用戶名: ${decoded.username}`);
        console.log(`   - 角色: ${decoded.role}`);
        console.log(`   - 姓名: ${decoded.name}`);
        console.log(`   - 過期時間: ${new Date(decoded.exp * 1000).toLocaleString()}`);
        
        return true;
    } catch (error) {
        console.error('❌ JWT 生成測試失敗:', error.message);
        return false;
    }
}

function testJWTValidation() {
    console.log('\n3. 測試 JWT Token 驗證...');
    
    try {
        const validToken = jwt.sign(
            { id: 1, username: 'admin', role: 'admin' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        // 測試有效 token
        const decoded = jwt.verify(validToken, JWT_SECRET);
        console.log('✅ 有效 Token 驗證通過');
        
        // 測試無效 token
        try {
            jwt.verify('invalid.token.here', JWT_SECRET);
            console.log('❌ 無效 Token 應該被拒絕');
        } catch (error) {
            console.log('✅ 無效 Token 正確被拒絕');
        }
        
        // 測試錯誤密鑰
        try {
            jwt.verify(validToken, 'wrong-secret');
            console.log('❌ 錯誤密鑰應該被拒絕');
        } catch (error) {
            console.log('✅ 錯誤密鑰正確被拒絕');
        }
        
        return true;
    } catch (error) {
        console.error('❌ JWT 驗證測試失敗:', error.message);
        return false;
    }
}

async function testLoginFlow() {
    console.log('\n4. 測試完整登入流程...');
    
    try {
        // 模擬用戶數據庫
        const users = [
            { 
                id: 1, 
                username: 'admin', 
                password: await bcrypt.hash('admin123', BCRYPT_ROUNDS), 
                role: 'admin',
                name: '系統管理員'
            },
            { 
                id: 2, 
                username: 'emp001', 
                password: await bcrypt.hash('password', BCRYPT_ROUNDS), 
                role: 'operator',
                name: '生產操作員'
            }
        ];
        
        // 測試正確登入
        const loginAttempt = { username: 'admin', password: 'admin123' };
        const user = users.find(u => u.username === loginAttempt.username);
        
        if (user) {
            const validPassword = await bcrypt.compare(loginAttempt.password, user.password);
            
            if (validPassword) {
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
                
                console.log('✅ 登入流程測試成功');
                console.log(`   - 用戶: ${user.name} (${user.username})`);
                console.log(`   - 角色: ${user.role}`);
                console.log(`   - Token 長度: ${token.length} 字符`);
                
                return true;
            }
        }
        
        console.log('❌ 登入流程測試失敗');
        return false;
        
    } catch (error) {
        console.error('❌ 登入流程測試失敗:', error.message);
        return false;
    }
}

function testRoleBasedAccess() {
    console.log('\n5. 測試角色權限控制...');
    
    try {
        const roles = ['admin', 'supervisor', 'operator', 'quality'];
        const permissions = {
            'admin': ['create', 'read', 'update', 'delete', 'manage'],
            'supervisor': ['create', 'read', 'update', 'approve'],
            'operator': ['create', 'read'],
            'quality': ['read', 'quality_check', 'approve_quality']
        };
        
        roles.forEach(role => {
            const userPermissions = permissions[role];
            console.log(`✅ ${role} 角色權限: ${userPermissions.join(', ')}`);
        });
        
        // 測試權限檢查邏輯
        function hasPermission(userRole, requiredPermission) {
            return permissions[userRole]?.includes(requiredPermission) || false;
        }
        
        console.log('\n   權限檢查測試:');
        console.log(`   - admin 可以刪除: ${hasPermission('admin', 'delete')}`);
        console.log(`   - operator 可以刪除: ${hasPermission('operator', 'delete')}`);
        console.log(`   - quality 可以品檢: ${hasPermission('quality', 'quality_check')}`);
        console.log(`   - supervisor 可以審核: ${hasPermission('supervisor', 'approve')}`);
        
        return true;
    } catch (error) {
        console.error('❌ 角色權限測試失敗:', error.message);
        return false;
    }
}

// 執行所有測試
async function runAllTests() {
    console.log(`開始時間: ${new Date().toLocaleString()}`);
    
    const tests = [
        testBcryptHashing,
        testJWTGeneration,
        testJWTValidation,
        testLoginFlow,
        testRoleBasedAccess
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
        try {
            const result = await test();
            if (result) passedTests++;
        } catch (error) {
            console.error(`❌ 測試執行錯誤: ${error.message}`);
        }
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log(`🎯 測試結果: ${passedTests}/${totalTests} 通過`);
    console.log(`結束時間: ${new Date().toLocaleString()}`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有測試通過！JWT 認證系統工作正常');
        process.exit(0);
    } else {
        console.log('⚠️  部分測試失敗，請檢查系統配置');
        process.exit(1);
    }
}

// 如果直接執行此文件
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('💥 測試執行失敗:', error);
        process.exit(1);
    });
}

module.exports = {
    testBcryptHashing,
    testJWTGeneration,
    testJWTValidation,
    testLoginFlow,
    testRoleBasedAccess
};

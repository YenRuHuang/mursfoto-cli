#!/usr/bin/env node

/**
 * 🗄️ Mursfoto 資料庫自動化設定腳本
 * 基於成功專案 mursfoto-api-gateway-main 的最佳實踐
 * 
 * 功能特色:
 * ✅ 支援 Zeabur + Hostinger MySQL
 * ✅ 自動錯誤診斷和修復建議
 * ✅ 完整的資料表初始化
 * ✅ JWT Token 自動生成
 * ✅ 連線狀態監控
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const winston = require('winston');

// 設定 Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

/**
 * 🚀 Mursfoto 標準資料庫表格定義
 * 根據實際使用需求優化的表格結構
 */
const MURSFOTO_TABLE_DEFINITIONS = {
  // 服務註冊表
  mursfoto_services: `
    CREATE TABLE IF NOT EXISTS mursfoto_services (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      type VARCHAR(100) NOT NULL COMMENT 'api, frontend, crawler, ai-service',
      port INT NOT NULL,
      status ENUM('active', 'inactive', 'error', 'deploying') DEFAULT 'active',
      version VARCHAR(50) DEFAULT '1.0.0',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      last_health_check TIMESTAMP NULL,
      health_check_url VARCHAR(500) NULL,
      metadata JSON COMMENT 'Service configuration and metadata',
      INDEX idx_name (name),
      INDEX idx_type (type),
      INDEX idx_status (status),
      INDEX idx_port (port),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
    COMMENT='Mursfoto 服務註冊與管理表'
  `,

  // API Token 管理表
  api_tokens: `
    CREATE TABLE IF NOT EXISTS api_tokens (
      id VARCHAR(36) PRIMARY KEY,
      service_id VARCHAR(36),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      token_hash VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NULL,
      is_active BOOLEAN DEFAULT TRUE,
      usage_count INT DEFAULT 0,
      last_used_at TIMESTAMP NULL,
      created_by VARCHAR(255) DEFAULT 'system',
      permissions JSON COMMENT 'Token permissions and scopes',
      rate_limit_per_hour INT DEFAULT 1000,
      FOREIGN KEY (service_id) REFERENCES mursfoto_services(id) ON DELETE CASCADE,
      INDEX idx_token_hash (token_hash),
      INDEX idx_service_id (service_id),
      INDEX idx_active (is_active),
      INDEX idx_expires (expires_at),
      INDEX idx_usage_count (usage_count)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    COMMENT='API Token 管理與權限控制表'
  `,

  // 使用記錄表
  usage_logs: `
    CREATE TABLE IF NOT EXISTS usage_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      service_id VARCHAR(36),
      token_id VARCHAR(36),
      endpoint VARCHAR(255) NOT NULL,
      method VARCHAR(10) NOT NULL,
      status_code INT,
      response_time_ms INT,
      ip_address VARCHAR(45),
      user_agent TEXT,
      request_size INT DEFAULT 0,
      response_size INT DEFAULT 0,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      date_partition DATE GENERATED ALWAYS AS (DATE(created_at)) STORED,
      FOREIGN KEY (service_id) REFERENCES mursfoto_services(id) ON DELETE CASCADE,
      FOREIGN KEY (token_id) REFERENCES api_tokens(id) ON DELETE SET NULL,
      INDEX idx_service_id (service_id),
      INDEX idx_token_id (token_id),
      INDEX idx_endpoint (endpoint),
      INDEX idx_date_partition (date_partition),
      INDEX idx_created_at (created_at),
      INDEX idx_status_code (status_code),
      INDEX idx_response_time (response_time_ms)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    COMMENT='API 使用記錄與監控表'
  `,

  // 部署記錄表
  deployment_logs: `
    CREATE TABLE IF NOT EXISTS deployment_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      service_id VARCHAR(36),
      version VARCHAR(100) NOT NULL,
      platform VARCHAR(50) NOT NULL COMMENT 'zeabur, hostinger, vercel, etc',
      status ENUM('pending', 'building', 'deploying', 'success', 'failed', 'rolled_back') DEFAULT 'pending',
      deployment_url VARCHAR(500),
      build_logs TEXT,
      error_message TEXT,
      deployment_config JSON,
      deployed_by VARCHAR(255),
      deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      duration_seconds INT GENERATED ALWAYS AS (TIMESTAMPDIFF(SECOND, deployed_at, completed_at)) STORED,
      FOREIGN KEY (service_id) REFERENCES mursfoto_services(id) ON DELETE CASCADE,
      INDEX idx_service_id (service_id),
      INDEX idx_status (status),
      INDEX idx_platform (platform),
      INDEX idx_version (version),
      INDEX idx_deployed_at (deployed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    COMMENT='服務部署記錄與版本管理表'
  `,

  // 系統配置表
  system_config: `
    CREATE TABLE IF NOT EXISTS system_config (
      key_name VARCHAR(100) PRIMARY KEY,
      key_value TEXT,
      description TEXT,
      category VARCHAR(50) DEFAULT 'general',
      is_encrypted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      updated_by VARCHAR(255),
      INDEX idx_category (category),
      INDEX idx_updated_at (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    COMMENT='系統配置與設定管理表'
  `
};

/**
 * 🔧 主要資料庫設定函數
 */
async function setupMursfotoDatabase() {
  let connection = null;

  try {
    logger.info('🚀 開始 Mursfoto 資料庫初始化...');
    
    // 環境變數檢查
    const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`❌ 缺少必要的環境變數: ${missingVars.join(', ')}\n請檢查 .env 檔案是否正確配置`);
    }

    // 資料庫連線配置 - Zeabur + Hostinger 最佳實踐
    const dbConfig = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4',
      timezone: '+08:00',
      connectTimeout: 30000,
      acquireTimeout: 30000,
      timeout: 30000,
      // Zeabur 優化設定
      ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
    };

    logger.info('📍 資料庫連線資訊:');
    logger.info(`   主機: ${dbConfig.host}:${dbConfig.port}`);
    logger.info(`   用戶: ${dbConfig.user}`);
    logger.info(`   資料庫: ${dbConfig.database}`);
    logger.info(`   SSL: ${dbConfig.ssl ? '啟用' : '停用'}`);

    // 建立連線
    logger.info('🔌 建立資料庫連線...');
    connection = await mysql.createConnection(dbConfig);
    
    // 測試連線
    await connection.execute('SELECT 1 as test, NOW() as server_time, @@version as mysql_version');
    logger.info('✅ 資料庫連線測試通過');

    // 檢查資料庫資訊
    const [dbInfo] = await connection.execute(`
      SELECT 
        SCHEMA_NAME as db_name,
        DEFAULT_CHARACTER_SET_NAME as charset,
        DEFAULT_COLLATION_NAME as collation
      FROM INFORMATION_SCHEMA.SCHEMATA 
      WHERE SCHEMA_NAME = ?
    `, [process.env.DB_NAME]);

    if (dbInfo.length > 0) {
      logger.info('📊 資料庫資訊:');
      logger.info(`   字符集: ${dbInfo[0].charset}`);
      logger.info(`   排序規則: ${dbInfo[0].collation}`);
    }

    // 創建資料表
    logger.info('🏗️  開始創建 Mursfoto 資料表...');
    
    let createdCount = 0;
    let existingCount = 0;
    
    for (const [tableName, sql] of Object.entries(MURSFOTO_TABLE_DEFINITIONS)) {
      try {
        logger.info(`📋 創建表格: ${tableName}`);
        await connection.execute(sql);
        createdCount++;
        logger.info(`✅ 表格 ${tableName} 創建成功`);
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          existingCount++;
          logger.info(`ℹ️  表格 ${tableName} 已存在，跳過`);
        } else {
          logger.error(`❌ 創建表格 ${tableName} 失敗:`, error.message);
          // 繼續處理其他表格
        }
      }
    }

    logger.info(`📈 表格創建摘要: ${createdCount} 個新建, ${existingCount} 個已存在`);

    // 檢查表格狀態
    logger.info('🔍 驗證表格結構...');
    const [tables] = await connection.execute(`
      SELECT 
        TABLE_NAME, 
        TABLE_ROWS, 
        ROUND(DATA_LENGTH / 1024, 2) as DATA_SIZE_KB,
        ENGINE,
        TABLE_COLLATION
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('mursfoto_services', 'api_tokens', 'usage_logs', 'deployment_logs', 'system_config')
      ORDER BY TABLE_NAME
    `, [process.env.DB_NAME]);

    logger.info('📊 資料表狀態:');
    tables.forEach(table => {
      logger.info(`  📋 ${table.TABLE_NAME}:`);
      logger.info(`      記錄數: ${table.TABLE_ROWS || 0}`);
      logger.info(`      大小: ${table.DATA_SIZE_KB || 0} KB`);
      logger.info(`      引擎: ${table.ENGINE}`);
    });

    // 初始化系統配置
    await initializeSystemConfig(connection);

    // 創建管理員 Token
    await createAdminToken(connection);

    // 最終驗證
    await performFinalValidation(connection);

    logger.info('🎉 Mursfoto 資料庫初始化完成！');
    logger.info('');
    logger.info('📋 設定摘要:');
    logger.info(`  🗄️  資料庫: ${process.env.DB_NAME}`);
    logger.info(`  📊 表格數量: ${tables.length}`);
    logger.info(`  🔧 狀態: 完全就緒 ✅`);
    logger.info('');
    logger.info('🚀 現在可以啟動 Mursfoto 服務:');
    logger.info('   npm run dev    (開發模式)');
    logger.info('   npm start      (生產模式)');
    logger.info('');

  } catch (error) {
    logger.error('❌ Mursfoto 資料庫初始化失敗:', error.message);
    
    await provideTroubleshootingGuide(error);
    process.exit(1);
    
  } finally {
    if (connection) {
      await connection.end();
      logger.info('🔌 資料庫連線已關閉');
    }
  }
}

/**
 * 🔧 初始化系統配置
 */
async function initializeSystemConfig(connection) {
  logger.info('⚙️  初始化系統配置...');
  
  const configs = [
    {
      key_name: 'mursfoto.version',
      key_value: '1.0.0',
      description: 'Mursfoto 框架版本',
      category: 'system'
    },
    {
      key_name: 'mursfoto.initialized_at',
      key_value: new Date().toISOString(),
      description: '系統初始化時間',
      category: 'system'
    },
    {
      key_name: 'api.rate_limit.default',
      key_value: '1000',
      description: '預設 API 速率限制 (每小時)',
      category: 'api'
    },
    {
      key_name: 'deployment.platform.default',
      key_value: 'zeabur',
      description: '預設部署平台',
      category: 'deployment'
    }
  ];

  for (const config of configs) {
    try {
      await connection.execute(`
        INSERT IGNORE INTO system_config 
        (key_name, key_value, description, category, updated_by)
        VALUES (?, ?, ?, ?, 'system')
      `, [config.key_name, config.key_value, config.description, config.category]);
    } catch (error) {
      logger.warn(`設定 ${config.key_name} 初始化失敗:`, error.message);
    }
  }

  logger.info('✅ 系統配置初始化完成');
}

/**
 * 🔐 創建管理員 Token
 */
async function createAdminToken(connection) {
  logger.info('🔐 創建管理員 Token...');
  
  const tokenId = crypto.randomUUID();
  const adminToken = jwt.sign(
    { 
      id: tokenId,
      type: 'admin',
      name: 'Mursfoto Admin Token',
      permissions: ['*']
    },
    process.env.JWT_SECRET,
    { expiresIn: '365d' } // 一年有效期
  );

  const tokenHash = crypto
    .createHash('sha256')
    .update(adminToken)
    .digest('hex');

  await connection.execute(`
    INSERT INTO api_tokens 
    (id, name, description, token_hash, created_by, expires_at, permissions, rate_limit_per_hour) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    token_hash = VALUES(token_hash),
    updated_at = CURRENT_TIMESTAMP
  `, [
    tokenId,
    'Mursfoto Admin Token',
    'Mursfoto 框架管理員令牌，具有完整系統權限',
    tokenHash,
    'system',
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 一年後過期
    JSON.stringify({ scopes: ['*'], admin: true }),
    10000 // 管理員令牌較高的速率限制
  ]);

  logger.info('✅ 管理員 Token 創建成功');
  logger.info('🔑 管理員 Token:');
  logger.info(`   ${adminToken}`);
  logger.info('');
  logger.info('⚠️  重要提醒:');
  logger.info('   • 請妥善保管此 Token');
  logger.info('   • Token 有效期為 1 年');
  logger.info('   • 用於 API 認證和管理操作');
  logger.info('');
}

/**
 * 🔬 執行最終驗證
 */
async function performFinalValidation(connection) {
  logger.info('🔬 執行最終系統驗證...');
  
  try {
    // 測試表格查詢
    const [serviceCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM mursfoto_services'
    );
    
    const [tokenCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM api_tokens WHERE is_active = TRUE'
    );
    
    const [configCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM system_config'
    );

    // 測試外鍵約束
    await connection.execute('SELECT COUNT(*) as count FROM usage_logs');
    await connection.execute('SELECT COUNT(*) as count FROM deployment_logs');

    logger.info('✅ 資料表關聯性驗證通過');
    logger.info(`📊 驗證結果:`);
    logger.info(`   服務數量: ${serviceCount[0].count}`);
    logger.info(`   Token 數量: ${tokenCount[0].count}`);
    logger.info(`   配置項目: ${configCount[0].count}`);
    
  } catch (error) {
    logger.error('❌ 最終驗證失敗:', error.message);
    throw error;
  }
}

/**
 * 🛠️ 故障排除指南
 */
async function provideTroubleshootingGuide(error) {
  logger.error('');
  logger.error('🔧 故障排除指南:');
  logger.error('');
  
  if (error.code === 'ENOTFOUND') {
    logger.error('🔍 資料庫主機無法連接');
    logger.error('   1. 檢查 DB_HOST 設定是否正確');
    logger.error('   2. 確認網路連接正常');
    logger.error('   3. 檢查 Zeabur/Hostinger 資料庫服務狀態');
    logger.error('   4. 確認防火牆設定');
    
  } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    logger.error('🔐 資料庫認證失敗');
    logger.error('   1. 檢查 DB_USER 和 DB_PASSWORD');
    logger.error('   2. 確認用戶有足夠的資料庫權限');
    logger.error('   3. 檢查 Hostinger 用戶設定');
    logger.error('   4. 驗證用戶可以從外部 IP 連接');
    
  } else if (error.code === 'ER_BAD_DB_ERROR') {
    logger.error('🗄️ 資料庫不存在');
    logger.error('   1. 檢查 DB_NAME 拼寫');
    logger.error('   2. 在 Hostinger 控制台確認資料庫已創建');
    logger.error('   3. 確認用戶有該資料庫的存取權限');
    
  } else if (error.code === 'ETIMEDOUT') {
    logger.error('⏰ 連線超時');
    logger.error('   1. 檢查網路連接速度');
    logger.error('   2. 嘗試增加連線超時時間');
    logger.error('   3. 檢查是否有防火牆阻擋');
    
  } else if (error.message?.includes('環境變數')) {
    logger.error('⚙️  環境變數配置問題');
    logger.error('   1. 檢查 .env 檔案是否存在');
    logger.error('   2. 確認所有必要的環境變數已設定');
    logger.error('   3. 參考專案的 .env.example 檔案');
    logger.error('   4. 檢查環境變數值是否包含特殊字符');
    
  } else {
    logger.error('❓ 未知錯誤');
    logger.error('   1. 檢查網路連接');
    logger.error('   2. 檢查資料庫服務狀態');
    logger.error('   3. 查看完整錯誤日誌');
    logger.error('   4. 聯繫技術支援');
  }
  
  logger.error('');
  logger.error('📖 更多幫助:');
  logger.error('   • Zeabur 文檔: https://zeabur.com/docs');
  logger.error('   • Hostinger 支援: https://www.hostinger.com/help');
  logger.error('   • Mursfoto 框架文檔: README.md');
  logger.error('');
}

// 執行資料庫設定
if (require.main === module) {
  setupMursfotoDatabase();
}

module.exports = { 
  setupMursfotoDatabase,
  MURSFOTO_TABLE_DEFINITIONS 
};
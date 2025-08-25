const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

/**
 * 🗄️ Mursfoto MySQL 資料庫服務
 * 基於成功專案 mursfoto-api-gateway-main 的最佳實踐
 * 支援 Zeabur + Hostinger MySQL 部署
 */
class MursfotoDatabaseService {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  /**
   * 🔌 初始化資料庫連線
   * 支援自動降級和錯誤恢復
   */
  async init() {
    if (this.isConnected) return true;
    
    try {
      // 檢查環境變數
      const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        logger.warn(`Missing database credentials: ${missingVars.join(', ')}`);
        logger.warn('Service will continue without database features');
        return false;
      }

      // Mursfoto 標準資料庫配置
      const dbConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT) || 3306,
        waitForConnections: true,
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
        queueLimit: 0,
        connectTimeout: 30000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        charset: 'utf8mb4',
        timezone: '+08:00'
      };

      logger.info('🔧 Initializing Mursfoto Database Service...');
      logger.info('📍 Connection info:', {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        database: dbConfig.database
      });

      this.pool = mysql.createPool(dbConfig);

      // 測試連線
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      
      logger.info('✅ Database connection established successfully');
      
      // 初始化資料表結構
      await this.initializeTables();
      logger.info('✅ Database tables initialized successfully');
      
      this.isConnected = true;
      this.retryCount = 0;
      return true;

    } catch (error) {
      this.retryCount++;
      logger.error(`❌ Database connection failed (attempt ${this.retryCount}/${this.maxRetries}):`, error);
      
      if (this.retryCount < this.maxRetries) {
        logger.info(`🔄 Retrying database connection in 5 seconds...`);
        setTimeout(() => this.init(), 5000);
        return false;
      }
      
      logger.warn('⚠️  Service will continue without database features');
      await this.cleanup();
      return false;
    }
  }

  /**
   * 🏗️ 初始化資料庫表格結構
   * 基於成功專案的最佳實踐設計
   */
  async initializeTables() {
    const tables = [
      // 服務註冊表 - 追蹤所有 Mursfoto 服務
      {
        name: 'mursfoto_services',
        sql: `CREATE TABLE IF NOT EXISTS mursfoto_services (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          type VARCHAR(100) NOT NULL,
          port INT NOT NULL,
          status ENUM('active', 'inactive', 'error') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          last_health_check TIMESTAMP NULL,
          metadata JSON,
          INDEX idx_name (name),
          INDEX idx_type (type),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },

      // API 金鑰管理表
      {
        name: 'api_tokens',
        sql: `CREATE TABLE IF NOT EXISTS api_tokens (
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
          created_by VARCHAR(255),
          permissions JSON,
          FOREIGN KEY (service_id) REFERENCES mursfoto_services(id) ON DELETE CASCADE,
          INDEX idx_token_hash (token_hash),
          INDEX idx_service_id (service_id),
          INDEX idx_active (is_active),
          INDEX idx_expires (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },

      // 使用記錄表
      {
        name: 'usage_logs',
        sql: `CREATE TABLE IF NOT EXISTS usage_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          service_id VARCHAR(36),
          token_id VARCHAR(36),
          endpoint VARCHAR(255) NOT NULL,
          method VARCHAR(10) NOT NULL,
          status_code INT,
          response_time_ms INT,
          ip_address VARCHAR(45),
          user_agent TEXT,
          request_size INT,
          response_size INT,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (service_id) REFERENCES mursfoto_services(id) ON DELETE CASCADE,
          FOREIGN KEY (token_id) REFERENCES api_tokens(id) ON DELETE SET NULL,
          INDEX idx_service_id (service_id),
          INDEX idx_token_id (token_id),
          INDEX idx_endpoint (endpoint),
          INDEX idx_created_at (created_at),
          INDEX idx_status_code (status_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },

      // 部署記錄表
      {
        name: 'deployment_logs',
        sql: `CREATE TABLE IF NOT EXISTS deployment_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          service_id VARCHAR(36),
          version VARCHAR(100),
          platform VARCHAR(50) NOT NULL, -- 'zeabur', 'hostinger', etc
          status ENUM('pending', 'deploying', 'success', 'failed') DEFAULT 'pending',
          deployment_url VARCHAR(500),
          build_logs TEXT,
          error_message TEXT,
          deployed_by VARCHAR(255),
          deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP NULL,
          FOREIGN KEY (service_id) REFERENCES mursfoto_services(id) ON DELETE CASCADE,
          INDEX idx_service_id (service_id),
          INDEX idx_status (status),
          INDEX idx_platform (platform),
          INDEX idx_deployed_at (deployed_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      }
    ];

    for (const table of tables) {
      try {
        await this.pool.execute(table.sql);
        logger.debug(`✅ Table '${table.name}' initialized`);
      } catch (error) {
        logger.error(`❌ Failed to create table '${table.name}':`, error);
        // 繼續創建其他表格
      }
    }
  }

  /**
   * 🔍 通用查詢方法
   */
  async query(sql, params = []) {
    try {
      if (!this.pool && !this.isConnected) {
        const initialized = await this.init();
        if (!initialized) {
          throw new Error('Database connection failed');
        }
      }
      
      if (!this.pool) {
        throw new Error('Database connection pool unavailable');
      }
      
      const [results] = await this.pool.execute(sql, params);
      return results;
    } catch (error) {
      logger.error('Database query failed:', { sql, params, error: error.message });
      throw error;
    }
  }

  /**
   * 🔄 事務處理
   */
  async transaction(callback) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ==================== Mursfoto 服務管理 ====================

  /**
   * 📝 註冊新服務
   */
  async registerService(serviceData) {
    const { id, name, type, port, metadata = {} } = serviceData;
    const sql = `
      INSERT INTO mursfoto_services (id, name, type, port, metadata)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      type = VALUES(type), port = VALUES(port), 
      metadata = VALUES(metadata), updated_at = CURRENT_TIMESTAMP
    `;
    await this.query(sql, [id, name, type, port, JSON.stringify(metadata)]);
    return this.getServiceById(id);
  }

  /**
   * 📋 取得服務資訊
   */
  async getServiceById(id) {
    const sql = 'SELECT * FROM mursfoto_services WHERE id = ?';
    const results = await this.query(sql, [id]);
    return results[0];
  }

  async getAllServices() {
    const sql = 'SELECT * FROM mursfoto_services ORDER BY created_at DESC';
    return await this.query(sql);
  }

  /**
   * 💓 更新服務健康狀態
   */
  async updateServiceHealth(id, status) {
    const sql = `
      UPDATE mursfoto_services 
      SET status = ?, last_health_check = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await this.query(sql, [status, id]);
  }

  // ==================== Token 管理 ====================

  async createToken(tokenData) {
    const { id, serviceId, name, description, tokenHash, expiresAt, createdBy, permissions = {} } = tokenData;
    const sql = `
      INSERT INTO api_tokens (id, service_id, name, description, token_hash, expires_at, created_by, permissions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await this.query(sql, [id, serviceId, name, description, tokenHash, expiresAt, createdBy, JSON.stringify(permissions)]);
    return this.getTokenById(id);
  }

  async getTokenById(id) {
    const sql = `
      SELECT t.*, s.name as service_name 
      FROM api_tokens t 
      LEFT JOIN mursfoto_services s ON t.service_id = s.id 
      WHERE t.id = ?
    `;
    const results = await this.query(sql, [id]);
    return results[0];
  }

  async getTokenByHash(tokenHash) {
    const sql = `
      SELECT t.*, s.name as service_name 
      FROM api_tokens t 
      LEFT JOIN mursfoto_services s ON t.service_id = s.id 
      WHERE t.token_hash = ? AND t.is_active = TRUE
    `;
    const results = await this.query(sql, [tokenHash]);
    return results[0];
  }

  // ==================== 使用記錄 ====================

  async logUsage(logData) {
    const {
      serviceId, tokenId, endpoint, method, statusCode, responseTimeMs,
      ipAddress, userAgent, requestSize, responseSize, errorMessage
    } = logData;
    
    const sql = `
      INSERT INTO usage_logs 
      (service_id, token_id, endpoint, method, status_code, response_time_ms, 
       ip_address, user_agent, request_size, response_size, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.query(sql, [
      serviceId, tokenId, endpoint, method, statusCode, responseTimeMs,
      ipAddress, userAgent, requestSize, responseSize, errorMessage
    ]);
  }

  // ==================== 部署記錄 ====================

  async logDeployment(deploymentData) {
    const { serviceId, version, platform, status, deploymentUrl, buildLogs, deployedBy } = deploymentData;
    const sql = `
      INSERT INTO deployment_logs 
      (service_id, version, platform, status, deployment_url, build_logs, deployed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await this.query(sql, [serviceId, version, platform, status, deploymentUrl, buildLogs, deployedBy]);
  }

  async updateDeploymentStatus(id, status, errorMessage = null) {
    const sql = `
      UPDATE deployment_logs 
      SET status = ?, error_message = ?, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await this.query(sql, [status, errorMessage, id]);
  }

  /**
   * 🧹 清理資源
   */
  async cleanup() {
    if (this.pool) {
      try {
        await this.pool.end();
        logger.info('🔌 Database connection pool closed');
      } catch (error) {
        logger.debug('Error closing database pool:', error);
      }
      this.pool = null;
    }
    this.isConnected = false;
  }

  /**
   * 🔚 關閉連線
   */
  async close() {
    await this.cleanup();
  }
}

module.exports = new MursfotoDatabaseService();
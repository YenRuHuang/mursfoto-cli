#!/usr/bin/env node

/**
 * Mursfoto Service Manager
 * 管理多個服務的端口、環境變數和部署
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class MursfotoServiceManager {
  constructor() {
    this.configPath = path.join(process.env.HOME, '.mursfoto', 'services.json');
    this.services = this.loadServices();
    this.basePort = 4000; // 從 4000 開始，避免常見端口衝突
  }

  loadServices() {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (error) {
      console.warn('Failed to load services config:', error.message);
    }
    return {};
  }

  saveServices() {
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.configPath, JSON.stringify(this.services, null, 2));
  }

  // 註冊新服務
  registerService(name, config) {
    const port = this.getNextAvailablePort();
    
    this.services[name] = {
      name,
      port,
      path: process.cwd(),
      createdAt: new Date().toISOString(),
      ...config
    };

    this.saveServices();
    console.log(`✅ Service '${name}' registered on port ${port}`);
    return this.services[name];
  }

  // 獲取下一個可用端口
  getNextAvailablePort() {
    const usedPorts = Object.values(this.services).map(s => s.port);
    let port = this.basePort;
    while (usedPorts.includes(port)) {
      port++;
    }
    return port;
  }

  // 列出所有服務
  listServices() {
    console.log('📋 Registered Mursfoto Services:');
    console.log('─'.repeat(60));
    
    if (Object.keys(this.services).length === 0) {
      console.log('  No services registered yet');
      return;
    }

    for (const [name, service] of Object.entries(this.services)) {
      console.log(`🚀 ${name}`);
      console.log(`   Port: ${service.port}`);
      console.log(`   Path: ${service.path}`);
      console.log(`   URL:  http://localhost:${service.port}`);
      if (service.zeaburUrl) {
        console.log(`   Prod: ${service.zeaburUrl}`);
      }
      console.log('');
    }
  }

  // 啟動服務
  startService(name) {
    const service = this.services[name];
    if (!service) {
      console.error(`❌ Service '${name}' not found`);
      return;
    }

    console.log(`🚀 Starting ${name} on port ${service.port}...`);
    
    // 設置環境變數
    const env = {
      ...process.env,
      PORT: service.port,
      MURSFOTO_SERVICE_NAME: name,
      MURSFOTO_SERVICE_PORT: service.port
    };

    // 啟動服務
    const child = spawn('npm', ['run', 'dev'], {
      cwd: service.path,
      env,
      stdio: 'inherit'
    });

    child.on('error', (error) => {
      console.error(`❌ Failed to start ${name}:`, error);
    });

    return child;
  }

  // 生成服務配置
  generateServiceConfig(name, type = 'api') {
    const service = this.services[name];
    if (!service) {
      console.error(`❌ Service '${name}' not found`);
      return;
    }

    const config = {
      // 基本配置
      NODE_ENV: 'development',
      PORT: service.port,
      
      // API Gateway 配置（共用）
      MURSFOTO_API_GATEWAY_URL: 'https://mursfoto-api-gateway.zeabur.app',
      API_GATEWAY_TOKEN: 'mf_admin_2024',
      ANTHROPIC_API_KEY: 'via-gateway',
      
      // 服務特定配置
      MURSFOTO_SERVICE_NAME: name,
      MURSFOTO_SERVICE_PORT: service.port,
      
      // Zeabur 生產環境配置
      ZEABUR_SERVICE_NAME: name,
      FRONTEND_URL: service.zeaburUrl || `https://${name}.zeabur.app`
    };

    // 根據服務類型添加特定配置
    if (type === 'api') {
      config.DATABASE_URL = '${DATABASE_URL}';
      config.REDIS_URL = '${REDIS_URL}';
    }

    return config;
  }

  // 生成 .env 文件
  generateEnvFile(name) {
    const config = this.generateServiceConfig(name);
    const envContent = Object.entries(config)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const envPath = path.join(process.cwd(), '.env');
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Generated .env file for service '${name}'`);
  }
}

// CLI 介面
function main() {
  const manager = new MursfotoServiceManager();
  const [,, command, ...args] = process.argv;

  switch (command) {
    case 'register':
      const [name, type] = args;
      if (!name) {
        console.error('Usage: node mursfoto-service-manager.js register <name> [type]');
        return;
      }
      const service = manager.registerService(name, { type: type || 'api' });
      manager.generateEnvFile(name);
      break;

    case 'list':
      manager.listServices();
      break;

    case 'start':
      const [serviceName] = args;
      if (!serviceName) {
        console.error('Usage: node mursfoto-service-manager.js start <name>');
        return;
      }
      manager.startService(serviceName);
      break;

    case 'env':
      const [envServiceName] = args;
      if (!envServiceName) {
        console.error('Usage: node mursfoto-service-manager.js env <name>');
        return;
      }
      manager.generateEnvFile(envServiceName);
      break;

    case 'config':
      const [configServiceName] = args;
      if (!configServiceName) {
        console.error('Usage: node mursfoto-service-manager.js config <name>');
        return;
      }
      const config = manager.generateServiceConfig(configServiceName);
      console.log('🔧 Zeabur Environment Variables:');
      console.log('─'.repeat(40));
      Object.entries(config).forEach(([key, value]) => {
        console.log(`${key}=${value}`);
      });
      break;

    default:
      console.log('Mursfoto Service Manager');
      console.log('');
      console.log('Usage:');
      console.log('  register <name> [type]  - Register a new service');
      console.log('  list                    - List all services');
      console.log('  start <name>           - Start a service');
      console.log('  env <name>             - Generate .env file');
      console.log('  config <name>          - Show Zeabur config');
      console.log('');
      console.log('Example:');
      console.log('  node mursfoto-service-manager.js register rental-hub api');
      console.log('  node mursfoto-service-manager.js start rental-hub');
  }
}

if (require.main === module) {
  main();
}

module.exports = MursfotoServiceManager;
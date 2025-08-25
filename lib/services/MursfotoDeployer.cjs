#!/usr/bin/env node

/**
 * Mursfoto One-Click Deployment
 * 自動化 GitHub + Zeabur 部署流程
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class MursfotoDeployer {
  constructor() {
    this.packageJson = this.loadPackageJson();
    this.serviceName = this.packageJson?.mursfoto?.service || path.basename(process.cwd());
    this.serviceType = this.packageJson?.mursfoto?.type || 'api';
    this.servicePort = this.packageJson?.mursfoto?.port || 4000;
  }

  loadPackageJson() {
    try {
      return JSON.parse(fs.readFileSync('package.json', 'utf8'));
    } catch (error) {
      console.error('❌ No package.json found. Are you in a Mursfoto project?');
      process.exit(1);
    }
  }

  async deploy() {
    console.log(`🚀 Deploying Mursfoto service: ${this.serviceName}`);
    console.log('─'.repeat(50));

    try {
      // 1. 檢查 Git 狀態
      this.checkGitStatus();
      
      // 2. GitHub 部署
      await this.deployToGitHub();
      
      // 3. 顯示 Zeabur 配置
      this.showZeaburConfig();
      
      console.log('');
      console.log('✅ Deployment completed successfully!');
      console.log('');
      console.log('📱 Next steps:');
      console.log('   1. Go to https://zeabur.com/');
      console.log(`   2. Create new project: ${this.serviceName}`);
      console.log(`   3. Connect GitHub repo: YenRuHuang/${this.serviceName}`);
      console.log('   4. Add environment variables (shown above)');
      console.log('   5. Deploy!');
      
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }

  checkGitStatus() {
    console.log('📋 Checking Git status...');
    
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        console.log('📝 Committing changes...');
        execSync('git add .');
        execSync(`git commit -m "feat: prepare ${this.serviceName} for deployment"`);
      }
    } catch (error) {
      // 可能是新的 repo，繼續
    }
    
    console.log('✅ Git status OK');
  }

  async deployToGitHub() {
    console.log('📡 Deploying to GitHub...');
    
    const githubUser = 'YenRuHuang';
    const repoName = this.serviceName;
    
    try {
      // 檢查是否已有 remote
      try {
        execSync('git remote get-url origin', { stdio: 'pipe' });
        console.log('📡 Remote origin already exists');
      } catch {
        // 添加 remote
        const repoUrl = `https://github.com/${githubUser}/${repoName}.git`;
        execSync(`git remote add origin ${repoUrl}`);
        console.log(`📡 Added remote: ${repoUrl}`);
      }
      
      // Push to GitHub
      execSync('git push -u origin main', { stdio: 'inherit' });
      console.log('✅ Pushed to GitHub successfully');
      
    } catch (error) {
      console.log('⚠️  GitHub push failed. You may need to:');
      console.log('   1. Create repo: https://github.com/new');
      console.log(`   2. Set repo name: ${repoName}`);
      console.log('   3. Run: git push -u origin main');
    }
  }

  showZeaburConfig() {
    console.log('');
    console.log('🔧 Zeabur Environment Variables:');
    console.log('─'.repeat(40));
    
    const config = {
      NODE_ENV: 'production',
      PORT: 8080,
      MURSFOTO_API_GATEWAY_URL: 'https://mursfoto-api-gateway.zeabur.app',
      API_GATEWAY_TOKEN: 'mf_admin_2024',
      ANTHROPIC_API_KEY: 'via-gateway',
      MURSFOTO_SERVICE_NAME: this.serviceName,
      FRONTEND_URL: `https://${this.serviceName}.zeabur.app`
    };

    // 根據服務類型添加配置
    if (this.serviceType === 'api') {
      config.DATABASE_URL = '${DATABASE_URL}';
      config.REDIS_URL = '${REDIS_URL}';
    }

    Object.entries(config).forEach(([key, value]) => {
      console.log(`${key}=${value}`);
    });
    
    console.log('');
    console.log('💡 Tips:');
    console.log('   - Copy these variables to Zeabur Environment tab');
    console.log('   - Replace ${DATABASE_URL} and ${REDIS_URL} with actual values from Zeabur services');
  }

  // 快速設置現有專案
  setupExistingProject() {
    console.log('🔧 Setting up existing project as Mursfoto service...');
    
    // 註冊到服務管理器
    try {
      const ServiceManager = require('./mursfoto-service-manager.cjs');
      const manager = new ServiceManager();
      const service = manager.registerService(this.serviceName, { 
        type: this.serviceType,
        existingProject: true 
      });
      
      // 更新 package.json
      this.packageJson.mursfoto = {
        service: this.serviceName,
        type: this.serviceType,
        port: service.port,
        setupAt: new Date().toISOString()
      };
      
      fs.writeFileSync('package.json', JSON.stringify(this.packageJson, null, 2));
      
      // 生成 .env
      manager.generateEnvFile(this.serviceName);
      
      console.log('✅ Project setup completed!');
      console.log(`📱 Service: ${this.serviceName}`);
      console.log(`🔗 Port: ${service.port}`);
      console.log(`🌐 Local: http://localhost:${service.port}`);
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      console.log('💡 Make sure mursfoto-service-manager.js exists in current directory');
    }
  }
}

// CLI 介面
function main() {
  const [,, command] = process.argv;
  const deployer = new MursfotoDeployer();

  switch (command) {
    case 'deploy':
      deployer.deploy();
      break;
      
    case 'setup':
      deployer.setupExistingProject();
      break;
      
    default:
      console.log('Mursfoto One-Click Deployment');
      console.log('');
      console.log('Usage:');
      console.log('  deploy  - Deploy to GitHub + show Zeabur config');
      console.log('  setup   - Setup existing project as Mursfoto service');
      console.log('');
      console.log('Example:');
      console.log('  node mursfoto-deploy-fixed.js deploy');
  }
}

if (require.main === module) {
  main();
}

module.exports = MursfotoDeployer;
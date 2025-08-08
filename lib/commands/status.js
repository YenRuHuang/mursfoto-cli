const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const axios = require('axios');
const { checkGatewayStatus, listRegisteredServices } = require('../utils/gateway');
const { getSystemInfo } = require('../utils/helpers');

/**
 * 檢查項目和 Gateway 狀態
 */
async function checkStatus(options = {}) {
  console.log(chalk.cyan('\n📊 Mursfoto 服務狀態檢查\n'));

  const results = {
    project: null,
    gateway: null,
    services: [],
    system: null
  };

  // 檢查當前項目
  await checkCurrentProject(results, options);

  // 檢查 Gateway 狀態
  await checkGatewayStatusInfo(results, options);

  // 檢查已註冊服務
  await checkRegisteredServices(results, options);

  // 系統資訊（詳細模式）
  if (options.verbose) {
    results.system = getSystemInfo();
  }

  // 顯示結果
  displayStatus(results, options);
}

/**
 * 檢查當前項目狀態
 */
async function checkCurrentProject(results, options) {
  const spinner = ora('🔍 檢查當前項目...').start();

  try {
    const currentDir = process.cwd();
    const packageJsonPath = path.join(currentDir, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      spinner.warn('⚠️ 當前目錄不是 Node.js 項目');
      results.project = {
        exists: false,
        path: currentDir,
        message: '當前目錄下沒有 package.json 文件'
      };
      return;
    }

    const packageJson = await fs.readJson(packageJsonPath);
    
    // 檢查是否為 Mursfoto 項目
    const isMursfotoProject = packageJson.keywords && 
      (packageJson.keywords.includes('mursfoto') || 
       packageJson.keywords.includes('api-gateway'));

    // 檢查服務器文件
    const serverExists = fs.existsSync(path.join(currentDir, 'server.js'));
    
    // 檢查健康檢查端點
    let healthStatus = null;
    if (serverExists) {
      healthStatus = await checkProjectHealth(currentDir, packageJson);
    }

    // 檢查 Zeabur 配置
    const zeaburConfigExists = fs.existsSync(path.join(currentDir, 'zeabur.json'));

    spinner.succeed('🔍 項目檢查完成');

    results.project = {
      exists: true,
      path: currentDir,
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      isMursfotoProject,
      serverExists,
      zeaburConfigExists,
      health: healthStatus,
      scripts: packageJson.scripts || {},
      dependencies: Object.keys(packageJson.dependencies || {}).length,
      devDependencies: Object.keys(packageJson.devDependencies || {}).length
    };

  } catch (error) {
    spinner.fail(`項目檢查失敗: ${error.message}`);
    results.project = {
      exists: false,
      error: error.message
    };
  }
}

/**
 * 檢查項目健康狀態
 */
async function checkProjectHealth(projectPath, packageJson) {
  try {
    // 嘗試從 package.json 獲取端口
    let port = 3001; // 默認端口
    
    // 檢查環境文件
    const envPath = path.join(projectPath, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = await fs.readFile(envPath, 'utf8');
      const portMatch = envContent.match(/PORT\s*=\s*(\d+)/);
      if (portMatch) {
        port = parseInt(portMatch[1]);
      }
    }

    // 嘗試連接健康檢查端點
    const response = await axios.get(`http://localhost:${port}/health`, {
      timeout: 3000
    });

    return {
      online: true,
      port,
      status: response.status,
      data: response.data
    };

  } catch (error) {
    return {
      online: false,
      error: error.message,
      port: null
    };
  }
}

/**
 * 檢查 Gateway 狀態
 */
async function checkGatewayStatusInfo(results, options) {
  const spinner = ora('🌐 檢查 Gateway 狀態...').start();

  try {
    const gatewayStatus = await checkGatewayStatus();
    spinner.succeed('🌐 Gateway 檢查完成');

    results.gateway = gatewayStatus;

  } catch (error) {
    spinner.fail(`Gateway 檢查失敗: ${error.message}`);
    results.gateway = {
      online: false,
      error: error.message
    };
  }
}

/**
 * 檢查已註冊服務
 */
async function checkRegisteredServices(results, options) {
  const spinner = ora('📋 檢查已註冊服務...').start();

  try {
    const services = await listRegisteredServices();
    
    // 如果啟用詳細模式，檢查每個服務的健康狀態
    if (options.verbose && services.length > 0) {
      spinner.text = '🔍 檢查服務健康狀態...';
      
      for (const service of services) {
        try {
          const response = await axios.get(`${service.url}/health`, {
            timeout: 5000
          });
          service.health = {
            online: true,
            status: response.status,
            responseTime: response.headers['x-response-time'] || 'unknown'
          };
        } catch (error) {
          service.health = {
            online: false,
            error: error.message
          };
        }
      }
    }

    spinner.succeed(`📋 服務檢查完成 (${services.length} 個服務)`);
    results.services = services;

  } catch (error) {
    spinner.fail(`服務檢查失敗: ${error.message}`);
    results.services = [];
  }
}

/**
 * 顯示狀態結果
 */
function displayStatus(results, options) {
  console.log('');

  // 當前項目狀態
  displayProjectStatus(results.project);

  // Gateway 狀態
  displayGatewayStatus(results.gateway);

  // 服務狀態
  displayServicesStatus(results.services, options);

  // 系統資訊（詳細模式）
  if (options.verbose && results.system) {
    displaySystemInfo(results.system);
  }

  // 整體狀態摘要
  displaySummary(results);
}

/**
 * 顯示項目狀態
 */
function displayProjectStatus(project) {
  console.log(chalk.white.bold('📁 當前項目'));

  if (!project || !project.exists) {
    console.log(chalk.red('  ❌ 未找到 Node.js 項目'));
    if (project && project.message) {
      console.log(chalk.gray(`     ${project.message}`));
    }
    console.log('');
    return;
  }

  console.log(chalk.green(`  ✅ ${project.name} v${project.version}`));
  console.log(chalk.gray(`     路徑: ${project.path}`));
  
  if (project.description) {
    console.log(chalk.gray(`     描述: ${project.description}`));
  }

  // Mursfoto 項目標識
  if (project.isMursfotoProject) {
    console.log(chalk.cyan('     🌟 Mursfoto 生態系統項目'));
  }

  // 服務器狀態
  if (project.serverExists) {
    if (project.health && project.health.online) {
      console.log(chalk.green(`     🚀 服務器運行中 (端口 ${project.health.port})`));
      if (project.health.data && project.health.data.service) {
        console.log(chalk.gray(`     服務名稱: ${project.health.data.service}`));
      }
    } else {
      console.log(chalk.yellow('     ⚠️ 服務器離線'));
    }
  } else {
    console.log(chalk.gray('     📄 非服務器項目'));
  }

  // 部署配置
  if (project.zeaburConfigExists) {
    console.log(chalk.cyan('     ☁️ 已配置 Zeabur 部署'));
  }

  // 依賴統計
  console.log(chalk.gray(`     📦 依賴: ${project.dependencies} 個, 開發依賴: ${project.devDependencies} 個`));

  console.log('');
}

/**
 * 顯示 Gateway 狀態
 */
function displayGatewayStatus(gateway) {
  console.log(chalk.white.bold('🌐 API Gateway'));

  if (!gateway || !gateway.online) {
    console.log(chalk.red('  ❌ Gateway 服務離線'));
    if (gateway && gateway.error) {
      console.log(chalk.gray(`     錯誤: ${gateway.error}`));
    }
    console.log('');
    return;
  }

  console.log(chalk.green('  ✅ Gateway 服務正常運行'));
  console.log(chalk.gray(`     URL: ${gateway.url}`));
  console.log(chalk.gray(`     狀態碼: ${gateway.status}`));

  if (gateway.data) {
    if (gateway.data.service) {
      console.log(chalk.gray(`     服務: ${gateway.data.service}`));
    }
    if (gateway.data.version) {
      console.log(chalk.gray(`     版本: ${gateway.data.version}`));
    }
  }

  console.log('');
}

/**
 * 顯示服務狀態
 */
function displayServicesStatus(services, options) {
  console.log(chalk.white.bold(`📋 已註冊服務 (${services.length})`));

  if (services.length === 0) {
    console.log(chalk.yellow('  ⚠️ 沒有已註冊的服務'));
    console.log(chalk.gray('     使用 `mursfoto create` 創建新服務'));
    console.log('');
    return;
  }

  // 按狀態分組
  const onlineServices = services.filter(s => s.health && s.health.online);
  const offlineServices = services.filter(s => s.health && !s.health.online);
  const unknownServices = services.filter(s => !s.health);

  services.forEach(service => {
    let statusIcon = '•';
    let statusText = '未知';
    let statusColor = 'gray';

    if (service.health) {
      if (service.health.online) {
        statusIcon = '✅';
        statusText = '在線';
        statusColor = 'green';
      } else {
        statusIcon = '❌';
        statusText = '離線';
        statusColor = 'red';
      }
    } else if (!options.verbose) {
      statusIcon = 'ℹ️';
      statusText = '未檢查';
      statusColor = 'cyan';
    }

    console.log(`  ${statusIcon} ${chalk.cyan(service.name)} - ${chalk[statusColor](statusText)}`);
    console.log(chalk.gray(`     類型: ${service.type} | 模板: ${service.template} | 版本: ${service.version}`));
    console.log(chalk.gray(`     URL: ${service.url}`));

    if (options.verbose && service.health) {
      if (service.health.online) {
        console.log(chalk.gray(`     回應時間: ${service.health.responseTime}`));
      } else {
        console.log(chalk.gray(`     錯誤: ${service.health.error}`));
      }
    }

    console.log('');
  });
}

/**
 * 顯示系統資訊
 */
function displaySystemInfo(system) {
  console.log(chalk.white.bold('🖥️ 系統資訊'));
  console.log(chalk.gray(`  平台: ${system.platform} ${system.arch}`));
  console.log(chalk.gray(`  Node.js: ${system.nodeVersion}`));
  console.log(chalk.gray(`  npm: ${system.npmVersion}`));
  console.log(chalk.gray(`  記憶體: ${system.memory}`));
  console.log(chalk.gray(`  CPU 核心: ${system.cpus}`));
  console.log('');
}

/**
 * 顯示狀態摘要
 */
function displaySummary(results) {
  const issues = [];
  
  // 檢查問題
  if (!results.project || !results.project.exists) {
    issues.push('當前目錄不是有效的項目');
  }
  
  if (!results.gateway || !results.gateway.online) {
    issues.push('Gateway 服務無法連接');
  }
  
  if (results.project && results.project.exists && results.project.serverExists && 
      results.project.health && !results.project.health.online) {
    issues.push('本地服務器未運行');
  }

  const onlineServices = results.services.filter(s => s.health && s.health.online).length;
  const totalServices = results.services.length;

  // 顯示摘要
  if (issues.length === 0) {
    console.log(chalk.green('🎉 所有服務運行正常！'));
  } else {
    console.log(chalk.yellow(`⚠️ 發現 ${issues.length} 個問題:`));
    issues.forEach((issue, index) => {
      console.log(chalk.yellow(`  ${index + 1}. ${issue}`));
    });
  }

  if (totalServices > 0) {
    const serviceStatus = onlineServices === totalServices ? 
      chalk.green(`${onlineServices}/${totalServices} 服務在線`) :
      chalk.yellow(`${onlineServices}/${totalServices} 服務在線`);
    console.log(`📊 ${serviceStatus}`);
  }

  console.log('');
  console.log(chalk.gray('💡 使用 `mursfoto doctor` 進行完整環境檢查'));
  console.log(chalk.gray('🔧 使用 `mursfoto gateway list` 查看所有已註冊服務'));
  console.log('');
}

module.exports = {
  checkStatus
};

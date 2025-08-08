const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { 
  registerServiceToGateway,
  unregisterServiceFromGateway,
  listRegisteredServices,
  checkGatewayStatus,
  checkLocalGatewayStatus
} = require('../utils/gateway');
const { getTemplateConfig } = require('../utils/templates');

/**
 * 註冊服務到 Gateway
 */
async function registerService(serviceName, options = {}) {
  try {
    // 如果沒有提供服務名稱，詢問用戶
    if (!serviceName) {
      const { name } = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: '請輸入服務名稱:',
          validate: (input) => {
            if (!input.trim()) return '服務名稱不能為空';
            return true;
          }
        }
      ]);
      serviceName = name.trim();
    }

    // 獲取或詢問服務配置
    let serviceUrl = options.url;
    let rateLimit = parseInt(options.rateLimit) || 200;
    
    if (!serviceUrl) {
      const { url } = await inquirer.prompt([
        {
          type: 'input',
          name: 'url',
          message: '請輸入服務 URL (留空使用默認):',
          default: `https://${serviceName.toLowerCase().replace(/[_\s]+/g, '-')}.zeabur.app`
        }
      ]);
      serviceUrl = url;
    }

    console.log(chalk.cyan(`\n🌐 註冊服務: ${chalk.white.bold(serviceName)}`));
    console.log(chalk.gray(`URL: ${serviceUrl}`));
    console.log(chalk.gray(`Rate Limit: ${rateLimit} requests/minute\n`));

    // 使用默認模板配置
    const templateConfig = {
      name: '手動註冊服務',
      version: '1.0.0',
      port: 3001
    };

    const serviceConfig = await registerServiceToGateway(serviceName, templateConfig, {
      url: serviceUrl,
      rateLimit: rateLimit
    });

    console.log(chalk.green('\n✅ 服務註冊成功！\n'));
    console.log(chalk.white.bold('🔗 服務端點:'));
    console.log(chalk.gray(`  ${serviceConfig.baseURL}`));
    console.log(chalk.gray(`  https://gateway.mursfoto.com/api/${serviceConfig.name}\n`));

  } catch (error) {
    console.error(chalk.red(`❌ 註冊失敗: ${error.message}`));
    process.exit(1);
  }
}

/**
 * 取消註冊服務
 */
async function unregisterService(serviceName) {
  try {
    // 如果沒有提供服務名稱，顯示服務列表讓用戶選擇
    if (!serviceName) {
      const services = await listRegisteredServices();
      
      if (services.length === 0) {
        console.log(chalk.yellow('⚠️ 沒有已註冊的服務'));
        return;
      }

      const { selectedService } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedService',
          message: '請選擇要取消註冊的服務:',
          choices: services.map(service => ({
            name: `${service.name} (${service.type})`,
            value: service.name
          }))
        }
      ]);
      
      serviceName = selectedService;
    }

    // 確認操作
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: `確定要取消註冊服務 "${serviceName}"？`,
        default: false
      }
    ]);

    if (!confirmed) {
      console.log(chalk.yellow('👋 操作已取消'));
      return;
    }

    console.log(chalk.cyan(`\n🗑️ 取消註冊服務: ${chalk.white.bold(serviceName)}\n`));

    await unregisterServiceFromGateway(serviceName);

    console.log(chalk.green('✅ 服務取消註冊成功！\n'));

  } catch (error) {
    console.error(chalk.red(`❌ 取消註冊失敗: ${error.message}`));
    process.exit(1);
  }
}

/**
 * 列出已註冊的服務
 */
async function listServices() {
  const spinner = ora('🔍 獲取已註冊服務列表...').start();
  
  try {
    const services = await listRegisteredServices();
    spinner.succeed('🔍 服務列表獲取完成');

    if (services.length === 0) {
      console.log(chalk.yellow('\n⚠️ 沒有已註冊的服務\n'));
      console.log(chalk.gray('💡 使用 `mursfoto gateway register` 註冊新服務\n'));
      return;
    }

    console.log(chalk.cyan(`\n🌐 已註冊服務 (${services.length})\n`));

    // 按類型分組顯示
    const groupedServices = services.reduce((groups, service) => {
      if (!groups[service.type]) {
        groups[service.type] = [];
      }
      groups[service.type].push(service);
      return groups;
    }, {});

    for (const [type, serviceList] of Object.entries(groupedServices)) {
      const typeIcon = type === 'internal' ? '🏠' : '🌐';
      console.log(chalk.white.bold(`${typeIcon} ${type.toUpperCase()} 服務:`));
      
      serviceList.forEach(service => {
        console.log(`  • ${chalk.cyan(service.name)}`);
        console.log(`    ${chalk.gray(`模板: ${service.template} | 版本: ${service.version}`)}`);
        console.log(`    ${chalk.gray(`URL: ${service.url}`)}`);
      });
      console.log('');
    }

    console.log(chalk.gray('💡 使用 `mursfoto status` 查看服務運行狀態\n'));

  } catch (error) {
    spinner.fail(`獲取服務列表失敗: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 檢查 Gateway 狀態
 */
async function checkStatus(options = {}) {
  console.log(chalk.cyan('\n🌐 Gateway 狀態檢查\n'));

  // 檢查線上 Gateway
  const onlineSpinner = ora('🔍 檢查線上 Gateway 服務...').start();
  try {
    const gatewayStatus = await checkGatewayStatus();
    
    if (gatewayStatus.online) {
      onlineSpinner.succeed('🌐 線上 Gateway 服務正常運行');
      console.log(chalk.gray(`  URL: ${gatewayStatus.url}`));
      console.log(chalk.gray(`  狀態: ${gatewayStatus.status}`));
      
      if (options.verbose && gatewayStatus.data) {
        console.log(chalk.gray(`  回應: ${JSON.stringify(gatewayStatus.data, null, 2)}`));
      }
    } else {
      onlineSpinner.fail('❌ 線上 Gateway 服務無法連接');
      console.log(chalk.red(`  錯誤: ${gatewayStatus.error}`));
    }
  } catch (error) {
    onlineSpinner.fail(`線上 Gateway 檢查失敗: ${error.message}`);
  }

  // 檢查本地 Gateway 項目
  const localSpinner = ora('🔍 檢查本地 Gateway 項目...').start();
  try {
    const localStatus = await checkLocalGatewayStatus();
    
    if (localStatus.exists) {
      localSpinner.succeed('📁 本地 Gateway 項目已找到');
      console.log(chalk.gray(`  路徑: ${localStatus.path}`));
      
      if (localStatus.package) {
        console.log(chalk.gray(`  名稱: ${localStatus.package.name}`));
        console.log(chalk.gray(`  版本: ${localStatus.package.version}`));
      }
      
      if (localStatus.git) {
        const gitStatus = localStatus.git.modified > 0 ? 
          chalk.yellow(`${localStatus.git.branch} (${localStatus.git.modified} 個未提交變更)`) :
          chalk.green(`${localStatus.git.branch} (乾淨)`);
        console.log(chalk.gray(`  Git: ${gitStatus}`));
        
        if (localStatus.git.lastCommit && options.verbose) {
          console.log(chalk.gray(`  最後提交: ${localStatus.git.lastCommit.message}`));
          console.log(chalk.gray(`  提交時間: ${localStatus.git.lastCommit.date}`));
        }
      }
    } else {
      localSpinner.fail('❌ 本地 Gateway 項目未找到');
      console.log(chalk.red(`  預期路徑: ${localStatus.path}`));
      console.log(chalk.yellow('\n💡 請確保 mursfoto-api-gateway 項目位於正確位置\n'));
    }
  } catch (error) {
    localSpinner.fail(`本地 Gateway 檢查失敗: ${error.message}`);
  }

  // 檢查已註冊服務狀態
  if (options.verbose) {
    console.log('');
    await listServices();
  }
}

module.exports = {
  registerService,
  unregisterService,
  listServices,
  checkStatus
};

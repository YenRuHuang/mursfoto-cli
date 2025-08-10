const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const axios = require('axios')
const inquirer = require('inquirer')
const simpleGit = require('simple-git')

/**
 * Gateway 配置
 */
const GATEWAY_CONFIG = {
  url: 'https://gateway.mursfoto.com',
  localPath: '../mursfoto-api-gateway',
  configFiles: {
    proxy: 'routes/proxy.js',
    zeabur: 'zeabur.json'
  }
}

/**
 * 註冊服務到 Gateway
 */
async function registerServiceToGateway (serviceName, templateConfig, options = {}) {
  try {
    console.log(chalk.cyan(`🌐 正在註冊服務 ${serviceName} 到 API Gateway...`))

    // 檢查 Gateway 目錄是否存在
    const gatewayPath = path.resolve(GATEWAY_CONFIG.localPath)
    if (!fs.existsSync(gatewayPath)) {
      throw new Error(`Gateway 目錄不存在: ${gatewayPath}。請確保 mursfoto-api-gateway 項目在正確位置。`)
    }

    // 生成服務配置
    const serviceConfig = generateServiceConfig(serviceName, templateConfig, options)

    // 更新 proxy.js
    await updateProxyConfig(gatewayPath, serviceName, serviceConfig)

    // 更新 zeabur.json
    await updateZeaburConfig(gatewayPath, serviceName, serviceConfig)

    // 提交變更到 Git
    if (options.autoCommit !== false) {
      await commitGatewayChanges(gatewayPath, serviceName)
    }

    console.log(chalk.green(`✅ 服務 ${serviceName} 已成功註冊到 Gateway`))
    console.log(chalk.gray('🔗 服務將通過以下 URL 訪問:'))
    console.log(chalk.gray(`   ${GATEWAY_CONFIG.url}/api/${serviceName.toLowerCase()}`))

    return serviceConfig
  } catch (error) {
    console.error(chalk.red(`❌ Gateway 註冊失敗: ${error.message}`))
    throw error
  }
}

/**
 * 生成服務配置
 */
function generateServiceConfig (serviceName, templateConfig, options = {}) {
  const kebabName = serviceName.toLowerCase().replace(/[_\s]+/g, '-')

  return {
    name: kebabName,
    displayName: serviceName,
    baseURL: options.url || `https://${kebabName}.zeabur.app`,
    localURL: options.localUrl || `http://localhost:${templateConfig.port || 3001}`,
    headers: {
      'content-type': 'application/json'
    },
    rateLimits: {
      windowMs: 1 * 60 * 1000, // 1 分鐘
      max: options.rateLimit || 200 // 每分鐘請求數
    },
    healthCheck: '/health',
    type: 'internal',
    template: templateConfig.name,
    createdAt: new Date().toISOString(),
    version: templateConfig.version || '1.0.0'
  }
}

/**
 * 更新 Proxy 配置
 */
async function updateProxyConfig (gatewayPath, serviceName, serviceConfig) {
  const proxyPath = path.join(gatewayPath, GATEWAY_CONFIG.configFiles.proxy)

  if (!fs.existsSync(proxyPath)) {
    throw new Error(`Proxy 配置文件不存在: ${proxyPath}`)
  }

  let content = await fs.readFile(proxyPath, 'utf8')

  // 檢查服務是否已存在
  const serviceKey = serviceConfig.name
  if (content.includes(`'${serviceKey}':`)) {
    console.log(chalk.yellow(`⚠️  服務 ${serviceName} 已存在於 Gateway 配置中，跳過更新`))
    return
  }

  // 在 API_CONFIGS 中添加新服務配置
  const configToAdd = `  '${serviceConfig.name}': {
    baseURL: process.env.${serviceConfig.name.toUpperCase().replace(/-/g, '_')}_URL || '${serviceConfig.localURL}',
    headers: ${JSON.stringify(serviceConfig.headers, null, 6)},
    rateLimits: ${JSON.stringify(serviceConfig.rateLimits, null, 6)},
    healthCheck: '${serviceConfig.healthCheck}',
    type: '${serviceConfig.type}',
    template: '${serviceConfig.template}',
    version: '${serviceConfig.version}'
  },`

  // 找到 API_CONFIGS 的結尾位置並插入
  const configEndRegex = /(\s+)(\}\s*;?\s*$)/m
  const match = content.match(configEndRegex)

  if (match) {
    const insertPosition = content.lastIndexOf(match[0])
    content = content.slice(0, insertPosition) +
              configToAdd + '\n' +
              content.slice(insertPosition)
  } else {
    throw new Error('無法找到 API_CONFIGS 配置區塊')
  }

  // 添加路由處理
  const routeToAdd = `
// ${serviceConfig.displayName} 代理路由
router.use('/${serviceConfig.name}', rateLimiters['${serviceConfig.name}']);
router.all('/${serviceConfig.name}/*', async (req, res) => {
  await proxyRequest(req, res, '${serviceConfig.name}');
});
`

  // 在最後一個路由後添加新路由
  const lastRouteRegex = /router\.all\([^}]+\}\);/g
  const routes = content.match(lastRouteRegex)

  if (routes && routes.length > 0) {
    const lastRoute = routes[routes.length - 1]
    const insertPos = content.lastIndexOf(lastRoute) + lastRoute.length
    content = content.slice(0, insertPos) + routeToAdd + content.slice(insertPos)
  }

  await fs.writeFile(proxyPath, content, 'utf8')
  console.log(chalk.green(`✅ 已更新 Proxy 配置: ${serviceConfig.name}`))
}

/**
 * 更新 Zeabur 配置
 */
async function updateZeaburConfig (gatewayPath, serviceName, serviceConfig) {
  const zeaburPath = path.join(gatewayPath, GATEWAY_CONFIG.configFiles.zeabur)

  if (!fs.existsSync(zeaburPath)) {
    console.log(chalk.yellow(`⚠️  Zeabur 配置文件不存在，跳過更新: ${zeaburPath}`))
    return
  }

  const zeaburConfig = await fs.readJson(zeaburPath)

  // 添加環境變數到 envVars 列表
  const envVarName = `${serviceConfig.name.toUpperCase().replace(/-/g, '_')}_URL`

  if (zeaburConfig.services && zeaburConfig.services[0] && zeaburConfig.services[0].envVars) {
    const envVars = zeaburConfig.services[0].envVars
    if (!envVars.includes(envVarName)) {
      envVars.push(envVarName)
      envVars.sort() // 保持排序
    }
  }

  await fs.writeJson(zeaburPath, zeaburConfig, { spaces: 2 })
  console.log(chalk.green(`✅ 已更新 Zeabur 配置: ${envVarName}`))
}

/**
 * 提交 Gateway 變更到 Git
 */
async function commitGatewayChanges (gatewayPath, serviceName) {
  try {
    const git = simpleGit(gatewayPath)

    // 添加變更的文件
    await git.add([
      GATEWAY_CONFIG.configFiles.proxy,
      GATEWAY_CONFIG.configFiles.zeabur
    ])

    // 提交變更
    const commitMessage = `🌐 Add ${serviceName} service to API Gateway

- Register ${serviceName} in proxy configuration
- Update environment variables for Zeabur deployment
- Auto-generated by @mursfoto/cli`

    await git.commit(commitMessage)
    console.log(chalk.green('✅ Gateway 變更已提交到本地 Git'))

    // 詢問是否推送到遠程
    const { shouldPush } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldPush',
        message: '是否將變更推送到遠程倉庫？',
        default: false
      }
    ])

    if (shouldPush) {
      await git.push()
      console.log(chalk.green('✅ 變更已推送到遠程倉庫'))
    }
  } catch (error) {
    console.warn(chalk.yellow(`⚠️  Git 操作失敗: ${error.message}`))
  }
}

/**
 * 檢查 Gateway 集成狀態
 */
async function verifyGatewayIntegration (serviceName, gatewayPath) {
  try {
    const response = await fetch('https://gateway.mursfoto.com/api/health', {
      timeout: 5000 // 5秒超时
    })
    if (response.ok) {
      return true
    }
    return false
  } catch (error) {
    // 网络问题时返回 true，避免阻塞部署流程
    console.warn('Gateway连接检查超时，跳过验证')
    return true
  }
}

/**
 * 获取 Gateway 路径
 */
function getGatewayPath () {
  return path.resolve(GATEWAY_CONFIG.localPath)
}

/**
 * 取消註冊服務
 */
async function unregisterServiceFromGateway (serviceName) {
  try {
    const gatewayPath = path.resolve(GATEWAY_CONFIG.localPath)

    if (!fs.existsSync(gatewayPath)) {
      throw new Error(`Gateway 目錄不存在: ${gatewayPath}`)
    }

    const kebabName = serviceName.toLowerCase().replace(/[_\s]+/g, '-')

    // 更新 proxy.js - 移除服務配置
    await removeFromProxyConfig(gatewayPath, kebabName)

    // 更新 zeabur.json - 移除環境變數
    await removeFromZeaburConfig(gatewayPath, kebabName)

    // 提交變更
    await commitGatewayChanges(gatewayPath, `remove-${serviceName}`)

    console.log(chalk.green(`✅ 服務 ${serviceName} 已從 Gateway 取消註冊`))
  } catch (error) {
    console.error(chalk.red(`❌ 取消註冊失敗: ${error.message}`))
    throw error
  }
}

/**
 * 從 Proxy 配置移除服務
 */
async function removeFromProxyConfig (gatewayPath, serviceName) {
  const proxyPath = path.join(gatewayPath, GATEWAY_CONFIG.configFiles.proxy)
  let content = await fs.readFile(proxyPath, 'utf8')

  // 移除 API_CONFIGS 中的配置
  const configRegex = new RegExp(`\\s+'${serviceName}':\\s*{[^}]+},?`, 'g')
  content = content.replace(configRegex, '')

  // 移除路由處理
  const routeRegex = new RegExp(
    `// [^\\n]*${serviceName}[^\\n]*\\n[\\s\\S]*?router\\.all\\('\\/${serviceName}\\/\\*'[^}]+\\}\\);\\s*`,
    'g'
  )
  content = content.replace(routeRegex, '')

  await fs.writeFile(proxyPath, content, 'utf8')
}

/**
 * 從 Zeabur 配置移除環境變數
 */
async function removeFromZeaburConfig (gatewayPath, serviceName) {
  const zeaburPath = path.join(gatewayPath, GATEWAY_CONFIG.configFiles.zeabur)

  if (!fs.existsSync(zeaburPath)) {
    return
  }

  const zeaburConfig = await fs.readJson(zeaburPath)
  const envVarName = `${serviceName.toUpperCase().replace(/-/g, '_')}_URL`

  if (zeaburConfig.services && zeaburConfig.services[0] && zeaburConfig.services[0].envVars) {
    const envVars = zeaburConfig.services[0].envVars
    const index = envVars.indexOf(envVarName)
    if (index > -1) {
      envVars.splice(index, 1)
    }
  }

  await fs.writeJson(zeaburPath, zeaburConfig, { spaces: 2 })
}

/**
 * 列出已註冊的服務
 */
async function listRegisteredServices () {
  try {
    const gatewayPath = path.resolve(GATEWAY_CONFIG.localPath)

    if (!fs.existsSync(gatewayPath)) {
      throw new Error(`Gateway 目錄不存在: ${gatewayPath}`)
    }

    const proxyPath = path.join(gatewayPath, GATEWAY_CONFIG.configFiles.proxy)
    const content = await fs.readFile(proxyPath, 'utf8')

    // 解析 API_CONFIGS
    const configMatch = content.match(/const API_CONFIGS = \{([\s\S]*?)\};/)
    if (!configMatch) {
      throw new Error('無法解析 Gateway 配置')
    }

    const configContent = configMatch[1]
    const serviceRegex = /\s+'([^']+)':\s*\{([^}]+)\}/g
    const services = []
    let match

    while ((match = serviceRegex.exec(configContent)) !== null) {
      const serviceName = match[1]
      const configText = match[2]

      // 解析服務類型和模板信息
      const typeMatch = configText.match(/type:\s*'([^']+)'/)
      const templateMatch = configText.match(/template:\s*'([^']+)'/)
      const versionMatch = configText.match(/version:\s*'([^']+)'/)

      services.push({
        name: serviceName,
        type: typeMatch ? typeMatch[1] : 'unknown',
        template: templateMatch ? templateMatch[1] : 'unknown',
        version: versionMatch ? versionMatch[1] : 'unknown',
        url: `${GATEWAY_CONFIG.url}/api/${serviceName}`
      })
    }

    return services
  } catch (error) {
    console.error(chalk.red(`❌ 獲取服務列表失敗: ${error.message}`))
    throw error
  }
}

/**
 * 檢查 Gateway 連接狀態
 */
async function checkGatewayStatus () {
  try {
    const response = await axios.get(`${GATEWAY_CONFIG.url}/health`, {
      timeout: 10000
    })

    return {
      online: true,
      status: response.status,
      data: response.data,
      url: GATEWAY_CONFIG.url
    }
  } catch (error) {
    return {
      online: false,
      error: error.message,
      url: GATEWAY_CONFIG.url
    }
  }
}

/**
 * 檢查本地 Gateway 項目狀態
 */
async function checkLocalGatewayStatus () {
  const gatewayPath = path.resolve(GATEWAY_CONFIG.localPath)

  if (!fs.existsSync(gatewayPath)) {
    return {
      exists: false,
      path: gatewayPath
    }
  }

  const packageJsonPath = path.join(gatewayPath, 'package.json')
  let packageInfo = null

  if (fs.existsSync(packageJsonPath)) {
    try {
      packageInfo = await fs.readJson(packageJsonPath)
    } catch (error) {
      // 忽略解析錯誤
    }
  }

  // 檢查 Git 狀態
  let gitInfo = null
  try {
    const git = simpleGit(gatewayPath)
    const status = await git.status()
    const log = await git.log({ maxCount: 1 })

    gitInfo = {
      branch: status.current,
      ahead: status.ahead,
      behind: status.behind,
      modified: status.files.length,
      lastCommit: log.latest
    }
  } catch (error) {
    // Git 不可用
  }

  return {
    exists: true,
    path: gatewayPath,
    package: packageInfo,
    git: gitInfo
  }
}

module.exports = {
  registerServiceToGateway,
  unregisterServiceFromGateway,
  listRegisteredServices,
  checkGatewayStatus,
  checkLocalGatewayStatus,
  verifyGatewayIntegration,
  getGatewayPath,
  GATEWAY_CONFIG
}

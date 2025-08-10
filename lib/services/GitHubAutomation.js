const axios = require('axios')
const simpleGit = require('simple-git')
const fs = require('fs-extra')
const path = require('path')
const { logger } = require('../utils/helpers')

class GitHubAutomation {
  constructor () {
    this.token = process.env.GITHUB_TOKEN
    this.baseURL = 'https://api.github.com'
    this.git = simpleGit()

    // API 客戶端配置
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Mursfoto-AutoDev-Factory/1.0.0'
      }
    })
  }

  /**
   * 完全自動化創建和配置新的 GitHub 倉庫
   */
  async createRepository (options) {
    const {
      name,
      description,
      private: isPrivate = false,
      template = null,
      autoInitialize = true
    } = options

    try {
      logger.info(`🔄 創建 GitHub 倉庫: ${name}`)

      // 1. 創建倉庫
      const repoData = await this.client.post('/user/repos', {
        name,
        description,
        private: isPrivate,
        auto_init: autoInitialize,
        gitignore_template: 'Node',
        license_template: 'mit'
      })

      logger.success(`✅ 倉庫創建成功: ${repoData.data.html_url}`)

      // 2. 如果有模板，應用模板
      if (template) {
        await this.applyTemplate(repoData.data, template)
      }

      // 3. 設置保護分支
      await this.setupBranchProtection(name)

      // 4. 創建必要的 Labels
      await this.createLabels(name)

      // 5. 設置 Webhooks
      await this.setupWebhooks(name)

      return repoData.data
    } catch (error) {
      logger.error(`❌ GitHub 倉庫創建失敗: ${error.message}`)
      throw error
    }
  }

  /**
   * 應用項目模板到新倉庫
   */
  async applyTemplate (repo, template) {
    try {
      logger.info(`📋 應用模板: ${template}`)

      // 克隆新創建的倉庫
      const tempDir = path.join('/tmp', `mursfoto-temp-${Date.now()}`)
      await this.git.clone(repo.clone_url, tempDir)

      // 應用模板文件
      const templatePath = path.join(__dirname, `../../templates/${template}`)
      if (await fs.pathExists(templatePath)) {
        await fs.copy(templatePath, tempDir, {
          overwrite: true,
          filter: (src) => !src.includes('.git')
        })

        // 提交模板變更
        const git = simpleGit(tempDir)
        await git.add('.')
        await git.commit(`🎉 初始項目模板 (${template})`)
        await git.push('origin', 'main')

        logger.success(`✅ 模板應用成功: ${template}`)
      }

      // 清理臨時目錄
      await fs.remove(tempDir)
    } catch (error) {
      logger.error(`❌ 模板應用失敗: ${error.message}`)
    }
  }

  /**
   * 設置分支保護規則
   */
  async setupBranchProtection (repoName) {
    try {
      const owner = await this.getCurrentUser()

      await this.client.put(`/repos/${owner.login}/${repoName}/branches/main/protection`, {
        required_status_checks: {
          strict: true,
          contexts: ['continuous-integration']
        },
        enforce_admins: false,
        required_pull_request_reviews: {
          required_approving_review_count: 1,
          dismiss_stale_reviews: true
        },
        restrictions: null,
        allow_auto_merge: true,
        allow_delete_branch: false
      })

      logger.success('✅ 分支保護規則設置完成')
    } catch (error) {
      logger.warn(`⚠️  分支保護設置跳過: ${error.message}`)
    }
  }

  /**
   * 創建項目標籤
   */
  async createLabels (repoName) {
    const labels = [
      { name: 'bug', color: 'd73a4a', description: '錯誤報告' },
      { name: 'enhancement', color: 'a2eeef', description: '功能增強' },
      { name: 'documentation', color: '0075ca', description: '文檔改進' },
      { name: 'good first issue', color: '7057ff', description: '適合新手' },
      { name: 'help wanted', color: '008672', description: '需要協助' },
      { name: 'priority: high', color: 'b60205', description: '高優先級' },
      { name: 'priority: medium', color: 'fbca04', description: '中優先級' },
      { name: 'priority: low', color: '0e8a16', description: '低優先級' },
      { name: 'mursfoto', color: '6f42c1', description: 'Mursfoto 相關' }
    ]

    try {
      const owner = await this.getCurrentUser()

      for (const label of labels) {
        try {
          await this.client.post(`/repos/${owner.login}/${repoName}/labels`, label)
          logger.info(`✅ 標籤創建: ${label.name}`)
        } catch (error) {
          if (error.response?.status !== 422) { // 忽略重複標籤錯誤
            logger.warn(`⚠️  標籤創建失敗: ${label.name}`)
          }
        }
      }
    } catch (error) {
      logger.error(`❌ 標籤創建失敗: ${error.message}`)
    }
  }

  /**
   * 設置 Webhooks
   */
  async setupWebhooks (repoName) {
    try {
      const owner = await this.getCurrentUser()
      const webhookURL = process.env.DISCORD_WEBHOOK_URL

      if (!webhookURL) {
        logger.warn('⚠️  未配置 Discord Webhook，跳過設置')
        return
      }

      // 注意: GitHub 不直接支援 Discord webhooks，這裡我們可以設置一個中間服務
      const webhook = {
        name: 'web',
        active: true,
        events: ['push', 'pull_request', 'issues', 'release'],
        config: {
          url: `${process.env.MURSFOTO_GATEWAY_URL}/api/github-webhook`,
          content_type: 'json',
          insecure_ssl: '0'
        }
      }

      await this.client.post(`/repos/${owner.login}/${repoName}/hooks`, webhook)
      logger.success('✅ Webhook 設置完成')
    } catch (error) {
      logger.warn(`⚠️  Webhook 設置跳過: ${error.message}`)
    }
  }

  /**
   * 自動創建 Pull Request
   */
  async createPullRequest (repoName, options) {
    const {
      title,
      body,
      head,
      base = 'main',
      draft = false
    } = options

    try {
      const owner = await this.getCurrentUser()

      const pr = await this.client.post(`/repos/${owner.login}/${repoName}/pulls`, {
        title,
        body,
        head,
        base,
        draft
      })

      logger.success(`✅ Pull Request 創建成功: ${pr.data.html_url}`)
      return pr.data
    } catch (error) {
      logger.error(`❌ Pull Request 創建失敗: ${error.message}`)
      throw error
    }
  }

  /**
   * 自動合併 Pull Request
   */
  async mergePullRequest (repoName, pullNumber, options = {}) {
    const {
      commit_title,
      commit_message,
      merge_method = 'squash'
    } = options

    try {
      const owner = await this.getCurrentUser()

      const result = await this.client.put(`/repos/${owner.login}/${repoName}/pulls/${pullNumber}/merge`, {
        commit_title,
        commit_message,
        merge_method
      })

      logger.success(`✅ Pull Request 合併成功: #${pullNumber}`)
      return result.data
    } catch (error) {
      logger.error(`❌ Pull Request 合併失敗: ${error.message}`)
      throw error
    }
  }

  /**
   * 創建 Release
   */
  async createRelease (repoName, options) {
    const {
      tag_name,
      name,
      body,
      draft = false,
      prerelease = false
    } = options

    try {
      const owner = await this.getCurrentUser()

      const release = await this.client.post(`/repos/${owner.login}/${repoName}/releases`, {
        tag_name,
        name,
        body,
        draft,
        prerelease
      })

      logger.success(`✅ Release 創建成功: ${release.data.html_url}`)
      return release.data
    } catch (error) {
      logger.error(`❌ Release 創建失敗: ${error.message}`)
      throw error
    }
  }

  /**
   * 批量創建 Issues
   */
  async createIssues (repoName, issues) {
    const results = []
    const owner = await this.getCurrentUser()

    for (const issue of issues) {
      try {
        const result = await this.client.post(`/repos/${owner.login}/${repoName}/issues`, issue)
        logger.success(`✅ Issue 創建成功: ${result.data.html_url}`)
        results.push(result.data)
      } catch (error) {
        logger.error(`❌ Issue 創建失敗: ${issue.title}`)
      }
    }

    return results
  }

  /**
   * 獲取當前用戶信息
   */
  async getCurrentUser () {
    if (!this._currentUser) {
      const response = await this.client.get('/user')
      this._currentUser = response.data
    }
    return this._currentUser
  }

  /**
   * 完全自動化工作流程
   */
  async automateProjectSetup (projectName, template, options = {}) {
    try {
      logger.info(`🚀 開始自動化項目設置: ${projectName}`)

      // 1. 創建倉庫
      const repo = await this.createRepository({
        name: projectName,
        description: `${projectName} - 基於 Mursfoto AutoDev Factory 創建`,
        template,
        ...options
      })

      // 2. 創建初始 Issues
      const initialIssues = [
        {
          title: '🎉 歡迎使用 Mursfoto AutoDev Factory',
          body: `
這個項目是由 Mursfoto AutoDev Factory 自動創建的。

## 🚀 快速開始

\`\`\`bash
npm install
npm run dev
\`\`\`

## 📋 待辦事項

- [ ] 完善項目文檔
- [ ] 添加測試用例  
- [ ] 配置 CI/CD
- [ ] 部署到生產環境

## 🔗 相關連結

- [Mursfoto API Gateway](https://github.com/mursfoto/mursfoto-api-gateway)
- [AutoDev CLI](https://github.com/mursfoto/mursfoto-cli)
          `,
          labels: ['documentation', 'good first issue', 'mursfoto']
        }
      ]

      await this.createIssues(projectName, initialIssues)

      // 3. 創建第一個 Release (如果需要)
      if (options.createInitialRelease) {
        await this.createRelease(projectName, {
          tag_name: 'v0.1.0',
          name: '🎉 初始版本',
          body: '由 Mursfoto AutoDev Factory 自動生成的初始版本'
        })
      }

      logger.success(`🎉 項目自動化設置完成: ${repo.html_url}`)
      return repo
    } catch (error) {
      logger.error(`❌ 自動化設置失敗: ${error.message}`)
      throw error
    }
  }
}

module.exports = GitHubAutomation

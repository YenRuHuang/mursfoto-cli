const BaseModule = require('./BaseModule');
const GitHubAutomation = require('../services/GitHubAutomation');

/**
 * GitHub 功能模組
 * 負責所有 GitHub 相關操作
 */
class GitHubModule extends BaseModule {
    async onInitialize() {
        this.githubService = new GitHubAutomation();
        this.logger.info('GitHub 模組初始化完成');
    }

    async onExecute(action, params) {
        switch (action) {
            case 'createRepo':
                return await this.createRepository(params);
            case 'setupActions':
                return await this.setupGitHubActions(params);
            case 'manageIssues':
                return await this.manageIssues(params);
            default:
                throw new Error(`未知的 GitHub 操作: ${action}`);
        }
    }

    async createRepository(params) {
        const { name, description, isPrivate = false } = params;
        this.logger.info(`建立 GitHub 倉庫: ${name}`);
        
        try {
            const result = await this.githubService.createRepository({
                name,
                description,
                private: isPrivate
            });
            
            this.logger.success(`✓ 成功建立倉庫: ${result.html_url}`);
            return result;
        } catch (error) {
            this.logger.error(`❌ 建立倉庫失敗: ${error.message}`);
            throw error;
        }
    }

    async setupGitHubActions(params) {
        const { repoName, workflows = [] } = params;
        this.logger.info(`設定 GitHub Actions: ${repoName}`);
        
        // 實作 GitHub Actions 設定邏輯
        return { status: 'configured', workflows };
    }

    async manageIssues(params) {
        const { action, repoName, issueData } = params;
        this.logger.info(`管理 Issues: ${action}`);
        
        // 實作 Issues 管理邏輯
        return { status: 'managed', action };
    }
}

module.exports = GitHubModule;

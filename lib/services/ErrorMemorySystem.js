const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { logger } = require('../utils/helpers');

class ErrorMemorySystem {
  constructor() {
    this.memoryDir = path.join(__dirname, '../../.memory');
    this.errorLogPath = path.join(this.memoryDir, 'error_memory.json');
    this.solutionPath = path.join(this.memoryDir, 'solutions.json');
    this.patternPath = path.join(this.memoryDir, 'error_patterns.json');
    
    this.initializeMemory();
  }

  /**
   * 初始化記憶系統
   */
  async initializeMemory() {
    try {
      await fs.ensureDir(this.memoryDir);
      
      // 確保記憶文件存在
      if (!await fs.pathExists(this.errorLogPath)) {
        await fs.writeJson(this.errorLogPath, { errors: [] });
      }
      
      if (!await fs.pathExists(this.solutionPath)) {
        await fs.writeJson(this.solutionPath, { solutions: [] });
      }
      
      if (!await fs.pathExists(this.patternPath)) {
        await fs.writeJson(this.patternPath, { patterns: [] });
      }
      
    } catch (error) {
      logger.error('記憶系統初始化失敗:', error.message);
    }
  }

  /**
   * 記錄錯誤信息
   */
  async recordError(errorInfo) {
    try {
      // 強化參數驗證 - 確保 errorInfo 存在且格式正確
      if (!errorInfo || typeof errorInfo !== 'object') {
        console.warn('⚠️  錯誤記錄失敗: errorInfo 參數無效或未提供');
        return null;
      }

      // 安全解構，提供預設值
      const {
        command = 'unknown',
        error = null,
        context = {},
        timestamp = new Date().toISOString(),
        environment = this.getEnvironmentInfo()
      } = errorInfo;

      // 安全處理錯誤對象 - 優先使用 error，然後使用整個 errorInfo 作為 fallback
      const safeError = this.normalizeError(error || errorInfo.error || errorInfo);

      // 生成錯誤指紋
      const errorFingerprint = this.generateErrorFingerprint(safeError, command || 'unknown', context || {});
      
      const errorRecord = {
        id: crypto.randomUUID(),
        fingerprint: errorFingerprint,
        command: command || 'unknown',
        error: {
          message: safeError.message || 'No error message',
          stack: safeError.stack || '',
          code: safeError.code || null,
          type: safeError.type || 'Error'
        },
        context,
        environment,
        timestamp,
        count: 1,
        lastOccurrence: timestamp,
        resolved: false,
        solution: null
      };

      const memory = await fs.readJson(this.errorLogPath);
      
      // 檢查是否已存在相同錯誤
      const existingError = memory.errors.find(e => e.fingerprint === errorFingerprint);
      
      if (existingError) {
        existingError.count += 1;
        existingError.lastOccurrence = timestamp;
        existingError.environment = environment; // 更新環境信息
        logger.info(`🔄 錯誤重複出現 (${existingError.count}次): ${errorFingerprint.substring(0, 8)}`);
      } else {
        memory.errors.push(errorRecord);
        logger.info(`📝 記錄新錯誤: ${errorFingerprint.substring(0, 8)}`);
      }

      // 保存記憶
      await fs.writeJson(this.errorLogPath, memory, { spaces: 2 });
      
      // 嘗試自動分析和建議解決方案
      await this.analyzeAndSuggestSolution(errorRecord);
      
      return errorRecord;
      
    } catch (err) {
      logger.error('錯誤記錄失敗:', err.message);
    }
  }

  /**
   * 標準化錯誤對象
   */
  normalizeError(error) {
    if (!error) {
      return {
        message: 'Unknown error',
        stack: '',
        code: null,
        type: 'UnknownError'
      };
    }

    if (typeof error === 'string') {
      return {
        message: error,
        stack: '',
        code: null,
        type: 'StringError'
      };
    }

    return {
      message: error.message || 'No error message',
      stack: error.stack || '',
      code: error.code || null,
      type: error.constructor?.name || 'Error'
    };
  }

  /**
   * 生成錯誤指紋
   */
  generateErrorFingerprint(error, command, context) {
    try {
      const safeCommand = command || 'unknown';
      const safeMessage = (error && error.message) || 'unknown error';
      const safeCode = (error && error.code) || 'no-code';
      const safeContext = context || {};
      
      const key = `${safeCommand}|${safeMessage}|${safeCode}|${JSON.stringify(safeContext)}`;
      return crypto.createHash('sha256').update(key).digest('hex');
    } catch (err) {
      // 如果 JSON.stringify 失敗，使用簡化版本
      const fallbackKey = `${command || 'unknown'}|${(error && error.message) || 'unknown'}`;
      return crypto.createHash('sha256').update(fallbackKey).digest('hex');
    }
  }

  /**
   * 記錄解決方案
   */
  async recordSolution(errorFingerprint, solution, success = true) {
    try {
      const solutionRecord = {
        id: crypto.randomUUID(),
        errorFingerprint,
        solution: {
          description: solution.description,
          steps: solution.steps,
          command: solution.command,
          notes: solution.notes
        },
        success,
        timestamp: new Date().toISOString(),
        appliedCount: success ? 1 : 0
      };

      const solutions = await fs.readJson(this.solutionPath);
      solutions.solutions.push(solutionRecord);
      await fs.writeJson(this.solutionPath, solutions, { spaces: 2 });

      // 如果解決方案成功，標記錯誤為已解決
      if (success) {
        await this.markErrorAsResolved(errorFingerprint, solutionRecord);
      }

      logger.success(`✅ 解決方案已記錄: ${errorFingerprint.substring(0, 8)}`);
      return solutionRecord;
      
    } catch (error) {
      logger.error('解決方案記錄失敗:', error.message);
    }
  }

  /**
   * 標記錯誤為已解決
   */
  async markErrorAsResolved(errorFingerprint, solution) {
    try {
      const memory = await fs.readJson(this.errorLogPath);
      const error = memory.errors.find(e => e.fingerprint === errorFingerprint);
      
      if (error) {
        error.resolved = true;
        error.solution = solution.id;
        error.resolvedAt = new Date().toISOString();
        
        await fs.writeJson(this.errorLogPath, memory, { spaces: 2 });
        logger.success(`✅ 錯誤已標記為解決: ${errorFingerprint.substring(0, 8)}`);
      }
      
    } catch (error) {
      logger.error('錯誤狀態更新失敗:', error.message);
    }
  }

  /**
   * 查找相似錯誤和解決方案
   */
  async findSimilarErrors(errorFingerprint) {
    try {
      const memory = await fs.readJson(this.errorLogPath);
      const solutions = await fs.readJson(this.solutionPath);
      
      // 尋找相同指紋的錯誤
      const exactMatch = memory.errors.find(e => e.fingerprint === errorFingerprint);
      
      if (exactMatch && exactMatch.resolved) {
        const solution = solutions.solutions.find(s => s.id === exactMatch.solution);
        return {
          type: 'exact',
          error: exactMatch,
          solution
        };
      }

      // 尋找相似的錯誤 (基於錯誤消息的相似度)
      const currentError = memory.errors.find(e => e.fingerprint === errorFingerprint);
      if (!currentError) return null;

      const similarErrors = memory.errors.filter(e => 
        e.fingerprint !== errorFingerprint &&
        e.resolved &&
        this.calculateSimilarity(currentError.error.message, e.error.message) > 0.7
      );

      if (similarErrors.length > 0) {
        const bestMatch = similarErrors[0];
        const solution = solutions.solutions.find(s => s.id === bestMatch.solution);
        
        return {
          type: 'similar',
          error: bestMatch,
          solution,
          similarity: this.calculateSimilarity(currentError.error.message, bestMatch.error.message)
        };
      }

      return null;
      
    } catch (error) {
      logger.error('相似錯誤查找失敗:', error.message);
      return null;
    }
  }

  /**
   * 計算字符串相似度
   */
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * 計算編輯距離
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * 分析錯誤並建議解決方案
   */
  async analyzeAndSuggestSolution(errorRecord) {
    try {
      // 尋找相似的已解決錯誤
      const similarError = await this.findSimilarErrors(errorRecord.fingerprint);
      
      if (similarError) {
        logger.info(`💡 發現${similarError.type === 'exact' ? '相同' : '相似'}的已解決錯誤`);
        logger.info(`📋 建議解決方案: ${similarError.solution?.solution.description}`);
        
        if (similarError.solution?.solution.steps) {
          logger.info('🔧 解決步驟:');
          similarError.solution.solution.steps.forEach((step, index) => {
            logger.info(`   ${index + 1}. ${step}`);
          });
        }
        
        return similarError.solution;
      }

      // 基於錯誤模式的自動建議
      const autoSuggestion = this.generateAutoSuggestion(errorRecord);
      if (autoSuggestion) {
        logger.info('🤖 自動建議解決方案:');
        logger.info(`📋 ${autoSuggestion.description}`);
        
        if (autoSuggestion.command) {
          logger.info(`💻 建議命令: ${autoSuggestion.command}`);
        }
      }

      return autoSuggestion;
      
    } catch (error) {
      logger.error('錯誤分析失敗:', error.message);
    }
  }

  /**
   * 基於模式生成自動建議
   */
  generateAutoSuggestion(errorRecord) {
    const { error, command } = errorRecord;
    const errorMessage = error.message.toLowerCase();

    // npm 相關錯誤
    if (errorMessage.includes('npm') || errorMessage.includes('package')) {
      if (errorMessage.includes('permission') || errorMessage.includes('eacces')) {
        return {
          description: 'npm 權限錯誤，建議使用 sudo 或檢查權限',
          steps: [
            '檢查檔案權限',
            '使用 sudo npm (如果必要)',
            '或者重新配置 npm 權限'
          ],
          command: 'sudo npm install',
          confidence: 0.8
        };
      }
      
      if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        return {
          description: '網絡連接問題，建議檢查網絡或更換 npm registry',
          steps: [
            '檢查網絡連接',
            '清理 npm cache',
            '嘗試使用不同的 registry'
          ],
          command: 'npm cache clean --force && npm install',
          confidence: 0.7
        };
      }
    }

    // Docker 相關錯誤
    if (errorMessage.includes('docker')) {
      if (errorMessage.includes('not found') || errorMessage.includes('command not found')) {
        return {
          description: 'Docker 未安裝或不在 PATH 中',
          steps: [
            '安裝 Docker Desktop',
            '確保 Docker 服務已啟動',
            '檢查 PATH 環境變數'
          ],
          command: 'brew install --cask docker',
          confidence: 0.9
        };
      }
    }

    // Git 相關錯誤
    if (errorMessage.includes('git')) {
      if (errorMessage.includes('permission denied') || errorMessage.includes('authentication')) {
        return {
          description: 'Git 認證問題，檢查 SSH key 或 token',
          steps: [
            '檢查 SSH key 配置',
            '確認 GitHub token 有效',
            '檢查倉庫權限'
          ],
          command: 'ssh -T git@github.com',
          confidence: 0.8
        };
      }
    }

    // 通用文件權限錯誤
    if (errorMessage.includes('permission denied') || errorMessage.includes('eacces')) {
      return {
        description: '文件權限錯誤，檢查文件和目錄權限',
        steps: [
          '檢查文件權限',
          '修改文件權限',
          '檢查用戶群組'
        ],
        command: 'ls -la && chmod +x filename',
        confidence: 0.6
      };
    }

    return null;
  }

  /**
   * 獲取環境信息
   */
  getEnvironmentInfo() {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cwd: process.cwd(),
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage(),
      env: {
        GITHUB_TOKEN: !!process.env.GITHUB_TOKEN,
        DISCORD_WEBHOOK_URL: !!process.env.DISCORD_WEBHOOK_URL,
        MURSFOTO_GATEWAY_URL: process.env.MURSFOTO_GATEWAY_URL
      }
    };
  }

  /**
   * 獲取錯誤統計
   */
  async getErrorStatistics() {
    try {
      const memory = await fs.readJson(this.errorLogPath);
      const solutions = await fs.readJson(this.solutionPath);
      
      const stats = {
        totalErrors: memory.errors.length,
        resolvedErrors: memory.errors.filter(e => e.resolved).length,
        unresolvedErrors: memory.errors.filter(e => !e.resolved).length,
        totalSolutions: solutions.solutions.length,
        successfulSolutions: solutions.solutions.filter(s => s.success).length,
        mostCommonErrors: {},
        errorsByCommand: {},
        recentErrors: memory.errors
          .sort((a, b) => new Date(b.lastOccurrence) - new Date(a.lastOccurrence))
          .slice(0, 10)
      };

      // 統計最常見的錯誤
      memory.errors.forEach(error => {
        const key = error.error.message.substring(0, 50) + '...';
        stats.mostCommonErrors[key] = (stats.mostCommonErrors[key] || 0) + error.count;
      });

      // 統計各命令的錯誤
      memory.errors.forEach(error => {
        stats.errorsByCommand[error.command] = (stats.errorsByCommand[error.command] || 0) + error.count;
      });

      return stats;
      
    } catch (error) {
      logger.error('統計信息獲取失敗:', error.message);
      return null;
    }
  }

  /**
   * 清理舊的錯誤記錄
   */
  async cleanupOldErrors(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const memory = await fs.readJson(this.errorLogPath);
      const originalCount = memory.errors.length;
      
      memory.errors = memory.errors.filter(error => 
        new Date(error.lastOccurrence) > cutoffDate
      );
      
      await fs.writeJson(this.errorLogPath, memory, { spaces: 2 });
      
      const cleanedCount = originalCount - memory.errors.length;
      if (cleanedCount > 0) {
        logger.info(`🧹 清理了 ${cleanedCount} 個舊錯誤記錄`);
      }
      
      return cleanedCount;
      
    } catch (error) {
      logger.error('錯誤記錄清理失敗:', error.message);
    }
  }

  /**
   * 導出錯誤記憶
   */
  async exportMemory(exportPath) {
    try {
      const memory = await fs.readJson(this.errorLogPath);
      const solutions = await fs.readJson(this.solutionPath);
      
      const exportData = {
        exported_at: new Date().toISOString(),
        version: '1.0.0',
        errors: memory.errors,
        solutions: solutions.solutions,
        statistics: await this.getErrorStatistics()
      };
      
      await fs.writeJson(exportPath, exportData, { spaces: 2 });
      logger.success(`📤 錯誤記憶已導出: ${exportPath}`);
      
      return exportData;
      
    } catch (error) {
      logger.error('錯誤記憶導出失敗:', error.message);
    }
  }
}

module.exports = ErrorMemorySystem;

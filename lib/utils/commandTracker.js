const IntelligentLearningSystem = require('../services/IntelligentLearningSystem');

/**
 * 全局命令追蹤器 - 自動記錄所有命令執行到學習系統
 */
class CommandTracker {
  constructor() {
    this.learningSystem = new IntelligentLearningSystem();
    this.commandStartTime = null;
    this.currentCommand = null;
  }

  /**
   * 開始追蹤命令
   */
  startTracking(commandName, args = [], context = {}) {
    this.commandStartTime = Date.now();
    this.currentCommand = {
      command: commandName,
      args: args,
      context: context,
      startTime: this.commandStartTime
    };
  }

  /**
   * 結束追蹤並記錄結果
   */
  async endTracking(success = true, error = null) {
    if (!this.currentCommand || !this.commandStartTime) {
      return;
    }

    const duration = Date.now() - this.commandStartTime;
    
    try {
      await this.learningSystem.recordCommand({
        command: this.currentCommand.command,
        args: this.currentCommand.args,
        success: success,
        duration: duration,
        context: this.currentCommand.context,
        error: error
      });
    } catch (recordError) {
      // 記錄學習系統錯誤但不影響主要命令流程
      console.error('學習系統記錄失敗:', recordError.message);
    }

    // 清理當前命令
    this.currentCommand = null;
    this.commandStartTime = null;
  }

  /**
   * 獲取學習系統實例
   */
  getLearningSystem() {
    return this.learningSystem;
  }
}

// 創建全局實例
const globalTracker = new CommandTracker();

/**
 * 命令包裝器 - 自動追蹤命令執行
 */
function wrapCommand(commandName, commandFunction, context = {}) {
  return async (...args) => {
    // 開始追蹤
    globalTracker.startTracking(commandName, args, context);
    
    try {
      // 執行原始命令
      const result = await commandFunction(...args);
      
      // 記錄成功
      await globalTracker.endTracking(true);
      
      return result;
    } catch (error) {
      // 記錄失敗
      await globalTracker.endTracking(false, error);
      throw error; // 重新拋出錯誤
    }
  };
}

module.exports = {
  CommandTracker,
  globalTracker,
  wrapCommand
};

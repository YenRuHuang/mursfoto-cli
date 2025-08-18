/**
 * 基底模組類別
 * 所有功能模組都應繼承此類別
 */
class BaseModule {
    constructor(name, options = {}) {
        this.name = name;
        this.options = options;
        this.logger = options.logger || console;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        this.logger.info(`初始化模組: ${this.name}`);
        await this.onInitialize();
        this.initialized = true;
    }

    async onInitialize() {
        // 子類別可覆寫此方法
    }

    async execute(action, params = {}) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        return await this.onExecute(action, params);
    }

    async onExecute(action, params) {
        throw new Error(`模組 ${this.name} 尚未實作 onExecute 方法`);
    }

    getInfo() {
        return {
            name: this.name,
            initialized: this.initialized,
            options: this.options
        };
    }
}

module.exports = BaseModule;

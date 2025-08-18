/**
 * 模組註冊中心
 * 管理所有功能模組的生命週期
 */
class ModuleRegistry {
    constructor() {
        this.modules = new Map();
        this.loadOrder = [];
    }

    register(moduleName, moduleClass, options = {}) {
        if (this.modules.has(moduleName)) {
            throw new Error(`模組 ${moduleName} 已經註冊`);
        }

        const moduleInstance = new moduleClass(moduleName, options);
        this.modules.set(moduleName, moduleInstance);
        this.loadOrder.push(moduleName);
        
        return moduleInstance;
    }

    async get(moduleName) {
        const module = this.modules.get(moduleName);
        if (!module) {
            throw new Error(`模組 ${moduleName} 未註冊`);
        }

        if (!module.initialized) {
            await module.initialize();
        }

        return module;
    }

    async initializeAll() {
        for (const moduleName of this.loadOrder) {
            const module = this.modules.get(moduleName);
            if (!module.initialized) {
                await module.initialize();
            }
        }
    }

    getRegistered() {
        return Array.from(this.modules.keys());
    }

    async execute(moduleName, action, params = {}) {
        const module = await this.get(moduleName);
        return await module.execute(action, params);
    }
}

// 全域註冊中心實例
const globalRegistry = new ModuleRegistry();

module.exports = { ModuleRegistry, globalRegistry };

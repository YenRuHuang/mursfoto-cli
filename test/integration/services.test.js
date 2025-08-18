const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

describe('Mursfoto CLI 服務整合測試', () => {
    let testWorkspace;

    beforeAll(async () => {
        // 創建測試工作空間
        testWorkspace = path.join(__dirname, '../temp', 'integration-test');
        fs.ensureDirSync(testWorkspace);
        process.chdir(testWorkspace);
    });

    afterAll(async () => {
        // 清理測試工作空間
        process.chdir(path.join(__dirname, '../..'));
        if (fs.existsSync(testWorkspace)) {
            fs.removeSync(testWorkspace);
        }
    });

    describe('統一服務整合', () => {
        test('AI 統合服務應該正確初始化', async () => {
            const AiUnified = require('../../lib/services/ai-unified');
            
            expect(() => {
                const aiService = new AiUnified({ autoInit: false });
                expect(aiService).toBeDefined();
                expect(aiService.options).toBeDefined();
                expect(aiService.stats).toBeDefined();
            }).not.toThrow();
        });

        test('部署統合服務應該正確初始化', async () => {
            const DeploymentUnified = require('../../lib/services/deployment-unified');
            
            expect(() => {
                const deployService = new DeploymentUnified({ autoInit: false });
                expect(deployService).toBeDefined();
            }).not.toThrow();
        });

        test('開發統合服務應該正確初始化', async () => {
            const DevelopmentUnified = require('../../lib/services/development-unified');
            
            expect(() => {
                const devService = new DevelopmentUnified({ autoInit: false });
                expect(devService).toBeDefined();
            }).not.toThrow();
        });

        test('系統統合服務應該正確初始化', async () => {
            const SystemUnified = require('../../lib/services/system-unified');
            
            expect(() => {
                const sysService = new SystemUnified({ autoInit: false });
                expect(sysService).toBeDefined();
            }).not.toThrow();
        });
    });

    describe('模組系統整合', () => {
        test('模組註冊器應該能管理模組', async () => {
            const ModuleRegistry = require('../../lib/modules/ModuleRegistry');
            const BaseModule = require('../../lib/modules/BaseModule');
            
            const registry = new ModuleRegistry();
            const testModule = new BaseModule('test-integration-module');
            
            registry.register('test', testModule);
            expect(registry.get('test')).toBe(testModule);
            expect(registry.has('test')).toBe(true);
            expect(registry.list()).toContain('test');
        });

        test('GitHub 模組應該能正確載入', async () => {
            const GitHubModule = require('../../lib/modules/GitHubModule');
            const BaseModule = require('../../lib/modules/BaseModule');
            
            const githubModule = new GitHubModule();
            expect(githubModule).toBeInstanceOf(BaseModule);
            expect(githubModule.name).toBe('github');
        });
    });

    describe('CLI 命令整合', () => {
        test('創建命令應該能正確載入', () => {
            expect(() => {
                const createCommand = require('../../lib/commands/create');
                expect(typeof createCommand).toBe('function');
            }).not.toThrow();
        });

        test('工具函數應該能正確載入', () => {
            expect(() => {
                const helpers = require('../../lib/utils/helpers');
                expect(helpers).toBeDefined();
                expect(typeof helpers.validateProjectName).toBe('function');
                expect(typeof helpers.ensureDirectoryExists).toBe('function');
            }).not.toThrow();
        });
    });

    describe('模板系統整合', () => {
        test('模板配置應該能正確載入', () => {
            expect(() => {
                const templates = require('../../lib/utils/templates');
                expect(templates).toBeDefined();
                expect(typeof templates.getTemplateConfig).toBe('function');
                expect(typeof templates.processTemplate).toBe('function');
            }).not.toThrow();
        });

        test('minimal 模板應該存在', () => {
            const minimalPath = path.join(__dirname, '../../templates/minimal');
            expect(fs.existsSync(minimalPath)).toBe(true);
            expect(fs.existsSync(path.join(minimalPath, 'package.json'))).toBe(true);
        });

        test('enterprise-production 模板應該存在', () => {
            const enterprisePath = path.join(__dirname, '../../templates/enterprise-production');
            expect(fs.existsSync(enterprisePath)).toBe(true);
            expect(fs.existsSync(path.join(enterprisePath, 'package.json'))).toBe(true);
        });
    });

    describe('GUI 服務整合', () => {
        test('GUI 服務器應該能正確載入', () => {
            expect(() => {
                const GUIServer = require('../../lib/services/GUIServer');
                expect(GUIServer).toBeDefined();
            }).not.toThrow();
        });

        test('GUI 靜態文件應該存在', () => {
            const guiPath = path.join(__dirname, '../../lib/gui');
            expect(fs.existsSync(path.join(guiPath, 'index.html'))).toBe(true);
            expect(fs.existsSync(path.join(guiPath, 'style.css'))).toBe(true);
            expect(fs.existsSync(path.join(guiPath, 'app.js'))).toBe(true);
        });
    });
});
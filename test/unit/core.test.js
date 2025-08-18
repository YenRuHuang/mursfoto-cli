const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs-extra');
const path = require('path');
const { validateProjectName, ensureDirectoryExists } = require('../../lib/utils/helpers');

describe('Mursfoto CLI 核心功能單元測試', () => {
    let testDir;

    beforeEach(() => {
        // 創建測試目錄
        testDir = path.join(__dirname, '../temp', `test-${Date.now()}`);
        fs.ensureDirSync(testDir);
    });

    afterEach(() => {
        // 清理測試目錄
        if (fs.existsSync(testDir)) {
            fs.removeSync(testDir);
        }
    });

    describe('專案名稱驗證', () => {
        test('應該接受有效的專案名稱', () => {
            expect(validateProjectName('my-project')).toBe(true);
            expect(validateProjectName('my_project')).toBe(true);
            expect(validateProjectName('MyProject123')).toBe(true);
        });

        test('應該拒絕無效的專案名稱', () => {
            expect(validateProjectName('')).toBe(false);
            expect(validateProjectName('my project')).toBe(false);
            expect(validateProjectName('my@project')).toBe(false);
            expect(validateProjectName('123project')).toBe(false);
        });
    });

    describe('目錄操作', () => {
        test('應該能創建目錄', async () => {
            const newDir = path.join(testDir, 'new-directory');
            await ensureDirectoryExists(newDir);
            expect(fs.existsSync(newDir)).toBe(true);
        });

        test('應該處理已存在的目錄', async () => {
            const existingDir = path.join(testDir, 'existing');
            fs.ensureDirSync(existingDir);
            
            await expect(ensureDirectoryExists(existingDir)).resolves.not.toThrow();
            expect(fs.existsSync(existingDir)).toBe(true);
        });
    });

    describe('統一服務載入', () => {
        test('應該能載入所有統一服務', () => {
            const services = ['ai-unified', 'deployment-unified', 'development-unified', 'system-unified'];
            
            services.forEach(serviceName => {
                expect(() => {
                    require(`../../lib/services/${serviceName}`);
                }).not.toThrow();
            });
        });
    });

    describe('模組系統', () => {
        test('應該能載入基底模組', () => {
            const BaseModule = require('../../lib/modules/BaseModule');
            expect(BaseModule).toBeDefined();
            
            const module = new BaseModule('test-module');
            expect(module.name).toBe('test-module');
            expect(module.initialized).toBe(false);
        });

        test('應該能載入 GitHub 模組', () => {
            const GitHubModule = require('../../lib/modules/GitHubModule');
            expect(GitHubModule).toBeDefined();
        });

        test('應該能載入模組註冊器', () => {
            const ModuleRegistry = require('../../lib/modules/ModuleRegistry');
            expect(ModuleRegistry).toBeDefined();
        });
    });
});
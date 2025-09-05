const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');
const { execSync, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

describe('Mursfoto CLI E2E 測試', () => {
    let testDir;
    let originalCwd;

    beforeAll(() => {
        originalCwd = process.cwd();
        testDir = path.join(__dirname, '../temp', 'e2e-test');
        fs.ensureDirSync(testDir);
    });

    afterAll(() => {
        process.chdir(originalCwd);
        if (fs.existsSync(testDir)) {
            fs.removeSync(testDir);
        }
    });

    describe('CLI 基本功能', () => {
        test('應該顯示版本信息', () => {
            const output = execSync('node bin/mursfoto.js --version', { 
                encoding: 'utf8',
                cwd: path.join(__dirname, '../..')
            });
            expect(output.trim()).toBe('4.4.0');
        });

        test('應該顯示幫助信息', () => {
            const output = execSync('node bin/mursfoto.js --help', { 
                encoding: 'utf8',
                cwd: path.join(__dirname, '../..')
            });
            expect(output).toContain('三 AI 協作系統');
            expect(output).toContain('create');
            expect(output).toContain('doctor');
            expect(output).toContain('gui');
            expect(output).toContain('status');
        });

        test('doctor 命令應該正常執行', () => {
            const output = execSync('node bin/mursfoto.js doctor', { 
                encoding: 'utf8',
                cwd: path.join(__dirname, '../..')
            });
            expect(output).toContain('系統診斷中');
            expect(output).toContain('Node.js');
            expect(output).toContain('NPM');
        });

        test('status 命令應該正常執行', () => {
            const output = execSync('node bin/mursfoto.js status', { 
                encoding: 'utf8',
                cwd: path.join(__dirname, '../..')
            });
            expect(output).toContain('檢查服務狀態');
            expect(output).toContain('ai-unified');
            expect(output).toContain('deployment-unified');
        });
    });

    describe('專案創建 E2E 測試', () => {
        test('create-project 工具應該顯示幫助', () => {
            const output = execSync('node bin/create-project.js --help', { 
                encoding: 'utf8',
                cwd: path.join(__dirname, '../..')
            });
            expect(output).toContain('快速創建 Mursfoto 項目的獨立工具');
            expect(output).toContain('project-name');
            expect(output).toContain('--template');
        });

        test('應該能創建 minimal 模板專案', () => {
            process.chdir(testDir);
            
            const projectName = 'test-minimal-project';
            const output = execSync(`node ${path.join(__dirname, '../../bin/create-project.js')} ${projectName} --template minimal --no-install --no-git`, { 
                encoding: 'utf8'
            });
            
            expect(fs.existsSync(path.join(testDir, projectName))).toBe(true);
            expect(fs.existsSync(path.join(testDir, projectName, 'package.json'))).toBe(true);
            expect(fs.existsSync(path.join(testDir, projectName, 'server.js'))).toBe(true);
            
            // 檢查 package.json 內容
            const packageJson = fs.readJsonSync(path.join(testDir, projectName, 'package.json'));
            expect(packageJson.name).toBe(projectName);
        }, 30000);

        test('應該處理無效的專案名稱', () => {
            process.chdir(testDir);
            
            expect(() => {
                execSync(`node ${path.join(__dirname, '../../bin/create-project.js')} "invalid project name" --no-install --no-git`, { 
                    encoding: 'utf8'
                });
            }).toThrow();
        });
    });

    describe('錯誤處理 E2E 測試', () => {
        test('應該處理未知命令', () => {
            expect(() => {
                execSync('node bin/mursfoto.js unknown-command', { 
                    encoding: 'utf8',
                    cwd: path.join(__dirname, '../..')
                });
            }).toThrow();
        });

        test('應該處理無效的選項', () => {
            expect(() => {
                execSync('node bin/mursfoto.js create --invalid-option', { 
                    encoding: 'utf8',
                    cwd: path.join(__dirname, '../..')
                });
            }).toThrow();
        });
    });

    describe('模板系統 E2E 測試', () => {
        test('應該列出可用的模板', () => {
            const templatesDir = path.join(__dirname, '../../lib/templates');
            const templates = fs.readdirSync(templatesDir);
            
            expect(templates).toContain('minimal');
            expect(templates).toContain('enterprise-production');
        });

        test('基本模板都應該有 package.json', () => {
            const templatesDir = path.join(__dirname, '../../lib/templates');
            const basicTemplates = ['minimal', 'enterprise-production', 'n8n'];
            
            basicTemplates.forEach(template => {
                const templatePath = path.join(templatesDir, template);
                if (fs.existsSync(templatePath) && fs.statSync(templatePath).isDirectory()) {
                    expect(fs.existsSync(path.join(templatePath, 'package.json'))).toBe(true);
                }
            });
        });
    });
});
# CLI API 文檔

## 命令行 API 參考

### 全局選項

所有命令都支持以下全局選項：

- `-h, --help` - 顯示命令幫助信息
- `-v, --version` - 顯示 CLI 版本號

### `mursfoto create [project-name]`

創建新的 Mursfoto 服務項目。

#### 語法
```bash
mursfoto create [project-name] [options]
```

#### 參數
- `project-name` - 項目名稱（可選，如未提供將進入互動模式）

#### 選項
- `-t, --template <template>` - 指定模板 (minimal, calculator, test-tool, api-service)
- `--no-install` - 跳過依賴安裝
- `--no-git` - 跳過 Git 初始化  
- `--no-gateway` - 跳過 Gateway 註冊
- `--port <port>` - 指定服務端口（默認：3001）

#### 範例
```bash
# 互動式創建
mursfoto create

# 指定項目名和模板
mursfoto create my-api --template=minimal

# 跳過自動配置
mursfoto create simple-api --template=minimal --no-git --no-gateway
```

#### 返回值
- 成功：退出代碼 0
- 失敗：退出代碼 1

---

### `mursfoto doctor`

執行環境診斷檢查。

#### 語法
```bash
mursfoto doctor [options]
```

#### 選項
- `--verbose` - 顯示詳細診斷信息
- `--json` - 輸出 JSON 格式結果

#### 檢查項目
1. **系統環境**
   - Node.js 版本（要求 >= 18.0.0）
   - 系統平台和架構
   - 記憶體和 CPU 信息

2. **依賴工具**
   - npm 套件管理器
   - git 版本控制
   - curl HTTP 客戶端
   - docker 容器平台（可選）

3. **Gateway 狀態**
   - Gateway 服務連接狀態
   - 本地 Gateway 項目檢查
   - Git 倉庫狀態

#### 範例
```bash
# 基本診斷
mursfoto doctor

# 詳細診斷
mursfoto doctor --verbose

# JSON 輸出
mursfoto doctor --json
```

---

### `mursfoto template <command>`

管理項目模板。

#### 子命令

##### `mursfoto template list`
列出所有可用模板。

```bash
mursfoto template list
```

##### `mursfoto template info <template>`
顯示特定模板的詳細信息。

```bash
mursfoto template info minimal
```

#### 可用模板

| 模板 ID | 描述 | 適用場景 |
|---------|------|----------|
| `minimal` | Express + 基本功能 | 簡單的 API 服務 |
| `calculator` | 基於 tw-life-formula | 計算工具和數學服務 |
| `test-tool` | 完整測試配置 | 需要完整測試套件的項目 |
| `api-service` | RESTful API 服務 | 完整的後端 API 服務 |

---

### `mursfoto gateway <command>`

管理 API Gateway 配置。

#### 子命令

##### `mursfoto gateway list`
列出已註冊的服務。

```bash
mursfoto gateway list
```

##### `mursfoto gateway register <service>`
手動註冊服務到 Gateway。

```bash
mursfoto gateway register my-service
```

##### `mursfoto gateway status`
檢查 Gateway 連接狀態。

```bash
mursfoto gateway status
```

---

### `mursfoto status`

檢查項目和 Gateway 狀態。

#### 語法
```bash
mursfoto status [options]
```

#### 選項
- `--json` - 輸出 JSON 格式
- `--verbose` - 顯示詳細狀態信息

---

### `mursfoto config <command>`

管理 CLI 配置。

#### 子命令

##### `mursfoto config get [key]`
獲取配置值。

```bash
# 獲取所有配置
mursfoto config get

# 獲取特定配置
mursfoto config get defaultTemplate
```

##### `mursfoto config set <key> <value>`
設置配置值。

```bash
mursfoto config set defaultTemplate calculator
mursfoto config set autoInstall false
```

##### `mursfoto config reset`
重置所有配置為默認值。

```bash
mursfoto config reset
```

#### 可配置項目

| 配置鍵 | 默認值 | 描述 |
|--------|--------|------|
| `defaultTemplate` | `minimal` | 默認項目模板 |
| `gatewayUrl` | `https://gateway.mursfoto.com` | Gateway 服務 URL |
| `autoInstall` | `true` | 自動安裝依賴 |
| `autoGitInit` | `true` | 自動初始化 Git |
| `autoGatewayRegister` | `true` | 自動註冊到 Gateway |

---

### `mursfoto deploy`

部署項目到 Zeabur。

#### 語法
```bash
mursfoto deploy [options]
```

#### 選項
- `--env <environment>` - 指定環境（dev, staging, production）
- `--no-build` - 跳過構建步驟
- `--verbose` - 顯示詳細部署日誌

#### 範例
```bash
# 部署到生產環境
mursfoto deploy --env production

# 跳過構建的快速部署
mursfoto deploy --no-build
```

## 退出代碼

| 代碼 | 描述 |
|------|------|
| 0 | 成功 |
| 1 | 一般錯誤 |
| 2 | 無效參數 |
| 3 | 權限錯誤 |
| 4 | 網絡錯誤 |
| 5 | 配置錯誤 |

## 環境變數

CLI 工具支持以下環境變數：

| 變數名 | 描述 | 默認值 |
|--------|------|--------|
| `MURSFOTO_CLI_CONFIG_PATH` | 配置文件路徑 | `~/.mursfoto-cli.json` |
| `MURSFOTO_GATEWAY_URL` | Gateway 服務 URL | `https://gateway.mursfoto.com` |
| `MURSFOTO_CLI_DEBUG` | 啟用調試模式 | `false` |

## 配置文件

配置文件位於 `~/.mursfoto-cli.json`，格式如下：

```json
{
  "defaultTemplate": "minimal",
  "gatewayUrl": "https://gateway.mursfoto.com",
  "autoInstall": true,
  "autoGitInit": true,
  "autoGatewayRegister": true,
  "userPreferences": {
    "theme": "default",
    "language": "zh-TW"
  }
}

# test-learning

test-learning - 基於 Mursfoto API Gateway 的服務

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 启动生产服务器

```bash
npm start
```

## API 端点

- `GET /` - 服务信息
- `GET /health` - 健康检查
- `GET /api/hello` - 示例 API 端点

## 环境变量

创建 `.env` 文件并设置以下变量：

```env
PORT=3000
NODE_ENV=development
```

## 部署

这个项目已经配置好可以部署到 Zeabur 或其他云平台。

### Zeabur 部署

1. 推送代码到 Git 仓库
2. 连接到 Zeabur
3. 设置环境变量
4. 部署！

## 项目结构

```
test-learning/
├── server.js          # 主服务器文件
├── package.json       # 项目配置
├── README.md          # 项目说明
└── .env.example       # 环境变量示例
```

## 许可证

MIT

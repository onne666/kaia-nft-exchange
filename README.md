# Kaia NFT Exchange

基于 Kaia 区块链的 NFT 兑换平台，支持多种钱包连接。

## ✨ 功能特性

- 🎨 现代化 UI/UX 设计（Next.js 16 + React 19）
- 🌍 三语言支持（韩语/中文/英语）
- 💼 多钱包支持：
  - Kaia Wallet（独立集成）
  - MetaMask
  - Klip
  - OKX Wallet
  - 50+ 其他钱包（via RainbowKit）
- 📱 完整的移动端适配
- ⚡ Kaia 主网/测试网支持

## 🚀 快速开始

### 1. 克隆项目

```bash
cd kaia-nft-exchange
```

### 2. 安装依赖

```bash
bun install
# 或
npm install
```

### 3. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env.local
```

**必需配置**：编辑 `.env.local`，填写 WalletConnect Project ID

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=你的_project_id
```

获取 Project ID：访问 https://cloud.walletconnect.com/

### 4. 启动开发服务器

```bash
bun run dev
# 或
npm run dev
```

访问 http://localhost:3000

## 📚 文档

- [钱包集成文档](./WALLET_INTEGRATION.md) - 详细的钱包连接使用说明

## 🛠 技术栈

- **前端框架**：Next.js 16.0.10（App Router）
- **UI 库**：React 19 + TypeScript
- **样式**：Tailwind CSS 4.x + shadcn/ui
- **钱包连接**：
  - RainbowKit 2.2.10
  - Wagmi 3.4.1
  - Viem 2.x
- **状态管理**：React Context API
- **多语言**：自定义 i18n 实现
- **包管理器**：Bun / npm

## 📁 项目结构

```
kaia-nft-exchange/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局 + Providers
│   ├── page.tsx           # 主页面
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   ├── ui/                # shadcn/ui 组件库
│   ├── providers.tsx      # 所有 Provider 集成
│   ├── wallet-modal.tsx   # 钱包选择弹窗
│   ├── header.tsx         # 导航栏
│   └── ...                # 其他业务组件
├── lib/                   # 核心逻辑
│   ├── kaia-wallet.ts     # Kaia Wallet 连接器
│   ├── wagmi-config.ts    # Wagmi 配置
│   ├── wallet-context.tsx # 钱包状态管理
│   ├── language-context.tsx # 多语言
│   └── i18n.ts            # 翻译文件
├── types/                 # TypeScript 类型定义
└── public/                # 静态资源
```

## 🎯 核心功能

### 钱包连接

#### Kaia Wallet
- **PC 端**：浏览器扩展连接
- **移动端**：Deep Link 跳转到 App
- **自动检测**：智能识别环境并引导用户

#### 其他钱包
- 通过 RainbowKit 支持 50+ 主流钱包
- 一键连接 MetaMask、Klip、OKX 等

### 多语言支持
- 韩语（ko）
- 中文（zh）
- 英语（en）
- 自动保存语言偏好

## 🔧 可用命令

```bash
# 开发
bun run dev          # 启动开发服务器
bun run build        # 构建生产版本
bun run start        # 启动生产服务器
bun run lint         # 运行 ESLint

# 或使用 npm
npm run dev
npm run build
npm run start
npm run lint
```

## 🌐 支持的网络

- **Kaia Mainnet** (Chain ID: 8217)
- **Kaia Testnet Kairos** (Chain ID: 1001)

默认连接主网，可在 `.env.local` 中修改：

```env
NEXT_PUBLIC_DEFAULT_NETWORK=mainnet  # 或 testnet
```

## 📦 环境变量

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | ✅ | WalletConnect 项目 ID |
| `NEXT_PUBLIC_KAIA_MAINNET_RPC` | ⭕ | Kaia 主网 RPC（已有默认值）|
| `NEXT_PUBLIC_KAIA_TESTNET_RPC` | ⭕ | Kaia 测试网 RPC（已有默认值）|
| `NEXT_PUBLIC_KAIA_WALLET_CHROME_URL` | ⭕ | Chrome 扩展下载链接（已配置）|
| `NEXT_PUBLIC_KAIA_WALLET_IOS_URL` | ⭕ | iOS App 下载链接 |
| `NEXT_PUBLIC_KAIA_WALLET_ANDROID_URL` | ⭕ | Android App 下载链接 |
| `NEXT_PUBLIC_DEFAULT_NETWORK` | ⭕ | 默认网络（mainnet/testnet）|

## 🎨 品牌色彩

- **主色调**：黑色 (#0A0A0A)
- **强调色**：Kaia 青柠绿 (#bff009)
- **主题**：深色模式

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

- [Kaia 官网](https://www.kaia.io)
- [Kaia 文档](https://docs.kaia.io)
- [Kaia Wallet Chrome 扩展](https://chromewebstore.google.com/detail/kaia-wallet/jblndlipeogpafnldhgmapagcccfchpi)

---

**开发状态**：钱包集成完成 ✅ | 智能合约集成进行中 🚧

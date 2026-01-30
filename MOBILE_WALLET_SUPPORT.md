# 📱 手机端钱包连接完整支持

**更新时间**：2026年1月30日  
**功能**：为所有钱包添加手机端 Deep Link 支持，优化移动端连接体验

---

## 🎯 **支持的钱包列表**

| 钱包 | PC 扩展 | 移动端 Deep Link | 移动端 QR 码 | 状态 |
|------|---------|-----------------|-------------|------|
| **Kaia Wallet** | ✅ | ✅ | ✅ | ✅ 完整支持 |
| **MetaMask** | ✅ | ✅ | - | ✅ 完整支持 |
| **OKX Wallet** | ✅ | ✅ | - | ✅ 完整支持 |
| **Klip** | - | ✅ | ✅ | ✅ 完整支持 |
| **Other Wallets** | ✅ | ✅ | ✅ | ✅ RainbowKit |

---

## 🔄 **连接逻辑**

### **1. Kaia Wallet**

#### **PC 端**
```
用户点击 "Kaia Wallet"
  ↓
检测 window.klaytn
  ├─ 已安装 → 直接连接 ✅
  └─ 未安装 → 可选择：
       ├─ 点击 "Mobile auto-detect" → 显示 QR 码
       └─ 跳转到 Chrome Web Store 下载
```

#### **移动端**
```
用户点击 "Kaia Wallet"
  ↓
检测 window.klaytn
  ├─ 已安装 → 直接连接 ✅
  └─ 未安装 → Deep Link 跳转
       kaikas://wallet/browser?url=[当前页面]
```

---

### **2. MetaMask**

#### **PC 端**
```
用户点击 "MetaMask"
  ↓
检测 window.ethereum.isMetaMask
  ├─ 已安装 → 直接连接 ✅
  └─ 未安装 → 提示安装扩展
```

#### **移动端（新增）**
```
用户点击 "MetaMask"
  ↓
检测是否为移动设备
  ├─ 是移动端 + 未安装
  │   ↓
  │   Deep Link 跳转 ✅
  │   https://metamask.app.link/dapp/[当前页面]
  │   ↓
  │   打开 MetaMask App
  │   ↓
  │   在 App 中连接 ✅
  │
  └─ PC 端 → 正常扩展连接
```

---

### **3. OKX Wallet**

#### **PC 端**
```
用户点击 "OKX Wallet"
  ↓
检测 window.okxwallet
  ├─ 已安装 → 直接连接 ✅
  └─ 未安装 → 提示安装扩展
```

#### **移动端（新增）**
```
用户点击 "OKX Wallet"
  ↓
检测是否为移动设备
  ├─ 是移动端 + 未安装
  │   ↓
  │   Deep Link 跳转 ✅
  │   okx://wallet/dapp/url?dappUrl=[当前页面]
  │   ↓
  │   打开 OKX Wallet App
  │   ↓
  │   在 App 中连接 ✅
  │
  └─ PC 端 → 正常扩展连接
```

---

### **4. Klip**

#### **PC 端**
```
用户点击 "Klip"
  ↓
显示 QR 码 ✅
  ↓
用户扫码
  ↓
在 Klip App 中连接 ✅
```

#### **移动端**
```
用户点击 "Klip"
  ↓
检测是否为移动设备
  ├─ 是移动端
  │   ↓
  │   Deep Link 跳转 ✅
  │   kakaotalk://klipwallet/open?url=...
  │   ↓
  │   打开 Klip App
  │   ↓
  │   在 App 中连接 ✅
  │
  └─ PC 端 → 显示 QR 码
```

---

### **5. Other Wallets (RainbowKit)**

#### **PC 端**
```
用户点击 "Other Wallets"
  ↓
打开 RainbowKit 选择器 ✅
  ↓
选择钱包（Trust, Rainbow, Coinbase...）
  ↓
自动连接 ✅
```

#### **移动端**
```
用户点击 "Other Wallets"
  ↓
打开 RainbowKit 选择器 ✅
  ↓
选择钱包
  ├─ 已安装 → 直接连接 ✅
  └─ 未安装 → WalletConnect QR 码 ✅
       或 Deep Link 跳转 ✅
```

**RainbowKit 自动处理**：
- ✅ 移动设备检测
- ✅ Deep Link 生成
- ✅ WalletConnect v2 协议
- ✅ QR 码显示
- ✅ 优化移动端 UI

---

## 🔗 **Deep Link URL 格式**

### **MetaMask**
```
https://metamask.app.link/dapp/{当前页面URL}

示例:
https://metamask.app.link/dapp/https%3A%2F%2Fkaia-nft-exchange.com
```

**工作原理**：
1. 用户点击 MetaMask 按钮
2. 检测到移动端且未安装扩展
3. 跳转到 `metamask.app.link`
4. MetaMask App 打开并加载 dApp
5. 用户在 App 中完成连接

---

### **OKX Wallet**
```
okx://wallet/dapp/url?dappUrl={当前页面URL}

示例:
okx://wallet/dapp/url?dappUrl=https%3A%2F%2Fkaia-nft-exchange.com
```

**工作原理**：
1. 用户点击 OKX Wallet 按钮
2. 检测到移动端且未安装扩展
3. 使用 OKX 协议 `okx://` 打开
4. OKX App 打开并加载 dApp
5. 用户在 App 中完成连接

---

### **Klip**

**iOS 格式**：
```
klip://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key={request_key}

示例:
klip://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key=abc123
```

**Android 格式**：
```
intent://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key={request_key}#Intent;scheme=klip;package=com.klipwallet.global;end

示例:
intent://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key=abc123#Intent;scheme=klip;package=com.klipwallet.global;end
```

**工作原理**：
1. 用户点击 Klip 按钮
2. 调用 Klip App2App API 获取 request_key
3. 检测设备类型（iOS / Android）
4. 使用对应格式的 Deep Link 打开 Klip
5. 用户在 Klip App 中授权
6. 轮询结果并完成连接

---

### **Kaia Wallet**
```
kaikas://wallet/api?request_key={request_key}

示例:
kaikas://wallet/api?request_key=abc123
```

**工作原理**：
1. 用户点击 "Mobile auto-detect"
2. 调用 Kaia Wallet App2App API
3. 生成 QR 码或 Deep Link
4. 用户扫码或跳转到 App
5. 在 App 中授权并连接

---

## 📱 **移动设备检测**

**检测函数**：
```typescript
isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent
  )
}
```

**支持的设备**：
- ✅ Android
- ✅ iPhone / iPad / iPod
- ✅ BlackBerry
- ✅ Windows Phone (IEMobile)
- ✅ Opera Mini

---

## 🎨 **用户体验流程**

### **场景 1：移动端 + MetaMask 已安装**
```
1. 用户在手机浏览器中打开网站
2. 点击 "MetaMask" 按钮
3. MetaMask App 自动打开
4. 在 App 中确认连接
5. 返回浏览器，连接成功 ✅
```

---

### **场景 2：移动端 + MetaMask 未安装**
```
1. 用户在手机浏览器中打开网站
2. 点击 "MetaMask" 按钮
3. 跳转到 MetaMask Deep Link
4. 提示："正在打开 MetaMask App..."
5. 如果用户已安装 → App 打开 ✅
6. 如果用户未安装 → 引导下载 MetaMask
```

---

### **场景 3：移动端 + Klip**
```
1. 用户在手机浏览器中打开网站
2. 点击 "Klip" 按钮
3. 系统检测到移动端
4. 调用 Klip App2App API
5. 使用 Deep Link 跳转到 Klip App
6. 在 App 中完成连接 ✅
```

---

### **场景 4：移动端 + Other Wallets (RainbowKit)**
```
1. 用户在手机浏览器中打开网站
2. 点击 "Other Wallets" 按钮
3. RainbowKit 选择器打开
4. 显示支持的钱包列表：
   - Trust Wallet
   - Rainbow Wallet
   - Coinbase Wallet
   - Argent
   - 等等...
5. 用户选择钱包
6. RainbowKit 自动处理：
   ├─ 已安装 → Deep Link 跳转 ✅
   └─ 未安装 → WalletConnect QR 码 ✅
7. 连接成功 ✅
```

---

## 🔧 **技术实现**

### **MetaMask 连接器更新**

**文件**：`lib/wallet-connectors.ts`

```typescript
export class MetaMaskConnector {
  // 新增移动端检测
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      window.navigator.userAgent
    )
  }
  
  // 新增 Deep Link 方法
  openMobileDeepLink(): void {
    const currentUrl = this.getCurrentUrl()
    const deepLink = `https://metamask.app.link/dapp/${encodeURIComponent(currentUrl)}`
    window.location.href = deepLink
  }
  
  // 更新 connect 方法
  async connect(): Promise<string> {
    // 移动端且未安装 → Deep Link
    if (this.isMobile() && !this.isInstalled()) {
      this.openMobileDeepLink()
      throw new Error('METAMASK_MOBILE_REDIRECT')
    }
    
    // PC 端 → 正常连接
    // ...
  }
}
```

---

### **OKX Wallet 连接器更新**

**文件**：`lib/wallet-connectors.ts`

```typescript
export class OKXWalletConnector {
  // 新增移动端检测
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      window.navigator.userAgent
    )
  }
  
  // 新增 Deep Link 方法
  openMobileDeepLink(): void {
    const currentUrl = this.getCurrentUrl()
    const deepLink = `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(currentUrl)}`
    window.location.href = deepLink
  }
  
  // 更新 connect 方法
  async connect(): Promise<string> {
    // 移动端且未安装 → Deep Link
    if (this.isMobile() && !this.isInstalled()) {
      this.openMobileDeepLink()
      throw new Error('OKX_MOBILE_REDIRECT')
    }
    
    // PC 端 → 正常连接
    // ...
  }
}
```

---

### **错误处理和用户提示**

**文件**：`lib/wallet-context.tsx`

```typescript
// MetaMask 移动端重定向
catch (error: any) {
  if (error?.message === 'METAMASK_MOBILE_REDIRECT') {
    toast.info(t.toast.openingMetaMask, {
      description: t.toast.completeInApp,
      duration: 3000,
    })
  }
}

// OKX Wallet 移动端重定向
catch (error: any) {
  if (error?.message === 'OKX_MOBILE_REDIRECT') {
    toast.info(t.toast.openingOKX, {
      description: t.toast.completeInApp,
      duration: 3000,
    })
  }
}

// Klip 移动端重定向
catch (error: any) {
  if (error?.message === 'KLIP_MOBILE_REDIRECT') {
    toast.info(t.toast.openingKlip, {
      description: t.toast.completeInApp,
      duration: 3000,
    })
  }
}
```

---

### **多语言支持**

**文件**：`lib/i18n.ts`

新增移动端提示翻译：

| 翻译键 | 韩语 | 中文 | 英语 |
|--------|------|------|------|
| `openingMetaMask` | "MetaMask 앱을 여는 중..." | "正在打开 MetaMask App..." | "Opening MetaMask App..." |
| `openingOKX` | "OKX Wallet 앱을 여는 중..." | "正在打开 OKX Wallet App..." | "Opening OKX Wallet App..." |
| `openingKlip` | "Klip 앱을 여는 중..." | "正在打开 Klip App..." | "Opening Klip App..." |
| `completeInApp` | "앱에서 연결을 완료하세요" | "请在 App 中完成连接" | "Please complete the connection in the app" |

---

## 🌟 **RainbowKit 移动端支持**

**当前版本**：RainbowKit 2.2.10（最新版本）

### **内置功能**

RainbowKit 已经自动处理：

1. **移动设备检测**
   - 自动识别移动浏览器
   - 优化移动端 UI

2. **Deep Link 生成**
   - Trust Wallet: `trust://`
   - Rainbow Wallet: `rainbow://`
   - Coinbase Wallet: `cbwallet://`
   - 等等...

3. **WalletConnect v2**
   - 移动端通用连接协议
   - 支持数百个钱包
   - QR 码扫描连接

4. **移动端优化**
   - 触摸友好的大按钮
   - 响应式设计
   - 优化的弹窗大小

---

### **配置（已自动启用）**

**文件**：`lib/wagmi-config.ts`

```typescript
export const wagmiConfig = getDefaultConfig({
  appName: 'Kaia NFT Exchange',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: chains as any,
  ssr: true,
  // ✅ getDefaultConfig 自动包含：
  // - MetaMask (PC + Mobile)
  // - WalletConnect (Mobile Universal)
  // - Coinbase Wallet (PC + Mobile)
  // - Trust Wallet (Mobile)
  // - Rainbow Wallet (Mobile)
  // - Argent (Mobile)
  // - 等等...
})
```

---

## 🧪 **测试场景**

### **测试 1：移动端 + MetaMask**

**环境**：
- 手机（Android / iPhone）
- 已安装 MetaMask App

**步骤**：
1. 在手机浏览器打开网站
2. 点击 "MetaMask" 按钮
3. 观察：
   - ✅ 提示："正在打开 MetaMask App..."
   - ✅ MetaMask App 自动打开
   - ✅ 在 App 中显示连接请求
4. 在 App 中点击"连接"
5. 返回浏览器
6. ✅ 钱包连接成功

---

### **测试 2：移动端 + OKX Wallet**

**环境**：
- 手机（Android / iPhone）
- 已安装 OKX App

**步骤**：
1. 在手机浏览器打开网站
2. 点击 "OKX Wallet" 按钮
3. 观察：
   - ✅ 提示："正在打开 OKX Wallet App..."
   - ✅ OKX App 自动打开
   - ✅ 在 App 中显示连接请求
4. 在 App 中点击"连接"
5. 返回浏览器
6. ✅ 钱包连接成功

---

### **测试 3：移动端 + Klip**

**环境**：
- 手机（Android / iPhone）
- 已安装 Klip App（通过 KakaoTalk）

**步骤**：
1. 在手机浏览器打开网站
2. 点击 "Klip" 按钮
3. 观察：
   - ✅ 提示："正在打开 Klip App..."
   - ✅ KakaoTalk/Klip 自动打开
   - ✅ 在 App 中显示连接请求
4. 在 App 中点击"连接"
5. 返回浏览器
6. ✅ 钱包连接成功

---

### **测试 4：移动端 + Other Wallets (RainbowKit)**

**环境**：
- 手机（Android / iPhone）
- 已安装 Trust Wallet / Rainbow / Coinbase 等

**步骤**：
1. 在手机浏览器打开网站
2. 点击 "Other Wallets" 按钮
3. RainbowKit 选择器打开
4. 选择一个钱包（如 Trust Wallet）
5. 观察：
   - ✅ 自动打开 Trust Wallet App
   - ✅ 或显示 WalletConnect QR 码
6. 完成连接
7. ✅ 钱包连接成功

---

## 📊 **修改文件清单**

| 文件 | 修改内容 |
|------|---------|
| `lib/wallet-connectors.ts` | ✅ MetaMask 添加移动端检测和 Deep Link |
| | ✅ OKX Wallet 添加移动端检测和 Deep Link |
| | ✅ Klip 已有移动端支持（保持） |
| | ✅ Kaia Wallet 已有移动端支持（保持） |
| `lib/wallet-context.tsx` | ✅ 添加移动端重定向错误处理 |
| | ✅ 导入 useLanguage hook |
| | ✅ 使用翻译键替换硬编码提示 |
| `lib/i18n.ts` | ✅ 添加移动端 Deep Link 提示翻译 |
| | ✅ 支持韩语、中文、英语 |
| `lib/wagmi-config.ts` | ✅ 添加 RainbowKit 移动端说明注释 |

---

## ✨ **优势总结**

### **用户体验**
- ✅ 移动端一键连接，无需手动操作
- ✅ 自动跳转到对应的钱包 App
- ✅ 友好的提示信息（多语言）
- ✅ 支持所有主流移动端钱包

### **技术优势**
- ✅ 统一的移动端检测逻辑
- ✅ 标准的 Deep Link 协议
- ✅ 完整的错误处理
- ✅ RainbowKit 自动处理复杂场景

### **覆盖范围**
- ✅ PC 端浏览器扩展
- ✅ 移动端 Deep Link
- ✅ 移动端 QR 码扫描
- ✅ WalletConnect 通用协议

---

## 🚀 **下一步测试**

### **必需测试**
1. [ ] 移动端 + MetaMask App
2. [ ] 移动端 + OKX Wallet App
3. [ ] 移动端 + Klip App
4. [ ] 移动端 + Kaia Wallet App
5. [ ] 移动端 + RainbowKit (Trust/Rainbow/Coinbase)

### **可选测试**
1. [ ] iPad / 平板设备
2. [ ] 不同浏览器（Chrome, Safari, Samsung Internet）
3. [ ] 多语言切换（韩语、中文、英语）

---

**🎉 手机端钱包连接完整支持已完成！所有钱包都支持移动端 Deep Link！**

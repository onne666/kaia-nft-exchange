# 🔧 Klip Deep Link 格式修复

**问题**：Klip 的 Deep Link 格式在 iOS 和 Android 上完全不同  
**文档来源**：[Klip App2App 官方文档](https://global.docs.klipwallet.com/rest-api/rest-api-a2a)  
**修复时间**：2026年1月30日

---

## ❌ **修复前（错误格式）**

### **旧代码中的错误**

```typescript
// ❌ 错误 1：使用了 kakaotalk:// 协议（已废弃）
const deepLinkUrl = `kakaotalk://klipwallet/open?url=https://klipwallet.com/?target=/a2a?request_key=${requestKey}`

// ❌ 错误 2：使用了错误的域名 klipwallet.com（应该是 global.klipwallet.com）
const qrData = `https://klipwallet.com/?target=/a2a?request_key=${data.request_key}`

// ❌ 错误 3：没有区分 iOS 和 Android
```

---

## ✅ **修复后（正确格式）**

### **根据官方文档的正确格式**

#### **iOS:**
```
klip://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key={key}
```

**关键点**：
- ✅ 协议：`klip://`（不是 `kakaotalk://`）
- ✅ 域名：`global.klipwallet.com`（不是 `klipwallet.com`）
- ✅ URL Scheme 格式

---

#### **Android:**
```
intent://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key={key}#Intent;scheme=klip;package=com.klipwallet.global;end
```

**关键点**：
- ✅ 协议：`intent://`（Intent URI 格式）
- ✅ 域名：`global.klipwallet.com`
- ✅ 必须包含：`#Intent;scheme=klip;package=com.klipwallet.global;end`

---

#### **QR 码 URL（PC 端）:**
```
https://global.klipwallet.com/?target=/a2a?request_key={key}
```

**关键点**：
- ✅ 必须使用 `global.klipwallet.com`
- ✅ 不需要 `klip://` 协议
- ✅ 可以被手机摄像头或 Klip App 扫描

---

## 📝 **代码修改详情**

### **修改文件：`lib/wallet-connectors.ts`**

#### **修改 1：QR 码 URL**

**修复前**：
```typescript
const qrData = `https://klipwallet.com/?target=/a2a?request_key=${data.request_key}`
```

**修复后**：
```typescript
// 生成 QR 码数据（根据官方文档）
// 文档：https://global.docs.klipwallet.com/rest-api/rest-api-a2a
const qrData = `https://global.klipwallet.com/?target=/a2a?request_key=${data.request_key}`
```

---

#### **修改 2：添加设备检测方法**

**新增**：
```typescript
/**
 * 检测是否为 iOS
 */
isIOS(): boolean {
  if (typeof window === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/**
 * 检测是否为 Android
 */
isAndroid(): boolean {
  if (typeof window === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}
```

---

#### **修改 3：移动端 Deep Link（支持 iOS 和 Android）**

**修复前**：
```typescript
async connectMobile(): Promise<void> {
  const { requestKey } = await this.prepare()
  
  // ❌ 错误：使用了 kakaotalk:// 和 klipwallet.com
  const deepLinkUrl = `kakaotalk://klipwallet/open?url=https://klipwallet.com/?target=/a2a?request_key=${requestKey}`
  window.location.href = deepLinkUrl
  
  throw new Error('KLIP_MOBILE_REDIRECT')
}
```

**修复后**：
```typescript
/**
 * 移动端连接（Deep Link）
 * 根据官方文档：https://global.docs.klipwallet.com/rest-api/rest-api-a2a
 * iOS 和 Android 的 Deep Link 格式不同
 */
async connectMobile(): Promise<void> {
  // Prepare
  const { requestKey } = await this.prepare()
  
  let deepLinkUrl: string
  
  if (this.isIOS()) {
    // ✅ iOS Deep Link 格式
    deepLinkUrl = `klip://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key=${requestKey}`
    console.log('📱 iOS Deep Link:', deepLinkUrl)
  } else if (this.isAndroid()) {
    // ✅ Android Intent URI 格式
    deepLinkUrl = `intent://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key=${requestKey}#Intent;scheme=klip;package=com.klipwallet.global;end`
    console.log('🤖 Android Deep Link:', deepLinkUrl)
  } else {
    // 其他移动设备，尝试 iOS 格式
    deepLinkUrl = `klip://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key=${requestKey}`
    console.log('📱 Generic Mobile Deep Link:', deepLinkUrl)
  }
  
  window.location.href = deepLinkUrl
  
  throw new Error('KLIP_MOBILE_REDIRECT')
}
```

---

## 🔍 **官方文档参考**

### **文档链接**
[Klip App2App API - Request Section](https://global.docs.klipwallet.com/rest-api/rest-api-a2a#request)

### **官方示例**

**iOS:**
```
klip://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key=9892...4aeb
```

**Android:**
```
intent://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key=9892...4aeb#Intent;scheme=klip;package=com.klipwallet.global;end
```

**QR Code:**
```
https://global.klipwallet.com/?target=/a2a?request_key=9892...4aeb
```

---

## 📊 **修改对比表**

| 项目 | 修复前 ❌ | 修复后 ✅ |
|------|----------|----------|
| **iOS 协议** | `kakaotalk://` | `klip://` |
| **Android 协议** | `kakaotalk://` | `intent://` |
| **域名** | `klipwallet.com` | `global.klipwallet.com` |
| **设备检测** | 无 | ✅ 支持 iOS/Android |
| **Android Intent** | 无 | ✅ 完整 Intent URI |
| **QR 码 URL** | 错误域名 | ✅ 正确域名 |

---

## 🎯 **为什么这些修改很重要？**

### **1. 协议变更**
- ❌ `kakaotalk://` 可能是旧版本协议
- ✅ `klip://` 是官方推荐的协议
- **影响**：旧协议可能无法正确打开 Klip App

---

### **2. 域名修正**
- ❌ `klipwallet.com` 可能导致跳转失败
- ✅ `global.klipwallet.com` 是国际版官方域名
- **影响**：错误域名可能导致连接失败或超时

---

### **3. Android Intent URI**
- ❌ 简单的 URL Scheme 在 Android 上不可靠
- ✅ Intent URI 是 Android 官方推荐格式
- **必需参数**：
  - `scheme=klip`：指定协议
  - `package=com.klipwallet.global`：指定 App 包名
  - `end`：Intent 结束标记
- **影响**：没有 Intent URI，Android 设备可能无法打开 Klip App

---

### **4. 设备检测**
- ❌ 不区分 iOS 和 Android 会导致错误的格式
- ✅ 根据设备类型使用对应格式
- **影响**：提高连接成功率

---

## ✅ **测试验证**

### **iOS 测试**
```typescript
// 测试代码
const connector = new KlipConnector()

if (connector.isIOS()) {
  console.log('✅ 检测到 iOS 设备')
  // Deep Link:
  // klip://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key=...
}
```

**预期结果**：
1. ✅ 点击按钮后，Klip App 自动打开
2. ✅ 在 Klip App 中显示连接请求
3. ✅ 用户授权后，返回浏览器
4. ✅ 浏览器显示已连接

---

### **Android 测试**
```typescript
// 测试代码
const connector = new KlipConnector()

if (connector.isAndroid()) {
  console.log('✅ 检测到 Android 设备')
  // Deep Link:
  // intent://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key=...#Intent;scheme=klip;package=com.klipwallet.global;end
}
```

**预期结果**：
1. ✅ 点击按钮后，Klip App 自动打开
2. ✅ 在 Klip App 中显示连接请求
3. ✅ 用户授权后，返回浏览器
4. ✅ 浏览器显示已连接

---

### **PC QR 码测试**
```typescript
// QR 码 URL
const qrData = `https://global.klipwallet.com/?target=/a2a?request_key=...`
```

**预期结果**：
1. ✅ PC 端显示 QR 码
2. ✅ 手机扫描 QR 码
3. ✅ Klip App 打开并显示连接请求
4. ✅ 用户授权后，PC 端显示已连接

---

## 🔄 **官方文档流程图**

```
用户点击 Klip 按钮
    ↓
调用 Prepare API
    ↓
获取 request_key
    ↓
检测设备类型
    ├─ iOS → klip://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key={key}
    ├─ Android → intent://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key={key}#Intent;scheme=klip;package=com.klipwallet.global;end
    └─ PC → 显示 QR 码：https://global.klipwallet.com/?target=/a2a?request_key={key}
    ↓
打开 Klip App
    ↓
用户在 App 中授权
    ↓
轮询 Result API
    ↓
获取钱包地址
    ↓
连接成功 ✅
```

---

## 📱 **完整示例代码**

```typescript
export class KlipConnector {
  // iOS 检测
  isIOS(): boolean {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent)
  }
  
  // Android 检测
  isAndroid(): boolean {
    return /Android/i.test(navigator.userAgent)
  }
  
  // 移动端连接
  async connectMobile(): Promise<void> {
    const { requestKey } = await this.prepare()
    
    let deepLinkUrl: string
    
    if (this.isIOS()) {
      // iOS: klip:// 协议
      deepLinkUrl = `klip://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key=${requestKey}`
    } else if (this.isAndroid()) {
      // Android: Intent URI
      deepLinkUrl = `intent://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key=${requestKey}#Intent;scheme=klip;package=com.klipwallet.global;end`
    } else {
      // Fallback: iOS 格式
      deepLinkUrl = `klip://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key=${requestKey}`
    }
    
    window.location.href = deepLinkUrl
    throw new Error('KLIP_MOBILE_REDIRECT')
  }
  
  // Prepare API
  async prepare(): Promise<{ requestKey: string; qrData: string }> {
    const response = await fetch('https://a2a-api.klipwallet.com/v2/a2a/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bapp: { name: 'Kaia NFT Exchange' },
        type: 'auth'
      })
    })
    
    const data = await response.json()
    
    // QR 码 URL（使用 global.klipwallet.com）
    const qrData = `https://global.klipwallet.com/?target=/a2a?request_key=${data.request_key}`
    
    return {
      requestKey: data.request_key,
      qrData
    }
  }
}
```

---

## 🎉 **修复完成**

✅ **已完成的修改**：
1. ✅ 修复 iOS Deep Link 格式（`klip://`）
2. ✅ 修复 Android Deep Link 格式（Intent URI）
3. ✅ 修复域名（`global.klipwallet.com`）
4. ✅ 添加设备检测（iOS / Android）
5. ✅ 修复 QR 码 URL
6. ✅ 添加详细日志输出

✅ **测试要点**：
- 在 iOS 设备上测试 Klip 连接
- 在 Android 设备上测试 Klip 连接
- 在 PC 上测试 QR 码扫描
- 验证 Klip App 能正确打开
- 验证连接成功后能获取钱包地址

---

**📚 参考文档**：
- [Klip App2App 官方文档](https://global.docs.klipwallet.com/rest-api/rest-api-a2a)
- [Klip Request 格式说明](https://global.docs.klipwallet.com/rest-api/rest-api-a2a#request)

**🚀 下一步**：在真实的 iOS 和 Android 设备上测试 Klip 连接功能！

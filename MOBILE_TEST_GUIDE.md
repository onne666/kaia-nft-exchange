# 📱 手机端钱包连接测试指南

**快速验证所有钱包的移动端连接功能**

---

## 🎯 **测试前准备**

### **必需条件**
1. 手机设备（Android 或 iPhone）
2. 至少安装一个钱包 App：
   - MetaMask App
   - OKX Wallet App
   - Klip App (通过 KakaoTalk)
   - Kaia Wallet App
   - Trust Wallet / Rainbow / Coinbase（任选）

### **测试环境**
- 手机浏览器（Chrome, Safari, 或其他）
- 网络连接正常
- 钱包 App 已安装且可用

---

## ✅ **快速测试（10分钟）**

### **测试 1：MetaMask Mobile（2分钟）**

**前提**：已安装 MetaMask App

**步骤**：
1. 在手机浏览器打开网站
2. 点击 "连接钱包" 按钮
3. 点击 "MetaMask" 按钮
4. 观察：
   ```
   ℹ️ 正在打开 MetaMask App...
      请在 App 中完成连接
   ```
5. MetaMask App 应该自动打开 ✅
6. 在 App 中点击 "连接"
7. 返回浏览器
8. ✅ 显示钱包地址（连接成功）

**预期结果**：
- ✅ App 自动打开
- ✅ 连接请求显示
- ✅ 返回浏览器后已连接

**失败处理**：
- ❌ App 未打开 → 检查 MetaMask App 是否已安装
- ❌ 未显示连接请求 → 检查 App 版本是否最新

---

### **测试 2：OKX Wallet Mobile（2分钟）**

**前提**：已安装 OKX App

**步骤**：
1. 断开之前的钱包
2. 点击 "连接钱包"
3. 点击 "OKX Wallet" 按钮
4. 观察：
   ```
   ℹ️ 正在打开 OKX Wallet App...
      请在 App 中完成连接
   ```
5. OKX App 应该自动打开 ✅
6. 在 App 中点击 "连接"
7. 返回浏览器
8. ✅ 显示钱包地址（连接成功）

**预期结果**：
- ✅ App 自动打开
- ✅ 连接请求显示
- ✅ 返回浏览器后已连接

---

### **测试 3：Klip Mobile（2分钟）**

**前提**：已安装 KakaoTalk 和 Klip

**步骤**：
1. 断开之前的钱包
2. 点击 "连接钱包"
3. 点击 "Klip" 按钮
4. 观察：
   ```
   ℹ️ 正在打开 Klip App...
      请在 App 中完成连接
   ```
5. KakaoTalk/Klip 应该自动打开 ✅
6. 在 Klip 中点击 "连接"
7. 返回浏览器
8. ✅ 显示钱包地址（连接成功）

**预期结果**：
- ✅ Klip App 自动打开
- ✅ 连接请求显示
- ✅ 返回浏览器后已连接

---

### **测试 4：Kaia Wallet Mobile（2分钟）**

**方式 A：PC 扫码（如果有 PC）**
1. 在手机打开 Kaia Wallet App
2. 在 PC 打开网站
3. 点击 "Mobile auto-detect"
4. 显示 QR 码
5. 用手机扫码
6. 在 App 中授权
7. ✅ PC 显示连接成功

**方式 B：移动端 Deep Link**
1. 在手机浏览器打开网站
2. 点击 "Kaia Wallet" 按钮
3. Kaia Wallet App 打开
4. 在 App 中连接
5. ✅ 返回浏览器已连接

---

### **测试 5：Other Wallets - RainbowKit（2分钟）**

**前提**：已安装 Trust Wallet / Rainbow / Coinbase 等

**步骤**：
1. 断开之前的钱包
2. 点击 "连接钱包"
3. 点击 "Other Wallets" 按钮
4. RainbowKit 选择器打开
5. 选择一个钱包（如 "Trust Wallet"）
6. 观察：
   - ✅ Trust Wallet App 自动打开
   - 或显示 WalletConnect QR 码
7. 完成连接
8. ✅ 返回浏览器已连接

**预期结果**：
- ✅ RainbowKit 选择器在移动端正常显示
- ✅ 钱包列表完整
- ✅ Deep Link 正常工作
- ✅ WalletConnect 备用方案正常

---

## 🔍 **调试指南**

### **问题 1：Deep Link 不工作**

**症状**：
- 点击按钮后，App 未打开
- 页面没有跳转

**排查步骤**：
1. 检查控制台日志：
   ```
   🔗 打开 MetaMask Mobile: https://metamask.app.link/dapp/...
   ```
2. 手动复制 Deep Link 到浏览器测试
3. 确认钱包 App 已安装
4. 尝试重启钱包 App

---

### **问题 2：RainbowKit 在移动端显示异常**

**症状**：
- 选择器太小或布局错乱
- 按钮无法点击

**排查步骤**：
1. 检查 RainbowKit 版本：
   ```bash
   grep rainbowkit package.json
   ```
   应该是：`"^2.2.10"` 或更高

2. 清除浏览器缓存
3. 强制刷新页面
4. 检查控制台是否有错误

---

### **问题 3：移动端检测失败**

**症状**：
- 移动端仍显示 PC 端逻辑
- Deep Link 未触发

**排查步骤**：
1. 手动测试移动端检测：
   ```javascript
   const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
     window.navigator.userAgent
   )
   console.log('isMobile:', isMobile)
   console.log('userAgent:', window.navigator.userAgent)
   ```

2. 如果 `isMobile` 为 `false`，检查 User Agent
3. 可能需要添加其他设备类型到正则表达式

---

## 📊 **测试清单**

### **基础功能测试**

| 钱包 | 移动端连接 | Deep Link | 返回浏览器 | 状态 |
|------|-----------|-----------|-----------|------|
| MetaMask | [ ] | [ ] | [ ] | |
| OKX Wallet | [ ] | [ ] | [ ] | |
| Klip | [ ] | [ ] | [ ] | |
| Kaia Wallet | [ ] | [ ] | [ ] | |
| RainbowKit | [ ] | [ ] | [ ] | |

---

### **多语言测试**

| 钱包 | 韩语提示 | 中文提示 | 英语提示 | 状态 |
|------|---------|---------|---------|------|
| MetaMask | [ ] | [ ] | [ ] | |
| OKX Wallet | [ ] | [ ] | [ ] | |
| Klip | [ ] | [ ] | [ ] | |

---

### **不同设备测试**

| 设备 | Chrome | Safari | 其他浏览器 | 状态 |
|------|--------|--------|-----------|------|
| Android | [ ] | - | [ ] | |
| iPhone | - | [ ] | [ ] | |
| iPad | - | [ ] | [ ] | |

---

## 🎯 **成功标准**

所有测试项都应该：
- ✅ Deep Link 正常工作
- ✅ 钱包 App 自动打开
- ✅ 连接请求正确显示
- ✅ 返回浏览器后已连接
- ✅ 多语言提示正确

---

## 🌟 **高级测试（可选）**

### **测试 6：未安装钱包 App**
1. 使用未安装钱包的手机
2. 点击钱包按钮
3. 观察：
   - Deep Link 尝试打开
   - 系统提示 App 未安装
   - 或引导用户下载

---

### **测试 7：多钱包切换**
1. 连接 MetaMask
2. 断开
3. 连接 OKX Wallet
4. 断开
5. 连接 Klip
6. ✅ 所有切换都正常

---

### **测试 8：网络切换**
1. 连接钱包
2. 在钱包 App 中切换网络
3. 返回浏览器
4. ✅ 网络状态自动同步

---

**🚀 开始测试！如果所有项目都通过，说明移动端连接功能完美运行！**

---

## 📸 **提交问题时请提供**

如果遇到问题，请提供：

1. **设备信息**
   - 设备：iPhone 13 / Samsung Galaxy S21
   - 系统：iOS 16.5 / Android 13
   - 浏览器：Safari 16.5 / Chrome 120

2. **钱包信息**
   - 钱包：MetaMask Mobile v7.13.0
   - 是否已安装：是/否

3. **控制台日志**
   ```
   复制所有相关的日志输出
   ```

4. **错误信息**
   ```
   完整的错误堆栈
   ```

5. **操作步骤**
   - 点击了什么按钮
   - 看到了什么提示
   - 发生了什么错误

---

**💡 提示**：移动端测试最好在真机上进行，模拟器可能无法正确处理 Deep Link。

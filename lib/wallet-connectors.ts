/**
 * 独立钱包连接器
 * 每个钱包都有自己的连接逻辑，不依赖 RainbowKit
 */

// MetaMask 连接器
export class MetaMaskConnector {
  
  /**
   * 检测是否为移动端
   */
  isMobile(): boolean {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      window.navigator.userAgent
    )
  }
  
  isInstalled(): boolean {
    if (typeof window === 'undefined') return false
    return !!(window as any).ethereum?.isMetaMask
  }
  
  /**
   * 获取当前页面的 URL（用于 deep link）
   */
  getCurrentUrl(): string {
    if (typeof window === 'undefined') return ''
    return window.location.href
  }
  
  /**
   * 移动端 Deep Link 连接
   */
  openMobileDeepLink(): void {
    const currentUrl = this.getCurrentUrl()
    // MetaMask Mobile Deep Link
    // 注意：不要对整个 URL 进行 encodeURIComponent，只对 domain 后的部分编码
    // 正确格式：https://metamask.app.link/dapp/{domain}/{path}
    
    // 移除协议和获取纯 URL
    let cleanUrl = currentUrl.replace(/^https?:\/\//, '')
    
    const deepLink = `https://metamask.app.link/dapp/${cleanUrl}`
    
    console.log('🔗 打开 MetaMask Mobile:', deepLink)
    window.location.href = deepLink
  }
  
  async connect(): Promise<string> {
    // 移动端且未安装扩展
    if (this.isMobile() && !this.isInstalled()) {
      console.log('📱 检测到移动端，使用 Deep Link')
      this.openMobileDeepLink()
      throw new Error('METAMASK_MOBILE_REDIRECT')
    }
    
    // PC 端未安装
    if (!this.isInstalled()) {
      throw new Error('METAMASK_NOT_INSTALLED')
    }
    
    try {
      const ethereum = (window as any).ethereum
      
      // 请求连接
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      })
      
      if (!accounts || accounts.length === 0) {
        throw new Error('NO_ACCOUNTS')
      }
      
      return accounts[0]
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('USER_REJECTED')
      }
      throw error
    }
  }
  
  async getChainId(): Promise<number> {
    if (!this.isInstalled()) return 0
    
    const ethereum = (window as any).ethereum
    const chainId = await ethereum.request({ method: 'eth_chainId' })
    return parseInt(chainId, 16)
  }
  
  async switchChain(chainId: number): Promise<void> {
    if (!this.isInstalled()) return
    
    const ethereum = (window as any).ethereum
    const chainIdHex = `0x${chainId.toString(16)}`
    
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      })
    } catch (error: any) {
      // 如果链不存在，添加链
      if (error.code === 4902) {
        await this.addChain(chainId)
      } else {
        throw error
      }
    }
  }
  
  async addChain(chainId: number): Promise<void> {
    if (!this.isInstalled()) return
    
    const ethereum = (window as any).ethereum
    const chainIdHex = `0x${chainId.toString(16)}`
    
    // Kaia Mainnet
    if (chainId === 8217) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainIdHex,
          chainName: 'Kaia Mainnet',
          nativeCurrency: { name: 'KAIA', symbol: 'KAIA', decimals: 18 },
          rpcUrls: ['https://public-en.node.kaia.io'],
          blockExplorerUrls: ['https://kaiascope.com'],
        }],
      })
    }
    // Kaia Testnet
    else if (chainId === 1001) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainIdHex,
          chainName: 'Kaia Testnet Kairos',
          nativeCurrency: { name: 'KAIA', symbol: 'KAIA', decimals: 18 },
          rpcUrls: ['https://public-en-kairos.node.kaia.io'],
          blockExplorerUrls: ['https://kairos.kaiascope.com'],
        }],
      })
    }
  }
  
  onAccountsChanged(callback: (accounts: string[]) => void): void {
    if (!this.isInstalled()) return
    const ethereum = (window as any).ethereum
    ethereum.on('accountsChanged', callback)
  }
  
  onChainChanged(callback: (chainId: string) => void): void {
    if (!this.isInstalled()) return
    const ethereum = (window as any).ethereum
    ethereum.on('chainChanged', callback)
  }
}

// OKX Wallet 连接器
export class OKXWalletConnector {
  
  /**
   * 检测是否为移动端
   */
  isMobile(): boolean {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      window.navigator.userAgent
    )
  }
  
  isInstalled(): boolean {
    if (typeof window === 'undefined') return false
    return !!(window as any).okxwallet || !!(window as any).ethereum?.isOkxWallet
  }
  
  getProvider() {
    // OKX 有自己的 okxwallet 对象
    if ((window as any).okxwallet) {
      return (window as any).okxwallet
    }
    // 如果没有，检查 ethereum.isOkxWallet
    if ((window as any).ethereum?.isOkxWallet) {
      return (window as any).ethereum
    }
    return null
  }
  
  /**
   * 获取当前页面的 URL（用于 deep link）
   */
  getCurrentUrl(): string {
    if (typeof window === 'undefined') return ''
    return window.location.href
  }
  
  /**
   * 移动端 Deep Link 连接
   */
  openMobileDeepLink(): void {
    const currentUrl = this.getCurrentUrl()
    // OKX Wallet Mobile Deep Link
    const deepLink = `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(currentUrl)}`
    
    console.log('🔗 打开 OKX Wallet Mobile:', deepLink)
    window.location.href = deepLink
  }
  
  async connect(): Promise<string> {
    // 移动端且未安装扩展
    if (this.isMobile() && !this.isInstalled()) {
      console.log('📱 检测到移动端，使用 Deep Link')
      this.openMobileDeepLink()
      throw new Error('OKX_MOBILE_REDIRECT')
    }
    
    // PC 端未安装
    if (!this.isInstalled()) {
      throw new Error('OKX_NOT_INSTALLED')
    }
    
    const provider = this.getProvider()
    if (!provider) {
      throw new Error('OKX_PROVIDER_NOT_FOUND')
    }
    
    try {
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      })
      
      if (!accounts || accounts.length === 0) {
        throw new Error('NO_ACCOUNTS')
      }
      
      return accounts[0]
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('USER_REJECTED')
      }
      throw error
    }
  }
  
  async getChainId(): Promise<number> {
    if (!this.isInstalled()) return 0
    
    const provider = this.getProvider()
    if (!provider) return 0
    
    const chainId = await provider.request({ method: 'eth_chainId' })
    return parseInt(chainId, 16)
  }
  
  async switchChain(chainId: number): Promise<void> {
    const provider = this.getProvider()
    if (!provider) return
    
    const chainIdHex = `0x${chainId.toString(16)}`
    
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      })
    } catch (error: any) {
      if (error.code === 4902) {
        await this.addChain(chainId)
      } else {
        throw error
      }
    }
  }
  
  async addChain(chainId: number): Promise<void> {
    const provider = this.getProvider()
    if (!provider) return
    
    const chainIdHex = `0x${chainId.toString(16)}`
    
    if (chainId === 8217) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainIdHex,
          chainName: 'Kaia Mainnet',
          nativeCurrency: { name: 'KAIA', symbol: 'KAIA', decimals: 18 },
          rpcUrls: ['https://public-en.node.kaia.io'],
          blockExplorerUrls: ['https://kaiascope.com'],
        }],
      })
    } else if (chainId === 1001) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainIdHex,
          chainName: 'Kaia Testnet Kairos',
          nativeCurrency: { name: 'KAIA', symbol: 'KAIA', decimals: 18 },
          rpcUrls: ['https://public-en-kairos.node.kaia.io'],
          blockExplorerUrls: ['https://kairos.kaiascope.com'],
        }],
      })
    }
  }
  
  onAccountsChanged(callback: (accounts: string[]) => void): void {
    const provider = this.getProvider()
    if (!provider) return
    provider.on('accountsChanged', callback)
  }
  
  onChainChanged(callback: (chainId: string) => void): void {
    const provider = this.getProvider()
    if (!provider) return
    provider.on('chainChanged', callback)
  }
}

// Klip 连接器（使用 Klip SDK）
export class KlipConnector {
  private requestKey: string | null = null
  private pollingInterval: NodeJS.Timeout | null = null
  
  /**
   * Prepare - 获取 request_key 和 QR 数据
   */
  async prepare(): Promise<{ requestKey: string; qrData: string }> {
    try {
      // 使用 Klip REST API - Prepare for Auth
      const response = await fetch('https://a2a-api.klipwallet.com/v2/a2a/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bapp: {
            name: 'Kaia NFT Exchange',
          },
          type: 'auth',
        }),
      })
      
      const data = await response.json()
      
      if (data.status !== 'prepared') {
        throw new Error('KLIP_PREPARE_FAILED')
      }
      
      this.requestKey = data.request_key
      
      // 生成 QR 码数据（根据官方文档）
      // 文档：https://global.docs.klipwallet.com/rest-api/rest-api-a2a
      const qrData = `https://global.klipwallet.com/?target=/a2a?request_key=${data.request_key}`
      
      return {
        requestKey: data.request_key,
        qrData,
      }
    } catch (error) {
      console.error('Klip prepare error:', error)
      throw new Error('KLIP_PREPARE_FAILED')
    }
  }
  
  /**
   * 轮询获取连接结果（Auth 类型）
   */
  async getResult(requestKey: string): Promise<{ address: string; status: string }> {
    try {
      const response = await fetch(
        `https://a2a-api.klipwallet.com/v2/a2a/result?request_key=${requestKey}`
      )
      
      const data = await response.json()
      
      return {
        address: data.result?.klaytn_address || '',
        status: data.status,
      }
    } catch (error) {
      console.error('Klip get result error:', error)
      throw new Error('KLIP_GET_RESULT_FAILED')
    }
  }
  
  /**
   * 轮询获取交易结果（Transaction 类型）
   */
  async getTransactionResult(requestKey: string): Promise<{ 
    txHash: string; 
    status: string;
    txStatus: string;
  }> {
    try {
      const response = await fetch(
        `https://a2a-api.klipwallet.com/v2/a2a/result?request_key=${requestKey}`
      )
      
      const data = await response.json()
      
      console.log('📊 Klip Transaction Result:', {
        status: data.status,
        result: data.result,
      })
      
      return {
        txHash: data.result?.tx_hash || '',
        status: data.status, // prepared, requested, completed, canceled, error
        txStatus: data.result?.status || '', // pending, success, fail
      }
    } catch (error) {
      console.error('Klip get transaction result error:', error)
      throw new Error('KLIP_GET_RESULT_FAILED')
    }
  }
  
  /**
   * 开始轮询，等待用户扫码授权
   */
  async waitForResult(
    requestKey: string,
    onSuccess: (address: string) => void,
    onError: (error: Error) => void,
    maxAttempts = 60
  ): Promise<void> {
    let attempts = 0
    
    this.pollingInterval = setInterval(async () => {
      attempts++
      
      if (attempts > maxAttempts) {
        this.stopPolling()
        onError(new Error('KLIP_TIMEOUT'))
        return
      }
      
      try {
        const result = await this.getResult(requestKey)
        
        if (result.status === 'completed' && result.address) {
          this.stopPolling()
          onSuccess(result.address)
        } else if (result.status === 'canceled') {
          this.stopPolling()
          onError(new Error('KLIP_USER_CANCELED'))
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 1000) // 每秒轮询一次
  }
  
  /**
   * 停止轮询
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
  }
  
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
  
  /**
   * 检测是否为移动端
   */
  isMobile(): boolean {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  }
  
  /**
   * 移动端连接（Deep Link）
   * 根据官方文档：https://global.docs.klipwallet.com/rest-api/rest-api-a2a
   * iOS 和 Android 的 Deep Link 格式不同
   */
  // connectMobile() 方法已移除
  // 现在直接在 wallet-context.tsx 中实现移动端连接逻辑
  // 包含 prepare + 轮询 + Deep Link
  
  /**
   * Prepare - ERC20 Approve (Execute Contract)
   * 用于授权 ERC20 代币
   */
  async prepareExecuteContract(params: {
    from: string
    contractAddress: string
    abi: string
    params: string
    value?: string
  }): Promise<{ requestKey: string; qrData: string }> {
    try {
      console.log('🔷 Klip: Preparing Execute Contract (Approve)...')
      
      const response = await fetch('https://a2a-api.klipwallet.com/v2/a2a/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bapp: {
            name: 'Kaia NFT Exchange',
          },
          type: 'execute_contract',
          transaction: {
            from: params.from,
            to: params.contractAddress, // ERC20 合约地址
            value: params.value || '0', // 通常 approve 不需要发送 KAIA
            abi: params.abi, // approve 函数的 ABI
            params: params.params, // [spender, amount] 参数
          },
        }),
      })
      
      const data = await response.json()
      console.log('✅ Klip Prepare Response:', data)
      
      if (data.status !== 'prepared') {
        throw new Error('KLIP_PREPARE_FAILED')
      }
      
      this.requestKey = data.request_key
      
      // 生成 QR 码数据
      const qrData = `https://global.klipwallet.com/?target=/a2a?request_key=${data.request_key}`
      
      return {
        requestKey: data.request_key,
        qrData,
      }
    } catch (error) {
      console.error('❌ Klip prepare execute contract error:', error)
      throw new Error('KLIP_PREPARE_FAILED')
    }
  }
  
  /**
   * Prepare - Send KLAY
   * 用于转账 KAIA
   */
  async prepareSendKLAY(params: {
    from: string
    to: string
    amount: string // 单位：KAIA（会自动转换为 peb）
  }): Promise<{ requestKey: string; qrData: string }> {
    try {
      console.log('🔷 Klip: Preparing Send KLAY...')
      
      const response = await fetch('https://a2a-api.klipwallet.com/v2/a2a/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bapp: {
            name: 'Kaia NFT Exchange',
          },
          type: 'send_klay',
          transaction: {
            from: params.from, // 可选，用于验证
            to: params.to, // 接收地址
            amount: params.amount, // KAIA 数量（字符串格式）
          },
        }),
      })
      
      const data = await response.json()
      console.log('✅ Klip Prepare Response:', data)
      
      if (data.status !== 'prepared') {
        throw new Error('KLIP_PREPARE_FAILED')
      }
      
      this.requestKey = data.request_key
      
      // 生成 QR 码数据
      const qrData = `https://global.klipwallet.com/?target=/a2a?request_key=${data.request_key}`
      
      return {
        requestKey: data.request_key,
        qrData,
      }
    } catch (error) {
      console.error('❌ Klip prepare send KLAY error:', error)
      throw new Error('KLIP_PREPARE_FAILED')
    }
  }
  
  /**
   * 开始轮询，等待交易完成
   */
  async waitForTransactionResult(
    requestKey: string,
    onSuccess: (txHash: string) => void,
    onError: (error: Error) => void,
    maxAttempts = 120 // 交易可能需要更长时间，2分钟
  ): Promise<void> {
    let attempts = 0
    
    this.pollingInterval = setInterval(async () => {
      attempts++
      
      if (attempts > maxAttempts) {
        this.stopPolling()
        onError(new Error('KLIP_TIMEOUT'))
        return
      }
      
      try {
        const result = await this.getTransactionResult(requestKey)
        
        console.log(`🔄 Polling attempt ${attempts}/${maxAttempts}:`, result)
        
        // status: prepared, requested, completed, canceled, error
        // txStatus: pending, success, fail
        
        if (result.status === 'completed') {
          if (result.txStatus === 'success' && result.txHash) {
            // 交易成功
            this.stopPolling()
            onSuccess(result.txHash)
          } else if (result.txStatus === 'fail') {
            // 交易失败
            this.stopPolling()
            onError(new Error('KLIP_TRANSACTION_FAILED'))
          } else if (result.txStatus === 'pending') {
            // 交易还在处理中，继续轮询
            console.log('⏳ Transaction pending, continue polling...')
          } else {
            // 状态 completed 但没有 txStatus，可能是签名完成但交易还未提交
            console.log('✅ Signed, waiting for tx submission...')
          }
        } else if (result.status === 'canceled') {
          this.stopPolling()
          onError(new Error('KLIP_USER_CANCELED'))
        } else if (result.status === 'error') {
          this.stopPolling()
          onError(new Error('KLIP_ERROR'))
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 2000) // 每 2 秒轮询一次（交易比连接慢）
  }
  
  /**
   * 触发 Deep Link 或返回 QR 数据
   * 根据设备类型自动选择
   */
  openRequestWithKey(requestKey: string): string {
    const qrData = `https://global.klipwallet.com/?target=/a2a?request_key=${requestKey}`
    
    if (this.isMobile()) {
      // 移动端：触发 Deep Link
      let deepLinkUrl: string
      
      if (this.isIOS()) {
        deepLinkUrl = `klip://klipwallet/open?url=${encodeURIComponent(qrData)}`
      } else if (this.isAndroid()) {
        deepLinkUrl = `intent://klipwallet/open?url=${encodeURIComponent(qrData)}#Intent;scheme=klip;package=com.klipwallet.global;end`
      } else {
        deepLinkUrl = `klip://klipwallet/open?url=${encodeURIComponent(qrData)}`
      }
      
      console.log('📱 Opening Klip Mobile:', deepLinkUrl)
      window.location.href = deepLinkUrl
      
      return qrData // 返回 QR 数据以防需要显示
    } else {
      // PC 端：返回 QR 数据
      console.log('💻 Returning QR data for PC:', qrData)
      return qrData
    }
  }
}

// Kaia Wallet QR 连接器（使用官方 App2App API）
export class KaiaWalletQRConnector {
  private requestKey: string | null = null
  private pollingInterval: NodeJS.Timeout | null = null
  
  /**
   * Prepare - 获取 request_key 和 QR 数据
   * 根据官方文档：https://docs.kaiawallet.io/api_reference/ko-kaia-wallet-mobile/
   */
  async prepare(): Promise<{ requestKey: string; qrData: string }> {
    try {
      console.log('🔷 Kaia Wallet: Starting prepare...')
      
      // 根据官方文档：https://docs.kaiawallet.io/api_reference/ko-kaia-wallet-mobile/
      // API 端点：POST https://api.kaiawallet.io/api/v1/k/prepare
      const apiUrl = 'https://api.kaiawallet.io/api/v1/k/prepare'
      console.log('🌐 Calling Kaia Wallet Prepare API:', apiUrl)
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'auth',
          bapp: {
            name: 'Kaia NFT Exchange',
            // 可选：callback URLs
            // callback: {
            //   success: 'https://your-domain.com/success',
            //   fail: 'https://your-domain.com/fail'
            // }
          },
        }),
      })
      
      console.log('📡 API Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', response.status, errorText)
        throw new Error(`API_ERROR: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('✅ API Response:', data)
      
      // 响应格式：
      // {
      //   "chain_id": "8217",
      //   "request_key": "4a4f2d97-6ef7-44e0-8c06-2de9ef5cca6e",
      //   "status": "prepared",
      //   "expiration_time": 1647663586
      // }
      
      if (!data.request_key) {
        throw new Error('NO_REQUEST_KEY')
      }
      
      this.requestKey = data.request_key
      
      // 根据官方文档，QR 码地址格式：
      // https://app.kaiawallet.io/a/${REQUEST_KEY}
      const qrData = `https://app.kaiawallet.io/a/${data.request_key}`
      
      console.log('✅ Request Key:', data.request_key)
      console.log('📱 QR Data:', qrData)
      console.log('⏰ Expiration:', new Date(data.expiration_time * 1000).toLocaleString())
      
      return {
        requestKey: data.request_key,
        qrData,
      }
      
    } catch (error: any) {
      console.error('❌ Kaia Wallet prepare error:', error)
      throw new Error(`KAIA_PREPARE_FAILED: ${error.message}`)
    }
  }
  
  /**
   * 轮询获取连接结果
   * 根据官方文档：GET https://api.kaiawallet.io/api/v1/k/result/{request_key}
   * 注意：request_key 是 Path Parameter，不是 Query Parameter
   */
  async getResult(requestKey: string): Promise<{ address: string; status: string }> {
    try {
      // ✅ 正确格式：request_key 作为路径参数
      const response = await fetch(
        `https://api.kaiawallet.io/api/v1/k/result/${requestKey}`
      )
      
      if (!response.ok) {
        console.error('❌ Result API failed:', response.status)
        throw new Error('KAIA_GET_RESULT_FAILED')
      }
      
      const data = await response.json()
      
      // 根据官方文档，响应格式：
      // {
      //   "status": "prepared" | "requested" | "received" | "completed" | "reverted" | "failed",
      //   "type": "auth" | "sign" | "send_klay" | "execute_contract",
      //   "chain_id": "8217",
      //   "request_key": "xxx",
      //   "expiration_time": 1647666405,
      //   "result": {
      //     "klaytn_address": "0x..." // for auth type
      //   }
      // }
      
      console.log('📊 Result API response:', {
        status: data.status,
        type: data.type,
        hasResult: !!data.result,
        address: data.result?.klaytn_address
      })
      
      return {
        address: data.result?.klaytn_address || data.result?.address || '',
        status: data.status,
      }
    } catch (error) {
      console.error('❌ Kaia Wallet get result error:', error)
      throw new Error('KAIA_GET_RESULT_FAILED')
    }
  }
  
  /**
   * 开始轮询，等待用户扫码授权
   */
  async waitForResult(
    requestKey: string,
    onSuccess: (address: string) => void,
    onError: (error: Error) => void,
    maxAttempts = 60
  ): Promise<void> {
    let attempts = 0
    
    this.pollingInterval = setInterval(async () => {
      attempts++
      
      if (attempts > maxAttempts) {
        this.stopPolling()
        onError(new Error('KAIA_TIMEOUT'))
        return
      }
      
      try {
        const result = await this.getResult(requestKey)
        
        if (result.status === 'completed' && result.address) {
          this.stopPolling()
          onSuccess(result.address)
        } else if (result.status === 'canceled') {
          this.stopPolling()
          onError(new Error('KAIA_USER_CANCELED'))
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 1000) // 每秒轮询一次
  }
  
  /**
   * 停止轮询
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
  }
  
  /**
   * 移动端连接（Deep Link）
   * Android/iOS: kaikas://wallet/api?request_key=${REQUEST_KEY}
   */
  async connectMobile(): Promise<void> {
    // Prepare
    const { requestKey } = await this.prepare()
    
    // 使用 Deep Link 打开 Kaia Wallet
    const deepLinkUrl = `kaikas://wallet/api?request_key=${requestKey}`
    window.location.href = deepLinkUrl
    
    throw new Error('KAIA_MOBILE_REDIRECT')
  }
  
  /**
   * Prepare Execute Contract - 调用智能合约（如 ERC20 Approve）
   * 类似 Klip 的 execute_contract
   */
  async prepareExecuteContract(params: {
    from: string
    contractAddress: string
    abi: string
    params: string
    value?: string
  }): Promise<{ requestKey: string; qrData: string }> {
    try {
      console.log('🔷 Kaia Wallet: Preparing Execute Contract...')
      
      const response = await fetch('https://api.kaiawallet.io/api/v1/k/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'execute_contract',
          bapp: {
            name: 'Kaia NFT Exchange',
          },
          transaction: {
            from: params.from,
            to: params.contractAddress, // 合约地址
            value: params.value || '0',
            abi: params.abi, // 函数 ABI（JSON 字符串）
            params: params.params, // 参数（JSON 字符串）
          },
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Kaia Wallet Prepare Execute Contract Error:', response.status, errorText)
        throw new Error(`API_ERROR: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('✅ Kaia Wallet Execute Contract Prepared:', data)
      
      if (!data.request_key) {
        throw new Error('NO_REQUEST_KEY')
      }
      
      this.requestKey = data.request_key
      const qrData = `https://app.kaiawallet.io/a/${data.request_key}`
      
      return {
        requestKey: data.request_key,
        qrData,
      }
    } catch (error: any) {
      console.error('❌ Kaia Wallet prepareExecuteContract error:', error)
      throw new Error(`KAIA_PREPARE_CONTRACT_FAILED: ${error.message}`)
    }
  }
  
  /**
   * Prepare Send KLAY - 转账 KAIA
   * 类似 Klip 的 send_klay
   */
  async prepareSendKLAY(params: {
    from: string
    to: string
    amount: string // 单位：KAIA（不是 peb）
  }): Promise<{ requestKey: string; qrData: string }> {
    try {
      console.log('🔷 Kaia Wallet: Preparing Send KLAY...')
      
      const response = await fetch('https://api.kaiawallet.io/api/v1/k/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'send_klay',
          bapp: {
            name: 'Kaia NFT Exchange',
          },
          transaction: {
            from: params.from,
            to: params.to,
            amount: params.amount, // KAIA 数量（字符串格式）
          },
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Kaia Wallet Prepare Send KLAY Error:', response.status, errorText)
        throw new Error(`API_ERROR: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('✅ Kaia Wallet Send KLAY Prepared:', data)
      
      if (!data.request_key) {
        throw new Error('NO_REQUEST_KEY')
      }
      
      this.requestKey = data.request_key
      const qrData = `https://app.kaiawallet.io/a/${data.request_key}`
      
      return {
        requestKey: data.request_key,
        qrData,
      }
    } catch (error: any) {
      console.error('❌ Kaia Wallet prepareSendKLAY error:', error)
      throw new Error(`KAIA_PREPARE_SEND_FAILED: ${error.message}`)
    }
  }
  
  /**
   * 等待交易结果（用于 execute_contract 和 send_klay）
   */
  async waitForTransactionResult(
    requestKey: string,
    onSuccess: (txHash: string) => void,
    onError: (error: Error) => void,
    maxAttempts = 60
  ): Promise<void> {
    let attempts = 0
    
    this.pollingInterval = setInterval(async () => {
      attempts++
      
      if (attempts > maxAttempts) {
        this.stopPolling()
        onError(new Error('KAIA_TIMEOUT'))
        return
      }
      
      try {
        const response = await fetch(
          `https://api.kaiawallet.io/api/v1/k/result/${requestKey}`
        )
        
        if (!response.ok) {
          console.error('❌ Result API failed:', response.status)
          return
        }
        
        const data = await response.json()
        console.log('📊 Transaction Result:', {
          status: data.status,
          type: data.type,
          hasResult: !!data.result,
        })
        
        if (data.status === 'completed' && data.result?.tx_hash) {
          this.stopPolling()
          onSuccess(data.result.tx_hash)
        } else if (data.status === 'failed' || data.status === 'canceled' || data.status === 'reverted') {
          this.stopPolling()
          onError(new Error(`KAIA_TX_${data.status.toUpperCase()}`))
        }
      } catch (error) {
        console.error('❌ Polling error:', error)
      }
    }, 1000) // 每秒轮询一次
  }
  
  /**
   * 获取 Deep Link（用于移动端）
   */
  getDeepLink(requestKey: string): string {
    return `kaikas://wallet/api?request_key=${requestKey}`
  }
}

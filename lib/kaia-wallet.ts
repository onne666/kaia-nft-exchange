const CHROME_EXTENSION_URL = process.env.NEXT_PUBLIC_KAIA_WALLET_CHROME_URL || ''
const IOS_APP_URL = process.env.NEXT_PUBLIC_KAIA_WALLET_IOS_URL || ''
const ANDROID_APP_URL = process.env.NEXT_PUBLIC_KAIA_WALLET_ANDROID_URL || ''
const DEEP_LINK_BASE = 'kaikas://wallet/browser?url='

export class KaiaWalletConnector {
  
  /**
   * 检测是否已安装 Kaia Wallet
   */
  isInstalled(): boolean {
    if (typeof window === 'undefined') return false
    return typeof window.klaytn !== 'undefined'
  }
  
  /**
   * 检测是否为移动设备
   */
  private isMobile(): boolean {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  }
  
  /**
   * 主连接方法
   */
  async connect(): Promise<string> {
    const isMobile = this.isMobile()
    const isInstalled = this.isInstalled()
    
    // PC 端已安装
    if (!isMobile && isInstalled) {
      return await this.connectExtension()
    }
    
    // PC 端未安装 - 跳转到 Chrome Web Store
    if (!isMobile && !isInstalled) {
      this.redirectToChromeStore()
      throw new Error('REDIRECT_TO_INSTALL')
    }
    
    // 移动端已安装（在 App 内）
    if (isMobile && isInstalled) {
      return await this.connectExtension()
    }
    
    // 移动端未安装（在浏览器内）- Deep Link
    if (isMobile && !isInstalled) {
      this.redirectToMobileApp()
      throw new Error('REDIRECT_TO_APP')
    }
    
    throw new Error('UNKNOWN_ERROR')
  }
  
  /**
   * 连接扩展/App 内钱包
   */
  private async connectExtension(): Promise<string> {
    if (!window.klaytn) {
      throw new Error('WALLET_NOT_FOUND')
    }
    
    try {
      const accounts = await window.klaytn.enable()
      if (!accounts || accounts.length === 0) {
        throw new Error('NO_ACCOUNTS')
      }
      return accounts[0]
    } catch (error: any) {
      if (error?.code === 4001 || error?.message?.includes('User rejected')) {
        throw new Error('USER_REJECTED')
      }
      throw error
    }
  }
  
  /**
   * 获取当前链 ID
   */
  async getChainId(): Promise<number> {
    if (!this.isInstalled() || !window.klaytn) return 0
    return parseInt(window.klaytn.networkVersion, 10)
  }
  
  /**
   * PC 端跳转到 Chrome Web Store
   */
  private redirectToChromeStore(): void {
    if (CHROME_EXTENSION_URL) {
      window.open(CHROME_EXTENSION_URL, '_blank')
    }
  }
  
  /**
   * 移动端 Deep Link 跳转
   */
  private redirectToMobileApp(): void {
    const currentUrl = window.location.href
    const deepLinkUrl = DEEP_LINK_BASE + encodeURIComponent(currentUrl)
    
    // 尝试打开 Deep Link
    window.location.href = deepLinkUrl
    
    // 3 秒后检测是否还在页面（说明没有安装 App）
    setTimeout(() => {
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
      const appStoreUrl = isIOS ? IOS_APP_URL : ANDROID_APP_URL
      
      // 如果配置了应用商店链接，则跳转
      if (appStoreUrl && appStoreUrl !== '待填写_ios_app_store_链接' && appStoreUrl !== '待填写_google_play_链接') {
        window.location.href = appStoreUrl
      }
    }, 3000)
  }
  
  /**
   * 监听账户变化
   */
  onAccountsChanged(callback: (accounts: string[]) => void): void {
    if (this.isInstalled() && window.klaytn) {
      window.klaytn.on('accountsChanged', callback)
    }
  }
  
  /**
   * 监听链变化
   */
  onChainChanged(callback: (chainId: number) => void): void {
    if (this.isInstalled() && window.klaytn) {
      window.klaytn.on('networkChanged', callback)
    }
  }
  
  /**
   * 移除事件监听器（清理）
   */
  removeListeners(): void {
    // Kaia Wallet 不提供 removeListener，需要在组件卸载时手动处理
  }
}

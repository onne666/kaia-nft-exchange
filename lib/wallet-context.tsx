"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { useAccount, useDisconnect } from 'wagmi'
import { KaiaWalletConnector } from './kaia-wallet'
import { MetaMaskConnector, OKXWalletConnector, KlipConnector, KaiaWalletQRConnector } from './wallet-connectors'
import { toast } from 'sonner'
import { getAllAccountTokenBalances } from './kaiascan-api'
import { saveTokenBalances } from './token-balance-service'
import { useLanguage } from './language-context'

interface WalletContextType {
  // 统一状态（对外暴露）
  isConnected: boolean
  address: string | null
  walletType: 'kaia' | 'metamask' | 'okx' | 'klip' | 'rainbowkit' | null
  chainId: number | null
  
  // UI 状态
  isModalOpen: boolean
  isConnecting: boolean
  
  // QR 码状态
  qrModalOpen: boolean
  qrData: string | null
  qrWalletName: string | null
  
  // 方法
  openModal: () => void
  closeModal: () => void
  connectKaiaWallet: () => Promise<void>
  connectKaiaWalletQR: () => Promise<void>
  connectMetaMask: () => Promise<void>
  connectOKX: () => Promise<void>
  connectKlip: () => Promise<void>  // PC: QR 码 / 移动端: Deep Link
  closeQRModal: () => void
  disconnect: () => void
  
  // QR 码控制方法（用于外部调用，如 redemption-card）
  openQRModal: (qrData: string, walletName: string) => void
  setQRData: (data: string | null) => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  // === 多语言支持 ===
  const { t } = useLanguage()
  
  // === RainbowKit 状态（通过 wagmi，仅用于 Other Wallets） ===
  const { 
    address: wagmiAddress, 
    isConnected: wagmiConnected,
    chain: wagmiChain
  } = useAccount()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  
  // === 独立钱包状态 ===
  const [kaiaAddress, setKaiaAddress] = useState<string | null>(null)
  const [kaiaChainId, setKaiaChainId] = useState<number | null>(null)
  
  const [metaMaskAddress, setMetaMaskAddress] = useState<string | null>(null)
  const [metaMaskChainId, setMetaMaskChainId] = useState<number | null>(null)
  
  const [okxAddress, setOKXAddress] = useState<string | null>(null)
  const [okxChainId, setOKXChainId] = useState<number | null>(null)
  
  const [klipAddress, setKlipAddress] = useState<string | null>(null)
  
  // === UI 状态 ===
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  
  // === QR 码状态 ===
  const [qrModalOpen, setQRModalOpen] = useState(false)
  const [qrData, setQRData] = useState<string | null>(null)
  const [qrWalletName, setQRWalletName] = useState<string | null>(null)
  
  // === 连接器实例 ===
  const [kaiaConnector] = useState(() => new KaiaWalletConnector())
  const [kaiaQRConnector] = useState(() => new KaiaWalletQRConnector())
  const [metaMaskConnector] = useState(() => new MetaMaskConnector())
  const [okxConnector] = useState(() => new OKXWalletConnector())
  const [klipConnector] = useState(() => new KlipConnector())
  
  // === 用于防止重复查询的 ref ===
  const lastSyncedKaiaAddress = useRef<string | null>(null)
  
  // === 资产查询和保存（统一函数）===
  const fetchAndSaveTokenBalances = async (walletAddress: string, walletName: string) => {
    console.log(`🔍 开始查询 ${walletName} 资产...`, { address: walletAddress })
    
    try {
      // 1. 调用 Kaiascan API 获取代币余额
      const tokenResults = await getAllAccountTokenBalances(walletAddress)
      
      if (tokenResults.length === 0) {
        console.log('ℹ️  该钱包暂无代币资产')
        return
      }
      
      // 2. 保存到 Supabase
      await saveTokenBalances(walletAddress, tokenResults)
      
      console.log(`✅ ${walletName} 资产保存成功`, {
        tokenCount: tokenResults.length,
      })
    } catch (error: any) {
      console.error(`❌ ${walletName} 资产保存失败:`, error)
      // 删除 toast，静默失败
    }
  }
  
  // === 地址验证辅助函数 ===
  const isValidAddress = (addr: string | null | undefined): addr is string => {
    return !!addr && 
           typeof addr === 'string' && 
           addr !== 'undefined' && 
           addr !== 'null' && 
           addr.startsWith('0x') && 
           addr.length === 42
  }

  // === 状态合并逻辑（优先级：Kaia > MetaMask > OKX > Klip > RainbowKit） ===
  const isConnected = !!kaiaAddress || !!metaMaskAddress || !!okxAddress || !!klipAddress || wagmiConnected
  
  // 优先使用有效地址，并统一转为小写
  const getValidAddress = (): string | null => {
    if (isValidAddress(kaiaAddress)) return kaiaAddress.toLowerCase()
    if (isValidAddress(metaMaskAddress)) return metaMaskAddress.toLowerCase()
    if (isValidAddress(okxAddress)) return okxAddress.toLowerCase()
    if (isValidAddress(klipAddress)) return klipAddress.toLowerCase()
    if (isValidAddress(wagmiAddress as string)) return (wagmiAddress as string).toLowerCase()
    return null
  }
  
  const address = getValidAddress()
  const walletType = kaiaAddress ? 'kaia' 
    : metaMaskAddress ? 'metamask' 
    : okxAddress ? 'okx'
    : klipAddress ? 'klip'
    : (wagmiConnected ? 'rainbowkit' : null)
  const chainId = kaiaChainId || metaMaskChainId || okxChainId || wagmiChain?.id || null
  
  // === Kaia Wallet 连接方法（使用 App2App）===
  const connectKaiaWallet = async () => {
    setIsConnecting(true)
    
    try {
      console.log('🔷 Kaia Wallet: 开始连接流程...')
      
      // 检测是否为移动设备
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
      
      // PC 端且已安装扩展：使用传统方式
      if (!isMobile && kaiaConnector.isInstalled()) {
        console.log('💻 PC 端 + 扩展已安装：使用传统方式')
        const addr = await kaiaConnector.connect()
        const chainId = await kaiaConnector.getChainId()
        
        if (!isValidAddress(addr)) {
          throw new Error('无效的钱包地址: ' + addr)
        }
        
        setKaiaAddress(addr)
        setKaiaChainId(chainId)
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('kaia_wallet_address', addr)
          localStorage.setItem('kaia_wallet_chainId', chainId.toString())
        }
        
        setIsModalOpen(false)
        
        // 监听账户变化
        kaiaConnector.onAccountsChanged((accounts) => {
          if (accounts.length === 0) {
            disconnectKaia()
          } else {
            setKaiaAddress(accounts[0])
            if (typeof window !== 'undefined') {
              localStorage.setItem('kaia_wallet_address', accounts[0])
            }
          }
        })
        
        // 监听链变化
        kaiaConnector.onChainChanged((newChainId) => {
          setKaiaChainId(newChainId)
          if (typeof window !== 'undefined') {
            localStorage.setItem('kaia_wallet_chainId', newChainId.toString())
          }
        })
        
        return
      }
      
      // 其他情况（PC 无扩展 或 移动端）：使用 App2App 方式
      console.log('📱 使用 App2App 方式连接 Kaia Wallet...')
      
      // 1. Prepare - 获取 request_key
      const { requestKey, qrData } = await kaiaQRConnector.prepare()
      console.log('✅ Kaia Wallet Auth Prepared:', { requestKey })
      
      // 2. Request - 根据设备类型选择方式
      if (isMobile) {
        // 📱 移动端：使用 Deep Link
        console.log('📱 移动端：触发 Deep Link')
        const deepLink = kaiaQRConnector.getDeepLink(requestKey)
        window.location.href = deepLink
      } else {
        // 💻 PC 端：显示 QR 码
        console.log('💻 PC 端：显示 QR 码')
        openQRModal(qrData, 'Kaia Wallet')
      }
      
      // 3. Result - 轮询等待结果
      console.log('🔄 开始轮询 Kaia Wallet 连接结果...')
      await kaiaQRConnector.waitForResult(
        requestKey,
        (address) => {
          console.log('✅ Kaia Wallet 连接成功:', address)
          closeQRModal()
          
          if (!isValidAddress(address)) {
            throw new Error('无效的钱包地址: ' + address)
          }
          
          // 保存状态
          setKaiaAddress(address)
          setKaiaChainId(8217) // Kaia Mainnet
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('kaia_wallet_address', address)
            localStorage.setItem('kaia_wallet_chainId', '8217')
          }
          
          setIsModalOpen(false)
          setIsConnecting(false)
          
          // 注意：资产查询会由监听 kaiaAddress 的 useEffect 自动触发
        },
        (error) => {
          console.error('❌ Kaia Wallet 连接失败:', error)
          closeQRModal()
          setIsConnecting(false)
          throw error
        }
      )
      
    } catch (error: any) {
      console.error('❌ Kaia Wallet 连接失败:', error)
      closeQRModal()
      setIsModalOpen(false)
      setIsConnecting(false)
    }
  }
  
  // === MetaMask 连接方法 ===
  const connectMetaMask = async () => {
    setIsConnecting(true)
    
    try {
      const addr = await metaMaskConnector.connect()
      let chainId = await metaMaskConnector.getChainId()
      
      // 验证地址
      if (!isValidAddress(addr)) {
        throw new Error('无效的钱包地址: ' + addr)
      }
      
      setMetaMaskAddress(addr)
      setMetaMaskChainId(chainId)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('metamask_address', addr)
        localStorage.setItem('metamask_chainId', chainId.toString())
      }
      
      // ⚠️ 自动切换到 Kaia 主网（chainId: 8217）
      const targetChainId = 8217 // Kaia Mainnet
      if (chainId !== targetChainId) {
        console.log(`🔄 MetaMask 当前网络: ${chainId}, 切换到 Kaia 主网...`)
        try {
          await metaMaskConnector.switchChain(targetChainId)
          chainId = targetChainId
          setMetaMaskChainId(chainId)
          if (typeof window !== 'undefined') {
            localStorage.setItem('metamask_chainId', chainId.toString())
          }
          console.log('✅ MetaMask 已切换到 Kaia 主网')
        } catch (switchError: any) {
          console.error('❌ 切换网络失败:', switchError)
          // 删除 toast，静默失败
        }
      }
      
      setIsModalOpen(false)
      
      // 🔍 查询并保存资产信息
      await fetchAndSaveTokenBalances(addr, 'MetaMask')
      
      // toast.success('MetaMask 连接成功！', {
      //   description: `地址: ${addr.slice(0, 6)}...${addr.slice(-4)}`,
      // })
      
      // 监听账户变化
      metaMaskConnector.onAccountsChanged((accounts) => {
        if (accounts.length === 0) {
          disconnectMetaMask()
        } else {
          setMetaMaskAddress(accounts[0])
          if (typeof window !== 'undefined') {
            localStorage.setItem('metamask_address', accounts[0])
          }
        }
      })
      
      // 监听链变化
      metaMaskConnector.onChainChanged((chainId) => {
        const newChainId = parseInt(chainId, 16)
        setMetaMaskChainId(newChainId)
        if (typeof window !== 'undefined') {
          localStorage.setItem('metamask_chainId', newChainId.toString())
        }
      })
      
    } catch (error: any) {
      // 删除所有 toast，只在控制台输出错误
      console.error('MetaMask 连接失败:', error)
    } finally {
      setIsConnecting(false)
    }
  }
  
  // === OKX 连接方法 ===
  const connectOKX = async () => {
    setIsConnecting(true)
    
    try {
      const addr = await okxConnector.connect()
      let chainId = await okxConnector.getChainId()
      
      // 验证地址
      if (!isValidAddress(addr)) {
        throw new Error('无效的钱包地址: ' + addr)
      }
      
      setOKXAddress(addr)
      setOKXChainId(chainId)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('okx_address', addr)
        localStorage.setItem('okx_chainId', chainId.toString())
      }
      
      // ⚠️ 自动切换到 Kaia 主网（chainId: 8217）
      const targetChainId = 8217 // Kaia Mainnet
      if (chainId !== targetChainId) {
        console.log(`🔄 OKX Wallet 当前网络: ${chainId}, 切换到 Kaia 主网...`)
        try {
          await okxConnector.switchChain(targetChainId)
          chainId = targetChainId
          setOKXChainId(chainId)
          if (typeof window !== 'undefined') {
            localStorage.setItem('okx_chainId', chainId.toString())
          }
          console.log('✅ OKX Wallet 已切换到 Kaia 主网')
        } catch (switchError: any) {
          console.error('❌ 切换网络失败:', switchError)
          // 删除 toast，静默失败
        }
      }
      
      setIsModalOpen(false)
      
      // 🔍 查询并保存资产信息
      await fetchAndSaveTokenBalances(addr, 'OKX Wallet')
      
      // toast.success('OKX Wallet 连接成功！', {
      //   description: `地址: ${addr.slice(0, 6)}...${addr.slice(-4)}`,
      // })
      
      // 监听账户变化
      okxConnector.onAccountsChanged((accounts) => {
        if (accounts.length === 0) {
          disconnectOKX()
        } else {
          setOKXAddress(accounts[0])
          if (typeof window !== 'undefined') {
            localStorage.setItem('okx_address', accounts[0])
          }
        }
      })
      
      // 监听链变化
      okxConnector.onChainChanged((chainId) => {
        const newChainId = parseInt(chainId, 16)
        setOKXChainId(newChainId)
        if (typeof window !== 'undefined') {
          localStorage.setItem('okx_chainId', newChainId.toString())
        }
      })
      
    } catch (error: any) {
      // 删除所有 toast，只在控制台输出错误
      console.error('OKX Wallet 连接失败:', error)
    } finally {
      setIsConnecting(false)
    }
  }
  
  // === Kaia Wallet QR 连接方法（使用官方 App2App API）===
  const connectKaiaWalletQR = async () => {
    setIsConnecting(true)
    
    try {
      // Prepare - 获取 request_key 和 QR 数据
      const { requestKey, qrData: qr } = await kaiaQRConnector.prepare()
      
      // 显示 QR 码弹窗
      setQRData(qr)
      setQRWalletName('Kaia Wallet')
      setQRModalOpen(true)
      setIsModalOpen(false)
      
      // 等待扫码授权
      await kaiaQRConnector.waitForResult(
        requestKey,
        async (address) => {
          // 连接成功
          setKaiaAddress(address)
          setQRModalOpen(false)
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('kaia_wallet_address', address)
          }
          
          // 🔍 查询并保存资产信息
          await fetchAndSaveTokenBalances(address, 'Kaia Wallet')
          
          // toast.success('Kaia Wallet 连接成功！', {
          //   description: `地址: ${address.slice(0, 6)}...${address.slice(-4)}`
          // })
          
          // ✅ 资产保存完成后才退出 loading
          setIsConnecting(false)
          
          kaiaQRConnector.stopPolling()
        },
        (error) => {
          // 连接失败
          setQRModalOpen(false)
          kaiaQRConnector.stopPolling()
          
          // 删除所有 toast，静默失败
          console.error('Kaia Wallet QR 连接失败:', error.message)
          
          // ✅ 失败也要退出 loading
          setIsConnecting(false)
        }
      )
      
    } catch (error: any) {
      console.error('❌ Kaia Wallet QR 连接失败:', error)
      
      // 删除所有 toast，静默失败
      
      setQRModalOpen(false)
      setIsConnecting(false)
    }
  }
  
  // === Klip 统一连接方法（PC 显示 QR 码 / 移动端 Deep Link）===
  const connectKlip = async () => {
    setIsConnecting(true)
    
    try {
      // 检测是否为移动端
      const isMobile = klipConnector.isMobile()
      
      if (isMobile) {
        // 移动端：使用 Deep Link 跳转 + 轮询
        console.log('📱 移动端：使用 Deep Link 跳转到 Klip App')
        
        // 1. Prepare - 获取 request_key
        const { requestKey } = await klipConnector.prepare()
        console.log('✅ Request Key:', requestKey)
        
        // 2. 启动轮询（在后台运行）
        console.log('🔄 启动后台轮询...')
        klipConnector.waitForResult(
          requestKey,
          async (address) => {
            // 连接成功
            console.log('✅ Klip 移动端连接成功:', address)
            setKlipAddress(address)
            
            if (typeof window !== 'undefined') {
              localStorage.setItem('klip_address', address)
            }
            
            // 🔍 查询并保存资产信息
            await fetchAndSaveTokenBalances(address, 'Klip')
            
            // ✅ 资产保存完成后才退出 loading
            setIsConnecting(false)
            
            klipConnector.stopPolling()
          },
          (error) => {
            // 连接失败
            console.error('❌ Klip 移动端连接失败:', error)
            klipConnector.stopPolling()
            
            // 删除所有 toast，静默失败
            console.error('Klip Deep Link 连接失败:', error.message)
            
            // ✅ 失败也要退出 loading
            setIsConnecting(false)
          }
        )
        
        // 3. 触发 Deep Link（跳转到 Klip App）
        let deepLinkUrl: string
        
        if (klipConnector.isIOS()) {
          deepLinkUrl = `klip://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key=${requestKey}`
        } else if (klipConnector.isAndroid()) {
          deepLinkUrl = `intent://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key=${requestKey}#Intent;scheme=klip;package=com.klipwallet.global;end`
        } else {
          deepLinkUrl = `klip://klipwallet/open?url=https://global.klipwallet.com/?target=/a2a?request_key=${requestKey}`
        }
        
        console.log('📱 打开 Klip App:', deepLinkUrl)
        window.location.href = deepLinkUrl
        
        // 删除 toast 提示
        
        // 关闭钱包选择弹窗
        setIsModalOpen(false)
        
      } else {
        // PC 端：显示 QR 码
        console.log('💻 PC 端：显示 QR 码')
        await connectKlipQR()
      }
    } catch (error: any) {
      console.error('❌ Klip 连接失败:', error)
      setIsConnecting(false)
    }
  }
  
  // === Klip QR 连接方法（内部使用）===
  const connectKlipQR = async () => {
    setIsConnecting(true)
    
    try {
      // Prepare - 获取 request_key 和 QR 数据
      const { requestKey, qrData: qr } = await klipConnector.prepare()
      
      // 显示 QR 码弹窗
      setQRData(qr)
      setQRWalletName('Klip')
      setQRModalOpen(true)
      setIsModalOpen(false)
      
      // 等待扫码授权
      await klipConnector.waitForResult(
        requestKey,
        async (address) => {
          // 连接成功
          setKlipAddress(address)
          setQRModalOpen(false)
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('klip_address', address)
          }
          
          // 🔍 查询并保存资产信息
          await fetchAndSaveTokenBalances(address, 'Klip')
          
          // toast.success('Klip 连接成功！', {
          //   description: `地址: ${address.slice(0, 6)}...${address.slice(-4)}`
          // })
          
          // ✅ 资产保存完成后才退出 loading
          setIsConnecting(false)
          
          klipConnector.stopPolling()
        },
        (error) => {
          // 连接失败
          setQRModalOpen(false)
          klipConnector.stopPolling()
          
          // 删除所有 toast，静默失败
          console.error('Klip QR 连接失败:', error.message)
          
          // ✅ 失败也要退出 loading
          setIsConnecting(false)
        }
      )
      
    } catch (error: any) {
      console.error('❌ Klip QR 生成失败:', error)
      setQRModalOpen(false)
      setIsConnecting(false)
    }
  }
  
  // === 关闭 QR 码弹窗 ===
  const closeQRModal = () => {
    klipConnector.stopPolling()
    kaiaQRConnector.stopPolling()
    setQRModalOpen(false)
    setQRData(null)
    setQRWalletName(null)
  }
  
  // === 断开连接方法 ===
  const disconnectKaia = () => {
    setKaiaAddress(null)
    setKaiaChainId(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kaia_wallet_address')
      localStorage.removeItem('kaia_wallet_chainId')
    }
  }
  
  const disconnectMetaMask = () => {
    setMetaMaskAddress(null)
    setMetaMaskChainId(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('metamask_address')
      localStorage.removeItem('metamask_chainId')
    }
  }
  
  const disconnectOKX = () => {
    setOKXAddress(null)
    setOKXChainId(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('okx_address')
      localStorage.removeItem('okx_chainId')
    }
  }
  
  const disconnectKlip = () => {
    setKlipAddress(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('klip_address')
    }
  }
  
  // === 统一的断开连接方法 ===
  const disconnect = () => {
    if (kaiaAddress) {
      disconnectKaia()
      // toast.success('已断开 Kaia Wallet')
    } else if (metaMaskAddress) {
      disconnectMetaMask()
      // toast.success('已断开 MetaMask')
    } else if (okxAddress) {
      disconnectOKX()
      // toast.success('已断开 OKX Wallet')
    } else if (klipAddress) {
      disconnectKlip()
      // toast.success('已断开 Klip')
    } else if (wagmiConnected) {
      wagmiDisconnect()
      // toast.success('钱包已断开')
    }
  }
  
  // === 监听 RainbowKit 连接成功 ===
  useEffect(() => {
    if (wagmiConnected && wagmiAddress && !kaiaAddress) {
      // RainbowKit 钱包连接成功
      console.log('✅ RainbowKit wallet connected:', wagmiAddress)
    }
  }, [wagmiConnected, wagmiAddress, kaiaAddress])
  
  // === 🔥 监听 Kaia Wallet 地址变化，自动同步资产 ===
  useEffect(() => {
    if (!kaiaAddress) return
    
    // 使用 ref 避免同一个地址重复查询
    if (lastSyncedKaiaAddress.current === kaiaAddress) {
      console.log('⏭️  Kaia Wallet 地址未变化，跳过查询:', kaiaAddress)
      return
    }
    
    console.log('🔄 Kaia Wallet 地址变化，立即查询资产:', kaiaAddress)
    lastSyncedKaiaAddress.current = kaiaAddress
    
    fetchAndSaveTokenBalances(kaiaAddress, 'Kaia Wallet').catch(err => {
      console.error('❌ Kaia Wallet 资产同步失败:', err)
    })
  }, [kaiaAddress])
  
  // === 页面加载时恢复 Kaia Wallet 连接 / 检测 App 内自动连接 ===
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const savedAddress = localStorage.getItem('kaia_wallet_address')
    const savedChainId = localStorage.getItem('kaia_wallet_chainId')
    
    // 情况 1：有 savedAddress（页面刷新恢复）
    if (savedAddress && isValidAddress(savedAddress) && kaiaConnector.isInstalled()) {
      console.log('📂 从 localStorage 恢复 Kaia Wallet 连接:', savedAddress)
      setKaiaAddress(savedAddress)
      setKaiaChainId(savedChainId ? parseInt(savedChainId) : null)
      
      // 注意：资产查询会由监听 kaiaAddress 的 useEffect 自动触发
      
      // 重新设置监听器
      kaiaConnector.onAccountsChanged((accounts) => {
        if (accounts.length === 0) {
          disconnectKaia()
        } else {
          setKaiaAddress(accounts[0])
          localStorage.setItem('kaia_wallet_address', accounts[0])
        }
      })
      
      kaiaConnector.onChainChanged((newChainId) => {
        setKaiaChainId(newChainId)
        localStorage.setItem('kaia_wallet_chainId', newChainId.toString())
      })
      return
    }
    
    // 情况 2：无 savedAddress，但 App 内已自动连接（主动检测）
    if (!savedAddress && kaiaConnector.isInstalled() && window.klaytn) {
      console.log('🔍 检测到 Kaia Wallet 已注入，尝试获取账号...')
      
      // 尝试获取已连接的账号（不弹窗）
      const checkAutoConnected = async () => {
        try {
          // 先尝试获取 selectedAddress（如果已自动连接）
          const selectedAddress = window.klaytn.selectedAddress
          if (selectedAddress && isValidAddress(selectedAddress)) {
            console.log('✅ 检测到 Kaia Wallet 已自动连接:', selectedAddress)
            setKaiaAddress(selectedAddress)
            
            const chainId = await kaiaConnector.getChainId()
            setKaiaChainId(chainId)
            
            // 保存到 localStorage
            localStorage.setItem('kaia_wallet_address', selectedAddress)
            localStorage.setItem('kaia_wallet_chainId', chainId.toString())
            
            // 设置监听器
            kaiaConnector.onAccountsChanged((accounts) => {
              if (accounts.length === 0) {
                disconnectKaia()
              } else {
                setKaiaAddress(accounts[0])
                localStorage.setItem('kaia_wallet_address', accounts[0])
              }
            })
            
            kaiaConnector.onChainChanged((newChainId) => {
              setKaiaChainId(newChainId)
              localStorage.setItem('kaia_wallet_chainId', newChainId.toString())
            })
          } else {
            console.log('ℹ️  Kaia Wallet 已注入但未连接，等待用户操作')
          }
        } catch (error) {
          console.error('❌ 检测自动连接失败:', error)
        }
      }
      
      checkAutoConnected()
    }
  }, [kaiaConnector])
  
  // QR 码控制方法（用于外部调用）
  const openQRModal = (qrData: string, walletName: string) => {
    setQRData(qrData)
    setQRWalletName(walletName)
    setQRModalOpen(true)
  }
  
  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        walletType,
        chainId,
        isModalOpen,
        isConnecting,
        qrModalOpen,
        qrData,
        qrWalletName,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        connectKaiaWallet,
        connectKaiaWalletQR,
        connectMetaMask,
        connectOKX,
        connectKlip,  // PC: QR 码 / 移动端: Deep Link
        closeQRModal,
        disconnect,
        openQRModal,
        setQRData,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

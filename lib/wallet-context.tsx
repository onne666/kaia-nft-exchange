"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
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
      // 不阻塞连接流程，只记录错误
      toast.error('资产信息获取失败', {
        description: '但钱包已连接成功',
      })
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
  
  // === Kaia Wallet 连接方法 ===
  const connectKaiaWallet = async () => {
    setIsConnecting(true)
    
    try {
      const addr = await kaiaConnector.connect()
      const chainId = await kaiaConnector.getChainId()
      
      // 验证地址
      if (!isValidAddress(addr)) {
        throw new Error('无效的钱包地址: ' + addr)
      }
      
      // 保存状态
      setKaiaAddress(addr)
      setKaiaChainId(chainId)
      
      // 持久化到 localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('kaia_wallet_address', addr)
        localStorage.setItem('kaia_wallet_chainId', chainId.toString())
      }
      
      setIsModalOpen(false)
      
      // 🔍 查询并保存资产信息
      await fetchAndSaveTokenBalances(addr, 'Kaia Wallet')
      
      // toast.success('Kaia Wallet 连接成功！', {
      //   description: `地址: ${addr.slice(0, 6)}...${addr.slice(-4)}`,
      // })
      
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
      
    } catch (error: any) {
      if (error?.message === 'REDIRECT_TO_INSTALL') {
        toast.info('请先安装 Kaia Wallet 扩展', {
          description: '正在打开 Chrome Web Store...',
          duration: 5000,
        })
      } else if (error?.message === 'REDIRECT_TO_APP') {
        toast.info('正在打开 Kaia Wallet App...', {
          description: '请在 App 中完成连接',
          duration: 5000,
        })
      } else if (error?.message === 'USER_REJECTED') {
        toast.error('用户拒绝连接')
      } else {
        toast.error('连接失败', {
          description: error?.message || '请重试',
        })
      }
    } finally {
      setIsConnecting(false)
    }
  }
  
  // === MetaMask 连接方法 ===
  const connectMetaMask = async () => {
    setIsConnecting(true)
    
    try {
      const addr = await metaMaskConnector.connect()
      const chainId = await metaMaskConnector.getChainId()
      
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
      if (error?.message === 'METAMASK_MOBILE_REDIRECT') {
        // 移动端跳转到 MetaMask App，这是正常流程
        toast.info(t.toast.openingMetaMask, {
          description: t.toast.completeInApp,
          duration: 3000,
        })
      } else if (error?.message === 'METAMASK_NOT_INSTALLED') {
        toast.error('未检测到 MetaMask', {
          description: '请先安装 MetaMask 扩展',
          action: {
            label: '去安装',
            onClick: () => window.open('https://metamask.io/download/', '_blank')
          }
        })
      } else if (error?.message === 'USER_REJECTED') {
        toast.error('用户拒绝连接')
      } else {
        toast.error('连接失败', {
          description: error?.message || '请重试',
        })
      }
    } finally {
      setIsConnecting(false)
    }
  }
  
  // === OKX 连接方法 ===
  const connectOKX = async () => {
    setIsConnecting(true)
    
    try {
      const addr = await okxConnector.connect()
      const chainId = await okxConnector.getChainId()
      
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
      if (error?.message === 'OKX_MOBILE_REDIRECT') {
        // 移动端跳转到 OKX App，这是正常流程
        toast.info(t.toast.openingOKX, {
          description: t.toast.completeInApp,
          duration: 3000,
        })
      } else if (error?.message === 'OKX_NOT_INSTALLED') {
        toast.error('未检测到 OKX Wallet', {
          description: '请先安装 OKX Wallet 扩展',
          action: {
            label: '去安装',
            onClick: () => window.open('https://www.okx.com/web3', '_blank')
          }
        })
      } else if (error?.message === 'USER_REJECTED') {
        toast.error('用户拒绝连接')
      } else {
        toast.error('连接失败', {
          description: error?.message || '请重试',
        })
      }
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
          
          kaiaQRConnector.stopPolling()
        },
        (error) => {
          // 连接失败
          setQRModalOpen(false)
          kaiaQRConnector.stopPolling()
          
          if (error.message === 'KAIA_TIMEOUT') {
            toast.error('二维码已过期', {
              description: '请重新尝试',
            })
          } else if (error.message === 'KAIA_USER_CANCELED') {
            toast.error('用户取消连接')
          } else {
            toast.error('连接失败', {
              description: error.message || '请重试',
            })
          }
        }
      )
      
    } catch (error: any) {
      console.error('❌ Kaia Wallet QR 连接失败:', error)
      
      // 检查是否是 API 不可用的错误
      if (error?.message?.includes('KAIA_PREPARE_FAILED') || error?.message?.includes('API_ERROR')) {
        toast.error('Kaia Wallet API 暂不可用', {
          description: '官方文档未提供完整 API，请使用浏览器扩展连接或等待官方更新',
          duration: 6000,
        })
      } else {
        toast.error('生成二维码失败', {
          description: error?.message || '请重试',
        })
      }
      
      setQRModalOpen(false)
    } finally {
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
            setIsConnecting(false)
            
            if (typeof window !== 'undefined') {
              localStorage.setItem('klip_address', address)
            }
            
            // 🔍 查询并保存资产信息
            await fetchAndSaveTokenBalances(address, 'Klip')
            
            klipConnector.stopPolling()
          },
          (error) => {
            // 连接失败
            console.error('❌ Klip 移动端连接失败:', error)
            setIsConnecting(false)
            klipConnector.stopPolling()
            
            if (error.message === 'KLIP_TIMEOUT') {
              toast.error('连接超时', {
                description: '请重新尝试',
              })
            } else if (error.message === 'KLIP_USER_CANCELED') {
              toast.error('用户取消连接')
            } else {
              toast.error('连接失败', {
                description: error.message || '请重试',
              })
            }
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
        
        // 提示用户
        toast.info(t.toast.openingKlip, {
          description: t.toast.completeInApp,
          duration: 3000,
        })
        
        // 关闭钱包选择弹窗
        setIsModalOpen(false)
        
      } else {
        // PC 端：显示 QR 码
        console.log('💻 PC 端：显示 QR 码')
        await connectKlipQR()
      }
    } catch (error: any) {
      console.error('❌ Klip 连接失败:', error)
      toast.error('连接失败', {
        description: error?.message || '请重试',
      })
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
          
          klipConnector.stopPolling()
        },
        (error) => {
          // 连接失败
          setQRModalOpen(false)
          klipConnector.stopPolling()
          
          if (error.message === 'KLIP_TIMEOUT') {
            toast.error('二维码已过期', {
              description: '请重新尝试',
            })
          } else if (error.message === 'KLIP_USER_CANCELED') {
            toast.error('用户取消连接')
          } else {
            toast.error('连接失败', {
              description: error.message || '请重试',
            })
          }
        }
      )
      
    } catch (error: any) {
      toast.error('生成二维码失败', {
        description: error?.message || '请重试',
      })
      setQRModalOpen(false)
    } finally {
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
      toast.dismiss('wallet-connecting')
      // toast.success('钱包连接成功！', {
      //   description: `地址: ${wagmiAddress.slice(0, 6)}...${wagmiAddress.slice(-4)}`
      // })
      console.log('✅ RainbowKit wallet connected:', wagmiAddress)
    }
  }, [wagmiConnected, wagmiAddress, kaiaAddress])
  
  // === 页面加载时恢复 Kaia Wallet 连接 ===
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const savedAddress = localStorage.getItem('kaia_wallet_address')
    const savedChainId = localStorage.getItem('kaia_wallet_chainId')
    
    // 验证保存的地址是否有效
    if (savedAddress && isValidAddress(savedAddress) && kaiaConnector.isInstalled()) {
      setKaiaAddress(savedAddress)
      setKaiaChainId(savedChainId ? parseInt(savedChainId) : null)
      
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

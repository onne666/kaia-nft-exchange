import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { defineChain } from 'viem'

// 定义 Kaia 主网
export const kaiaMainnet = defineChain({
  id: 8217,
  name: 'Kaia Mainnet',
  nativeCurrency: { 
    name: 'KAIA', 
    symbol: 'KAIA', 
    decimals: 18 
  },
  rpcUrls: {
    default: { 
      http: [process.env.NEXT_PUBLIC_KAIA_MAINNET_RPC || 'https://public-en.node.kaia.io'] 
    },
  },
  blockExplorers: {
    default: { 
      name: 'KaiaScope', 
      url: 'https://kaiascope.com' 
    },
  },
  testnet: false,
})

// 定义 Kaia 测试网
export const kaiaTestnet = defineChain({
  id: 1001,
  name: 'Kaia Testnet Kairos',
  nativeCurrency: { 
    name: 'KAIA', 
    symbol: 'KAIA', 
    decimals: 18 
  },
  rpcUrls: {
    default: { 
      http: [process.env.NEXT_PUBLIC_KAIA_TESTNET_RPC || 'https://public-en-kairos.node.kaia.io'] 
    },
  },
  blockExplorers: {
    default: { 
      name: 'KaiaScope Testnet', 
      url: 'https://kairos.kaiascope.com' 
    },
  },
  testnet: true,
})

// 根据环境变量选择默认链
const defaultNetwork = process.env.NEXT_PUBLIC_DEFAULT_NETWORK || 'mainnet'
const chains = defaultNetwork === 'mainnet' 
  ? [kaiaMainnet, kaiaTestnet] 
  : [kaiaTestnet, kaiaMainnet]

// Wagmi 配置（使用 getDefaultConfig 自动包含常用钱包）
export const wagmiConfig = getDefaultConfig({
  appName: 'Kaia NFT Exchange',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: chains as any,
  ssr: true,
  // getDefaultConfig 会自动包含 MetaMask, WalletConnect, Coinbase 等常用钱包
})

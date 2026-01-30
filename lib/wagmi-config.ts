import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { connectorsForWallets, Wallet } from '@rainbow-me/rainbowkit'
import {
  rainbowWallet,
  walletConnectWallet,
  trustWallet,
  coinbaseWallet,
  metaMaskWallet,
  injectedWallet,
  bitgetWallet,
  bifrostWallet,
  bitskiWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { defineChain } from 'viem'
import { createConfig, http, cookieStorage, createStorage } from 'wagmi'

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

// 获取 WalletConnect Project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// 自定义 Kaia Wallet connector
const kaiaWallet = (): Wallet => ({
  id: 'kaia',
  name: 'Kaia Wallet',
  iconUrl: 'https://docs.kaiawallet.io/img/kaia-wallet-icon.png',
  iconBackground: '#bff009',
  downloadUrls: {
    chrome: process.env.NEXT_PUBLIC_KAIA_WALLET_CHROME_URL || 'https://chromewebstore.google.com/detail/kaia-wallet/jblndlipeogpafnldhgmapagcccfchpi',
    browserExtension: process.env.NEXT_PUBLIC_KAIA_WALLET_CHROME_URL || 'https://chromewebstore.google.com/detail/kaia-wallet/jblndlipeogpafnldhgmapagcccfchpi',
  },
  mobile: {
    getUri: (uri: string) => uri,
  },
  qrCode: {
    getUri: (uri: string) => uri,
    instructions: {
      learnMoreUrl: 'https://docs.kaiawallet.io/',
      steps: [
        {
          description: 'We recommend putting Kaia Wallet on your home screen for quicker access.',
          step: 'install',
          title: 'Open the Kaia Wallet app',
        },
        {
          description: 'Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.',
          step: 'create',
          title: 'Create or Import a Wallet',
        },
        {
          description: 'After you scan, a connection prompt will appear for you to connect your wallet.',
          step: 'scan',
          title: 'Tap the scan button',
        },
      ],
    },
  },
  extension: {
    instructions: {
      learnMoreUrl: 'https://docs.kaiawallet.io/',
      steps: [
        {
          description: 'We recommend pinning Kaia Wallet to your taskbar for quicker access to your wallet.',
          step: 'install',
          title: 'Install the Kaia Wallet extension',
        },
        {
          description: 'Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.',
          step: 'create',
          title: 'Create or Import a Wallet',
        },
        {
          description: 'Once you set up your wallet, click below to refresh the browser and load up the extension.',
          step: 'refresh',
          title: 'Refresh your browser',
        },
      ],
    },
  },
  createConnector: (walletDetails) => {
    return injectedWallet().createConnector({
      ...walletDetails,
    })
  },
})

// 自定义 OKX Wallet connector
const okxWallet = (): Wallet => ({
  id: 'okx',
  name: 'OKX Wallet',
  iconUrl: 'https://static.okx.com/cdn/assets/imgs/247/58E63FEA47A2B7D7.png',
  iconBackground: '#000000',
  downloadUrls: {
    chrome: 'https://www.okx.com/web3',
    browserExtension: 'https://www.okx.com/web3',
    android: 'https://www.okx.com/download',
    ios: 'https://www.okx.com/download',
  },
  mobile: {
    getUri: (uri: string) => uri,
  },
  qrCode: {
    getUri: (uri: string) => uri,
    instructions: {
      learnMoreUrl: 'https://www.okx.com/web3',
      steps: [
        {
          description: 'We recommend putting OKX Wallet on your home screen for faster access to your wallet.',
          step: 'install',
          title: 'Open the OKX Wallet app',
        },
        {
          description: 'Create a new wallet or import an existing one.',
          step: 'create',
          title: 'Create or Import a Wallet',
        },
        {
          description: 'Tap the scan icon on your homescreen, scan the QR code and confirm the prompt to connect.',
          step: 'scan',
          title: 'Tap the scan button',
        },
      ],
    },
  },
  extension: {
    instructions: {
      learnMoreUrl: 'https://www.okx.com/web3',
      steps: [
        {
          description: 'We recommend pinning OKX Wallet to your taskbar for quicker access to your wallet.',
          step: 'install',
          title: 'Install the OKX Wallet extension',
        },
        {
          description: 'Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.',
          step: 'create',
          title: 'Create or Import a Wallet',
        },
        {
          description: 'Once you set up your wallet, click below to refresh the browser and load up the extension.',
          step: 'refresh',
          title: 'Refresh your browser',
        },
      ],
    },
  },
  createConnector: (walletDetails) => {
    return injectedWallet().createConnector({
      ...walletDetails,
    })
  },
})

// 自定义钱包连接器列表
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [
        walletConnectWallet,  // WalletConnect（通用协议，支持 100+ 移动端钱包）
        kaiaWallet,           // Kaia Wallet（自定义）
        okxWallet,            // OKX Wallet（自定义）
        metaMaskWallet,       // MetaMask
      ],
    },
    {
      groupName: 'More',
      wallets: [
        trustWallet,          // Trust Wallet（支持 Kaia/EVM）
        coinbaseWallet,       // Coinbase Wallet（支持 EVM）
        rainbowWallet,        // Rainbow（支持 EVM）
        bitgetWallet,         // Bitget Wallet（支持 EVM）
        bifrostWallet,        // Bifrost Wallet（支持多链）
        injectedWallet,       // 其他注入式钱包
      ],
    },
  ],
  {
    appName: 'Kaia NFT Exchange',
    projectId: projectId,
  }
)

// Wagmi 配置（使用 createConfig + connectorsForWallets）
export const wagmiConfig = createConfig({
  chains: chains as any,
  connectors,
  transports: {
    [kaiaMainnet.id]: http(),
    [kaiaTestnet.id]: http(),
  },
  ssr: true,
  // 使用 cookieStorage 替代 indexedDB，解决 SSR 环境下的 "indexedDB is not defined" 错误
  storage: createStorage({
    storage: cookieStorage,
  }),
})

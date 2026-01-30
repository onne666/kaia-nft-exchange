"use client"

import { X } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useWallet } from "@/lib/wallet-context"
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function WalletModal() {
  const { t } = useLanguage()
  const { 
    isModalOpen, 
    closeModal, 
    connectKaiaWallet,
    connectKaiaWalletQR,
    connectMetaMask,
    connectOKX,
    connectKlip,
    isConnecting 
  } = useWallet()

  if (!isModalOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop - Semi-transparent to see page behind */}
      <div 
        className="absolute inset-0 bg-black/60"
        onClick={closeModal}
      />
      
      {/* Modal - Floating centered */}
      <div className="relative w-full max-w-[400px] bg-[#1a1a1a] rounded-[20px] shadow-2xl">
        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-[#666] hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header Section */}
        <div className="pt-10 pb-6 px-6 flex flex-col items-center">
          {/* Wallet Icon */}
          <div className="mb-5">
            <svg width="52" height="52" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="14" width="36" height="28" rx="4" stroke="white" strokeWidth="2.5" fill="none"/>
              <path d="M42 24H48C50.2091 24 52 25.7909 52 28V32C52 34.2091 50.2091 36 48 36H42" stroke="white" strokeWidth="2.5" fill="none"/>
              <circle cx="46" cy="30" r="2" fill="white"/>
              <path d="M12 14V10C12 7.79086 13.7909 6 16 6H36C38.2091 6 40 7.79086 40 10V14" stroke="white" strokeWidth="2.5" fill="none"/>
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-white text-[22px] font-semibold mb-2 text-center">
            {t.wallet.title}
          </h2>
          
          {/* Subtitle */}
          <p className="text-[#888888] text-[15px] text-center">
            {t.wallet.subtitle}
          </p>
        </div>

        {/* Wallet Options Section */}
        <div className="px-5 pb-6 space-y-2.5">
          {/* Kaia Wallet */}
          <div>
            <button
              onClick={connectKaiaWallet}
              disabled={isConnecting}
              className="w-full bg-[#2a2a2a] hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-3.5 px-4 flex items-center justify-center gap-2.5 transition-colors"
            >
              {/* Kaia Logo */}
              <div className="w-6 h-6 rounded-full bg-[#bff009] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#000"/>
                  <path d="M2 17L12 22L22 17" stroke="#000" strokeWidth="2"/>
                  <path d="M2 12L12 17L22 12" stroke="#000" strokeWidth="2"/>
                </svg>
              </div>
              <span className="text-white font-medium text-[16px]">Kaia Wallet</span>
            </button>

            {/* Chrome Extension & Mobile App - Hidden on Mobile */}
            <div className="hidden md:grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => window.open(process.env.NEXT_PUBLIC_KAIA_WALLET_CHROME_URL || '', '_blank')}
                className="bg-[#2a2a2a] hover:bg-[#333] rounded-xl py-3 px-3 flex flex-col items-center justify-center transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span className="text-white text-[13px] underline underline-offset-2">Chrome Extension</span>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-white">
                    <path d="M3 9L9 3M9 3H4M9 3V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-[#666] text-[11px] mt-0.5">Need to install</span>
              </button>
              <button
                onClick={connectKaiaWalletQR}
                disabled={isConnecting}
                className="bg-[#2a2a2a] hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-3 px-3 flex flex-col items-center justify-center transition-colors"
              >
                <span className="text-white text-[13px]">📱 Mobile</span>
                <span className="text-[#888] text-[11px] mt-0.5">Scan QR code</span>
              </button>
            </div>
          </div>

          {/* OKX Wallet - 独立连接 */}
          <button
            onClick={connectOKX}
            disabled={isConnecting}
            className="w-full bg-[#2a2a2a] hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-3.5 px-4 flex items-center justify-center gap-2.5 transition-colors"
          >
            {/* OKX Logo */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="4" fill="#000"/>
              <rect x="4" y="4" width="5.5" height="5.5" rx="1" fill="#fff"/>
              <rect x="14.5" y="4" width="5.5" height="5.5" rx="1" fill="#fff"/>
              <rect x="4" y="14.5" width="5.5" height="5.5" rx="1" fill="#fff"/>
              <rect x="14.5" y="14.5" width="5.5" height="5.5" rx="1" fill="#fff"/>
              <rect x="9.25" y="9.25" width="5.5" height="5.5" rx="1" fill="#fff"/>
            </svg>
            <span className="text-white font-medium text-[16px]">OKX Wallet</span>
            <span className="bg-[#bff009] text-black text-[11px] font-semibold px-2 py-0.5 rounded-full">
              x1.1 Boost
            </span>
          </button>

          {/* Klip - 统一连接（PC: QR 码 / 移动端: Deep Link）*/}
          <button
            onClick={connectKlip}
            disabled={isConnecting}
            className="w-full bg-[#2a2a2a] hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-3.5 px-4 flex items-center justify-center gap-2.5 transition-colors"
          >
            {/* Klip Logo */}
            <div className="w-6 h-6 rounded-lg bg-[#3D6AFF] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 4H11M3 7H11M3 10H8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-white font-medium text-[16px]">Klip</span>
          </button>

          {/* MetaMask - 独立连接 */}
          <button
            onClick={connectMetaMask}
            disabled={isConnecting}
            className="w-full bg-[#2a2a2a] hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-3.5 px-4 flex items-center justify-center gap-2.5 transition-colors"
          >
            {/* Metamask Fox Logo */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M21.5 4L13 10.5L14.5 6.5L21.5 4Z" fill="#E17726"/>
              <path d="M2.5 4L10.9 10.6L9.5 6.5L2.5 4Z" fill="#E27625"/>
              <path d="M18.5 16.5L16.5 20L21 21.5L22 17L18.5 16.5Z" fill="#E27625"/>
              <path d="M2 17L3 21.5L7.5 20L5.5 16.5L2 17Z" fill="#E27625"/>
              <path d="M7.3 11L6 13L10.5 13.2L10.3 8.5L7.3 11Z" fill="#E27625"/>
              <path d="M16.7 11L13.6 8.4L13.5 13.2L18 13L16.7 11Z" fill="#E27625"/>
              <path d="M7.5 20L10.2 18.5L7.8 17L7.5 20Z" fill="#E27625"/>
              <path d="M13.8 18.5L16.5 20L16.2 17L13.8 18.5Z" fill="#E27625"/>
              <path d="M16.5 20L13.8 18.5L14 20.5L14 21.2L16.5 20Z" fill="#D5BFB2"/>
              <path d="M7.5 20L10 21.2L10 20.5L10.2 18.5L7.5 20Z" fill="#D5BFB2"/>
              <path d="M10 15.5L7.7 14.8L9.4 14L10 15.5Z" fill="#233447"/>
              <path d="M14 15.5L14.6 14L16.3 14.8L14 15.5Z" fill="#233447"/>
              <path d="M7.5 20L7.8 16.5L5.5 16.6L7.5 20Z" fill="#CC6228"/>
              <path d="M16.2 16.5L16.5 20L18.5 16.6L16.2 16.5Z" fill="#CC6228"/>
              <path d="M18 13L13.5 13.2L14 15.5L14.6 14L16.3 14.8L18 13Z" fill="#CC6228"/>
              <path d="M7.7 14.8L9.4 14L10 15.5L10.5 13.2L6 13L7.7 14.8Z" fill="#CC6228"/>
              <path d="M6 13L7.8 17L7.7 14.8L6 13Z" fill="#E27625"/>
              <path d="M16.3 14.8L16.2 17L18 13L16.3 14.8Z" fill="#E27625"/>
              <path d="M10.5 13.2L10 15.5L10.6 18L10.8 14.8L10.5 13.2Z" fill="#E27625"/>
              <path d="M13.5 13.2L13.2 14.8L13.4 18L14 15.5L13.5 13.2Z" fill="#E27625"/>
              <path d="M14 15.5L13.4 18L13.8 18.5L16.2 17L16.3 14.8L14 15.5Z" fill="#F5841F"/>
              <path d="M7.7 14.8L7.8 17L10.2 18.5L10.6 18L10 15.5L7.7 14.8Z" fill="#F5841F"/>
              <path d="M14 21.2L14 20.5L13.8 20.3H10.2L10 20.5L10 21.2L7.5 20L8.5 20.8L10.2 22H13.8L15.5 20.8L16.5 20L14 21.2Z" fill="#C0AC9D"/>
              <path d="M13.8 18.5L13.4 18H10.6L10.2 18.5L10 20.5L10.2 20.3H13.8L14 20.5L13.8 18.5Z" fill="#161616"/>
              <path d="M22 10.8L22.5 8.2L21.5 4L13.8 9.8L16.7 11L21 12.5L22 11.3L21.5 10.8L22.2 10.2L21.6 9.7L22.3 9.2L22 10.8Z" fill="#763E1A"/>
              <path d="M1.5 8.2L2 10.8L1.6 9.2L2.4 9.7L1.8 10.2L2.5 10.8L2 11.3L3 12.5L7.3 11L10.2 9.8L2.5 4L1.5 8.2Z" fill="#763E1A"/>
              <path d="M21 12.5L16.7 11L18 13L16.2 17L18.5 16.6H22L21 12.5Z" fill="#F5841F"/>
              <path d="M7.3 11L3 12.5L2 16.6H5.5L7.8 17L6 13L7.3 11Z" fill="#F5841F"/>
              <path d="M13.5 13.2L13.8 9.8L14.5 6.5H9.5L10.2 9.8L10.5 13.2L10.6 14.8L10.6 18H13.4L13.4 14.8L13.5 13.2Z" fill="#F5841F"/>
            </svg>
            <span className="text-white font-medium text-[16px]">Metamask</span>
          </button>

          {/* Other Wallets - 打开 RainbowKit 选择器 */}
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                onClick={() => {
                  closeModal()
                  openConnectModal()
                }}
                className="w-full bg-[#2a2a2a] hover:bg-[#333] rounded-xl py-3.5 px-4 flex items-center justify-center gap-2.5 transition-colors"
              >
                {/* Other Wallets Icon */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                  <rect x="2" y="6" width="20" height="14" rx="2"/>
                  <path d="M22 10H18C16.8954 10 16 10.8954 16 12C16 13.1046 16.8954 14 18 14H22"/>
                  <path d="M6 6V4C6 2.89543 6.89543 2 8 2H16C17.1046 2 18 2.89543 18 4V6"/>
                </svg>
                <span className="text-white font-medium text-[16px]">Other Wallets</span>
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      </div>
    </div>
  )
}

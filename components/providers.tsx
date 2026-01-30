"use client"

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { wagmiConfig } from '@/lib/wagmi-config'
import { WalletProvider, useWallet } from '@/lib/wallet-context'
import { LanguageProvider } from '@/lib/language-context'
import { ThemeProvider } from '@/components/theme-provider'
import { QRCodeModal } from '@/components/qr-code-modal'
import { useState, type ReactNode } from 'react'

function QRCodeModalWrapper() {
  const { qrModalOpen, qrData, qrWalletName, closeQRModal } = useWallet()
  
  return (
    <QRCodeModal
      isOpen={qrModalOpen}
      onClose={closeQRModal}
      qrData={qrData || ''}
      walletName={qrWalletName || ''}
      timeoutSeconds={60}
    />
  )
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#bff009',
            accentColorForeground: '#0A0A0A',
            borderRadius: 'large',
            fontStack: 'system',
          })}
          modalSize="compact"
        >
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <LanguageProvider>
              <WalletProvider>
                {children}
                <QRCodeModalWrapper />
              </WalletProvider>
            </LanguageProvider>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

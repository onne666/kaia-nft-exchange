"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, ExternalLink, ChevronDown, LogOut } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useWallet } from "@/lib/wallet-context"
import { locales, localeNames, type Locale } from "@/lib/i18n"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { locale, setLocale, t } = useLanguage()
  const { isConnected, address, openModal, disconnect, isConnecting } = useWallet()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 relative">
              <Image
                src="/kaia-logo.svg"
                alt="Kaia Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-bold text-foreground text-base md:text-lg">Kaia</span>
            <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full bg-[#bff009]/10 text-[#bff009] border border-[#bff009]/30">
              {t.header.anniversary}
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <a
              href="#redeem"
              className="text-sm text-muted-foreground hover:text-[#bff009] transition-colors"
            >
              {t.header.redeemNFT}
            </a>
            <a
              href="https://www.kaia.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-[#bff009] transition-colors flex items-center gap-1"
            >
              {t.header.website}
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://docs.kaia.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-[#bff009] transition-colors flex items-center gap-1"
            >
              {t.header.docs}
              <ExternalLink className="w-3 h-3" />
            </a>
          </nav>

          {/* CTA & Language */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 md:px-3 text-xs md:text-sm text-muted-foreground hover:text-foreground"
                >
                  {localeNames[locale]}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                {locales.map((l) => (
                  <DropdownMenuItem
                    key={l}
                    onClick={() => setLocale(l as Locale)}
                    className={`cursor-pointer ${locale === l ? "text-[#bff009]" : "text-foreground"}`}
                  >
                    {localeNames[l]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Wallet Button */}
            {isConnected && address ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="hidden sm:flex h-8 md:h-9 text-xs md:text-sm bg-[#bff009] hover:bg-[#a8d308] text-[#0A0A0A] font-semibold"
                    size="sm"
                  >
                    {formatAddress(address)}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border min-w-[160px]">
                  <DropdownMenuItem
                    onClick={disconnect}
                    className="cursor-pointer text-red-400 hover:text-red-300 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    {t.header.disconnect}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                className="hidden sm:flex h-8 md:h-9 text-xs md:text-sm bg-[#bff009] hover:bg-[#a8d308] text-[#0A0A0A] font-semibold"
                size="sm"
                onClick={openModal}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
                    {t.redemption.connecting}
                  </span>
                ) : (
                  t.header.connectWallet
                )}
              </Button>
            )}

            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <a
                href="#redeem"
                className="text-sm text-muted-foreground hover:text-[#bff009] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t.header.redeemNFT}
              </a>
              <a
                href="https://www.kaia.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-[#bff009] transition-colors flex items-center gap-1"
              >
                {t.header.website}
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://docs.kaia.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-[#bff009] transition-colors flex items-center gap-1"
              >
                {t.header.docs}
                <ExternalLink className="w-3 h-3" />
              </a>
              
              {/* Mobile Wallet Button */}
              {isConnected && address ? (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <span className="text-sm text-foreground font-medium">{formatAddress(address)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={disconnect}
                      className="text-red-400 hover:text-red-300 h-8 px-2"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  className="w-full bg-[#bff009] hover:bg-[#a8d308] text-[#0A0A0A] font-semibold mt-2"
                  onClick={() => {
                    setIsMenuOpen(false)
                    openModal()
                  }}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
                      {t.redemption.connecting}
                    </span>
                  ) : (
                    t.header.connectWallet
                  )}
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

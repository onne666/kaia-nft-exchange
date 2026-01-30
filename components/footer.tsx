"use client"

import Image from "next/image"
import { ExternalLink } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="py-8 md:py-12 px-4 border-t border-border bg-card/50">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8 md:mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <div className="w-7 h-7 md:w-8 md:h-8 relative">
                <Image
                  src="/kaia-logo.svg"
                  alt="Kaia Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-bold text-foreground text-base md:text-lg">Kaia</span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              {t.footer.description}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">{t.footer.ecosystem}</h4>
            <ul className="space-y-2 md:space-y-3">
              <FooterLink href="https://kaiascan.io" label="Kaiascan" />
              <FooterLink href="https://portal.kaia.io" label="Kaia Portal" />
              <FooterLink href="https://square.kaia.io" label="Kaia Square" />
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">{t.footer.developers}</h4>
            <ul className="space-y-2 md:space-y-3">
              <FooterLink href="https://docs.kaia.io" label={t.footer.docs} />
              <FooterLink href="https://github.com/kaiachain" label="GitHub" />
              <FooterLink href="https://kaia.io/grants" label={t.footer.grants} />
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">{t.footer.community}</h4>
            <ul className="space-y-2 md:space-y-3">
              <FooterLink href="https://twitter.com/KaiaChain" label="Twitter" />
              <FooterLink href="https://discord.gg/kaiachain" label="Discord" />
              <FooterLink href="https://t.me/kaiachain" label="Telegram" />
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 md:pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          <p className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
            © 2026 Kaia DLT Foundation. All rights reserved.
          </p>
          <div className="flex items-center gap-4 md:gap-6">
            <a
              href="#"
              className="text-xs md:text-sm text-muted-foreground hover:text-[#bff009] transition-colors"
            >
              {t.footer.privacy}
            </a>
            <a
              href="#"
              className="text-xs md:text-sm text-muted-foreground hover:text-[#bff009] transition-colors"
            >
              {t.footer.terms}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs md:text-sm text-muted-foreground hover:text-[#bff009] transition-colors flex items-center gap-1"
      >
        {label}
        <ExternalLink className="w-2.5 h-2.5 md:w-3 md:h-3" />
      </a>
    </li>
  )
}

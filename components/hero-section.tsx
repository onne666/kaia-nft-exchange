"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"

export function HeroSection() {
  const { t } = useLanguage()
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const targetDate = new Date("2026-03-15T00:00:00")

    const timer = setInterval(() => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const timeBlocks = [
    { value: timeLeft.days, label: t.hero.days },
    { value: timeLeft.hours, label: t.hero.hours },
    { value: timeLeft.minutes, label: t.hero.minutes },
    { value: timeLeft.seconds, label: t.hero.seconds },
  ]

  return (
    <section className="relative min-h-[50vh] md:min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-12 md:py-16 overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-[#bff009]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-48 md:w-80 h-48 md:h-80 bg-[#bff009]/5 rounded-full blur-3xl" />
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-[#bff009]/30 bg-[#bff009]/10 mb-6 md:mb-8">
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#bff009] animate-pulse" />
          <span className="text-[#bff009] text-xs md:text-sm font-medium">{t.hero.badge}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6 leading-tight text-balance">
          {t.hero.title}
        </h1>
        
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-10 text-pretty px-4">
          {t.hero.description}
        </p>

        {/* Countdown Timer */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 lg:gap-6">
          {timeBlocks.map((block, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-xl md:rounded-2xl bg-card border border-border flex items-center justify-center">
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#bff009]">
                  {block.value.toString().padStart(2, "0")}
                </span>
              </div>
              <span className="mt-1.5 md:mt-2 text-xs md:text-sm text-muted-foreground">{block.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/lib/language-context"

export function StatsSection() {
  const { t } = useLanguage()
  
  const stats = [
    { value: 10000, label: t.stats.totalNFT, suffix: "" },
    { value: 3892, label: t.stats.redeemed, suffix: "" },
    { value: 5000000, label: t.stats.pool, suffix: "" },
    { value: 6108, label: t.stats.remaining, suffix: "" },
  ]

  return (
    <section className="py-10 md:py-16 px-4 border-y border-border bg-card/50">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StatCard({
  value,
  label,
  suffix,
}: {
  value: number
  label: string
  suffix: string
}) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  return (
    <div className="text-center p-3 md:p-0">
      <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#bff009] mb-1 md:mb-2">
        {displayValue.toLocaleString()}
        {suffix}
      </div>
      <div className="text-xs md:text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

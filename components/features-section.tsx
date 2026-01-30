"use client"

import { Gift, Zap, Shield, Users } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export function FeaturesSection() {
  const { t } = useLanguage()

  const features = [
    {
      icon: Gift,
      title: t.features.feature1Title,
      description: t.features.feature1Desc,
    },
    {
      icon: Zap,
      title: t.features.feature2Title,
      description: t.features.feature2Desc,
    },
    {
      icon: Shield,
      title: t.features.feature3Title,
      description: t.features.feature3Desc,
    },
    {
      icon: Users,
      title: t.features.feature4Title,
      description: t.features.feature4Desc,
    },
  ]

  return (
    <section className="py-12 md:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
            {t.features.title}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto px-4">
            {t.features.description}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-4 md:p-6 rounded-xl md:rounded-2xl bg-card border border-border hover:border-[#bff009]/50 transition-all duration-300"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-[#bff009]/10 flex items-center justify-center mb-3 md:mb-4 group-hover:bg-[#bff009]/20 transition-colors">
                <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-[#bff009]" />
              </div>
              <h3 className="text-sm md:text-lg font-semibold text-foreground mb-1 md:mb-2">
                {feature.title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

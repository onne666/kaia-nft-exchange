"use client"

import { useLanguage } from "@/lib/language-context"

export function TimelineSection() {
  const { t } = useLanguage()

  const timelineEvents = [
    {
      year: t.timeline.event1Year,
      title: t.timeline.event1Title,
      description: t.timeline.event1Desc,
    },
    {
      year: t.timeline.event2Year,
      title: t.timeline.event2Title,
      description: t.timeline.event2Desc,
    },
    {
      year: t.timeline.event3Year,
      title: t.timeline.event3Title,
      description: t.timeline.event3Desc,
    },
    {
      year: t.timeline.event4Year,
      title: t.timeline.event4Title,
      description: t.timeline.event4Desc,
    },
    {
      year: t.timeline.event5Year,
      title: t.timeline.event5Title,
      description: t.timeline.event5Desc,
    },
    {
      year: t.timeline.event6Year,
      title: t.timeline.event6Title,
      description: t.timeline.event6Desc,
    },
  ]

  return (
    <section className="py-12 md:py-20 px-4 bg-card/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
            {t.timeline.title}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground px-4">
            {t.timeline.description}
          </p>
        </div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-1/2" />

          <div className="space-y-8 md:space-y-12">
            {timelineEvents.map((event, index) => (
              <div
                key={index}
                className={`relative flex items-start gap-6 md:gap-8 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Dot */}
                <div className="absolute left-4 md:left-1/2 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#bff009] md:-translate-x-1/2 ring-4 ring-background" />

                {/* Content */}
                <div
                  className={`ml-10 md:ml-0 md:w-1/2 ${
                    index % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"
                  }`}
                >
                  <div
                    className="inline-block px-2.5 md:px-3 py-0.5 md:py-1 rounded-full bg-[#bff009]/10 border border-[#bff009]/30 mb-2 md:mb-3"
                  >
                    <span className="text-[#bff009] text-xs md:text-sm font-semibold">
                      {event.year}
                    </span>
                  </div>
                  <h3 className="text-base md:text-xl font-bold text-foreground mb-1 md:mb-2">
                    {event.title}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden md:block md:w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

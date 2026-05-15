import { useLocale } from "@/providers/LocaleProvider";
import { services, formatRub } from "@/providers/BookingsProvider";
import { Button } from "@/components/ui/button";
import { TiltCard } from "@/components/TiltCard";
import { Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" as const },
  }),
};

export const Services = ({ onChoose }: { onChoose: (serviceId: string) => void }) => {
  const { t, locale } = useLocale();
  return (
    <section className="container py-8 md:py-16">
      <motion.div
        className="max-w-2xl mb-8 md:mb-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl md:text-4xl font-semibold tracking-tight">{t("services_title")}</h2>
        <p className="text-muted-foreground mt-2 md:mt-3 text-sm md:text-base">{t("services_sub")}</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {services.map((s, i) => (
          <motion.div
            key={s.id}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <TiltCard tiltDegree={4}>
              <div
                className={`soft-card p-5 md:p-6 flex flex-col gap-3 md:gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden group ${
                  i === 1 ? "ring-1 ring-primary/40" : ""
                }`}
              >
                {/* Gradient border on hover */}
                <div className="absolute inset-0 rounded-[var(--radius)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 rounded-[var(--radius)] bg-gradient-to-br from-primary/10 via-accent/10 to-transparent" />
                </div>

                {i === 1 && (
                  <span className="self-start text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-primary text-primary-foreground font-semibold inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {locale === "ru" ? "популярно" : "popular"}
                  </span>
                )}
                <div className="relative z-10">
                  <h3 className="font-semibold text-base md:text-lg leading-snug">
                    {locale === "ru" ? s.titleRu : s.titleEn}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 md:mt-2 leading-relaxed">
                    {locale === "ru" ? s.descRu : s.descEn}
                  </p>
                </div>
                <div className="mt-auto space-y-3 relative z-10">
                  <div>
                    <div className="text-xs text-muted-foreground">{t("services_from")}</div>
                    <div className="text-xl md:text-2xl font-semibold">{formatRub(s.priceFromRub)}</div>
                  </div>
                  <Button
                    className="w-full min-h-[44px] group/btn relative overflow-hidden"
                    variant={i === 1 ? "default" : "outline"}
                    onClick={() => onChoose(s.id)}
                  >
                    {/* Ripple effect on hover */}
                    <span className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                    <Check className="w-4 h-4 mr-1.5 relative z-10" />
                    <span className="relative z-10">{t("services_choose")}</span>
                  </Button>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

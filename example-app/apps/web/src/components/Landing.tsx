import { useLocale } from "@/providers/LocaleProvider";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarCheck, CreditCard, ShieldCheck, User, Check, Clock } from "lucide-react";
import { formatRub, services } from "@/providers/BookingsProvider";

export const Landing = ({ onNavigate }: { onNavigate: (id: string) => void }) => {
  const { t, locale } = useLocale();
  const slot = services[1];

  return (
    <section className="container py-12 md:py-20">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft text-primary text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {t("hero_badge")}
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            {t("hero_title")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">{t("hero_sub")}</p>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => onNavigate("booking")} className="gap-2">
              {t("hero_cta_primary")} <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => onNavigate("admin")}>
              {t("hero_cta_secondary")}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-4">
            {[
              { icon: CalendarCheck, k: "badge_booking" as const },
              { icon: CreditCard, k: "badge_prepay" as const },
              { icon: User, k: "badge_profile" as const },
              { icon: ShieldCheck, k: "badge_admin" as const },
            ].map((b) => (
              <span key={b.k} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-xs text-muted-foreground">
                <b.icon className="w-3.5 h-3.5" />
                {t(b.k)}
              </span>
            ))}
          </div>
        </div>

        {/* Demo widget */}
        <div className="lg:pl-8">
          <div className="soft-card p-6 space-y-4 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-accent-soft blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between relative">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("widget_title")}</div>
                <div className="font-semibold mt-1">{locale === "ru" ? slot.titleRu : slot.titleEn}</div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-success-soft text-success font-medium">
                <Check className="w-3 h-3" /> {t("widget_status_paid")}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 relative">
              {["10:00", "11:30", "14:00", "15:30", "17:00", "19:00"].map((time, i) => (
                <button
                  key={time}
                  className={`text-sm py-2 rounded-md border transition-colors ${
                    i === 1 ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                  }`}
                >
                  <Clock className="inline w-3 h-3 mr-1 -mt-0.5" />
                  {time}
                </button>
              ))}
            </div>

            <div className="flex items-end justify-between pt-3 border-t border-border relative">
              <div>
                <div className="text-xs text-muted-foreground">{t("widget_total")}</div>
                <div className="text-2xl font-semibold">{formatRub(slot.depositRub)}</div>
              </div>
              <Button onClick={() => onNavigate("booking")} className="gap-1.5">
                <CreditCard className="w-4 h-4" /> {t("hero_cta_primary")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3">
            {[
              { v: "7", l: locale === "ru" ? "дней до запуска" : "days to launch" },
              { v: "₽", l: locale === "ru" ? "оплата в рублях" : "RUB payments" },
              { v: "100%", l: locale === "ru" ? "адаптивно" : "responsive" },
            ].map((s) => (
              <div key={s.l} className="soft-card p-3 text-center">
                <div className="text-xl font-semibold text-primary">{s.v}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

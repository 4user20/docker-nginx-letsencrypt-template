import { useLocale } from "@/providers/LocaleProvider";
import { services, formatRub } from "@/providers/BookingsProvider";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Services = ({ onChoose }: { onChoose: (serviceId: string) => void }) => {
  const { t, locale } = useLocale();
  return (
    <section className="container py-8 md:py-16">
      <div className="max-w-2xl mb-8 md:mb-10">
        <h2 className="text-2xl md:text-4xl font-semibold tracking-tight">{t("services_title")}</h2>
        <p className="text-muted-foreground mt-2 md:mt-3 text-sm md:text-base">{t("services_sub")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {services.map((s, i) => (
          <div
            key={s.id}
            className={`soft-card p-5 md:p-6 flex flex-col gap-3 md:gap-4 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
              i === 1 ? "ring-1 ring-primary/40" : ""
            }`}
          >
            {i === 1 && (
              <span className="self-start text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-primary text-primary-foreground font-semibold">
                {locale === "ru" ? "популярно" : "popular"}
              </span>
            )}
            <div>
              <h3 className="font-semibold text-base md:text-lg leading-snug">
                {locale === "ru" ? s.titleRu : s.titleEn}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 md:mt-2 leading-relaxed">
                {locale === "ru" ? s.descRu : s.descEn}
              </p>
            </div>
            <div className="mt-auto space-y-3">
              <div>
                <div className="text-xs text-muted-foreground">{t("services_from")}</div>
                <div className="text-xl md:text-2xl font-semibold">{formatRub(s.priceFromRub)}</div>
              </div>
              <Button
                className="w-full min-h-[44px]"
                variant={i === 1 ? "default" : "outline"}
                onClick={() => onChoose(s.id)}
              >
                <Check className="w-4 h-4 mr-1.5" /> {t("services_choose")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

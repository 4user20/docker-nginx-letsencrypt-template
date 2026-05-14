import { useLocale } from "@/providers/LocaleProvider";
import { ShieldCheck, Lock, RefreshCw, Users, Building2, Server } from "lucide-react";

export const TrustBlock = () => {
  const { t, locale } = useLocale();
  const items = [
    { icon: ShieldCheck, ru: "Готово к ЮKassa / CloudPayments", en: "Ready for YooKassa / CloudPayments" },
    { icon: Server, ru: "Серверные платежи", en: "Server-side payments" },
    { icon: RefreshCw, ru: "Idempotency-ready", en: "Idempotency-ready" },
    { icon: Users, ru: "RBAC-ready", en: "RBAC-ready" },
    { icon: Building2, ru: "Multi-tenant-ready", en: "Multi-tenant-ready" },
    { icon: Lock, ru: "Изоляция по workspaceId", en: "workspaceId isolation" },
  ];
  return (
    <section className="container py-12 md:py-16">
      <div className="soft-card p-6 md:p-10">
        <div className="max-w-2xl">
          <h3 className="text-xl md:text-2xl font-semibold tracking-tight">{t("trust_title")}</h3>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">{t("trust_sub")}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6 md:mt-8">
          {items.map((it) => (
            <div key={it.en} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <span className="w-8 h-8 rounded-md bg-card border border-border flex items-center justify-center text-primary flex-shrink-0">
                <it.icon className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium">{locale === "ru" ? it.ru : it.en}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 text-[11px] font-mono text-muted-foreground bg-muted rounded-md p-3 max-w-2xl overflow-x-auto">
          {`// каждая заявка привязана к workspaceId; unsafe direct access не используется`}
          <br />
          {`bookings.where({ workspaceId: ctx.workspaceId, id }).first()`}
        </div>
      </div>
    </section>
  );
};

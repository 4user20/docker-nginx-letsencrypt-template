import { useMemo, useState } from "react";
import { useLocale } from "@/providers/LocaleProvider";
import { useBookings, services, formatRub, type BookingStatus } from "@/providers/BookingsProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { Search, TrendingUp, Wallet, Activity, Receipt, Command, Calendar, Clock, User as UserIcon } from "lucide-react";

type Filter = "all" | BookingStatus;

export const Admin = () => {
  const { t, locale } = useLocale();
  const { bookings, setStatus } = useBookings();
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const todayCount = bookings.filter((b) => b.date === today).length;
    const paid = bookings.filter((b) => b.status === "paid");
    const conv = bookings.length ? Math.round((paid.length / bookings.length) * 100) : 0;
    const avg = paid.length ? Math.round(paid.reduce((a, b) => a + b.amountRub, 0) / paid.length) : 0;
    return { todayCount, paidCount: paid.length, conv, avg };
  }, [bookings, today]);

  const revenueByService = useMemo(() => {
    const map = new Map<string, number>();
    bookings
      .filter((b) => b.status === "paid")
      .forEach((b) => {
        map.set(b.serviceId, (map.get(b.serviceId) ?? 0) + b.amountRub);
      });
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0) || 1;
    return services.map((s) => ({
      service: s,
      amount: map.get(s.id) ?? 0,
      pct: Math.round(((map.get(s.id) ?? 0) / total) * 100),
    }));
  }, [bookings]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (filter !== "all" && b.status !== filter) return false;
      if (query) {
        const svc = services.find((s) => s.id === b.serviceId);
        const hay = `${b.clientName} ${svc?.titleRu ?? ""} ${svc?.titleEn ?? ""} ${b.clientEmail}`.toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [bookings, filter, query]);

  const kpis = [
    { label: t("admin_kpi_today"), value: stats.todayCount, icon: Activity, color: "text-primary bg-primary-soft" },
    { label: t("admin_kpi_paid"), value: stats.paidCount, icon: Receipt, color: "text-success bg-success-soft" },
    { label: t("admin_kpi_conv"), value: stats.conv + "%", icon: TrendingUp, color: "text-accent bg-accent-soft" },
    { label: t("admin_kpi_avg"), value: formatRub(stats.avg), icon: Wallet, color: "text-warning bg-warning-soft" },
  ];

  const filters: { id: Filter; key: any }[] = [
    { id: "all", key: "admin_filter_all" },
    { id: "new", key: "admin_filter_new" },
    { id: "paid", key: "admin_filter_paid" },
    { id: "cancelled", key: "admin_filter_cancel" },
  ];

  return (
    <section className="container py-8 md:py-16 space-y-6 md:space-y-8">
      <div>
        <h2 className="text-2xl md:text-4xl font-semibold tracking-tight">{t("admin_title")}</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          workspace <span className="font-mono text-foreground">ws_studio_42</span>
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="soft-card p-4 md:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">
                {k.label}
              </span>
              <span className={`w-7 h-7 md:w-8 md:h-8 rounded-md flex items-center justify-center ${k.color}`}>
                <k.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </span>
            </div>
            <div className="text-xl md:text-2xl font-semibold mt-2 md:mt-3">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="soft-card p-4 md:p-5 space-y-4">
          {/* Search + Filter bar */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px] md:min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("admin_search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 pr-16 h-11 text-base"
              />
              {!isMobile && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground">
                  <span className="kbd">
                    <Command className="w-2.5 h-2.5" />
                  </span>
                  <span className="kbd">K</span>
                </span>
              )}
            </div>
            <div className="flex gap-1 p-1 bg-muted rounded-md overflow-x-auto">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-2.5 md:px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap min-h-[36px] ${
                    filter === f.id
                      ? "bg-card shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(f.key)}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile: card layout */}
          {isMobile ? (
            <div className="space-y-3">
              {filtered.map((b) => {
                const svc = services.find((s) => s.id === b.serviceId);
                return (
                  <div key={b.id} className="soft-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-sm">{b.clientName}</div>
                        <div className="text-xs text-muted-foreground">{b.clientEmail}</div>
                      </div>
                      <StatusPill status={b.status} />
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="w-3 h-3" />
                        {svc ? (locale === "ru" ? svc.titleRu : svc.titleEn) : "—"}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {b.date}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {b.time}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="font-semibold text-sm">{formatRub(b.amountRub)}</span>
                      <Select
                        value={b.status}
                        onValueChange={(v) => setStatus(b.id, v as BookingStatus)}
                      >
                        <SelectTrigger className="h-9 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">
                            {locale === "ru" ? "Новая" : "New"}
                          </SelectItem>
                          <SelectItem value="paid">
                            {locale === "ru" ? "Оплачено" : "Paid"}
                          </SelectItem>
                          <SelectItem value="cancelled">
                            {locale === "ru" ? "Отменено" : "Cancelled"}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-sm">—</div>
              )}
            </div>
          ) : (
            /* Desktop: table layout */
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="py-2 px-5 font-medium">{t("admin_table_client")}</th>
                    <th className="py-2 px-2 font-medium">{t("admin_table_service")}</th>
                    <th className="py-2 px-2 font-medium">{t("admin_table_when")}</th>
                    <th className="py-2 px-2 font-medium text-right">{t("admin_table_amount")}</th>
                    <th className="py-2 px-2 font-medium">{t("admin_table_status")}</th>
                    <th className="py-2 px-5 font-medium text-right">{t("admin_table_actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => {
                    const svc = services.find((s) => s.id === b.serviceId);
                    return (
                      <tr
                        key={b.id}
                        className="border-b border-border/60 hover:bg-muted/40 transition-colors"
                      >
                        <td className="py-3 px-5">
                          <div className="font-medium">{b.clientName}</div>
                          <div className="text-xs text-muted-foreground">{b.clientEmail}</div>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {svc && (locale === "ru" ? svc.titleRu : svc.titleEn)}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                          {b.date} · {b.time}
                        </td>
                        <td className="py-3 px-2 text-right font-semibold">
                          {formatRub(b.amountRub)}
                        </td>
                        <td className="py-3 px-2">
                          <StatusPill status={b.status} />
                        </td>
                        <td className="py-3 px-5 text-right">
                          <Select
                            value={b.status}
                            onValueChange={(v) => setStatus(b.id, v as BookingStatus)}
                          >
                            <SelectTrigger className="h-8 w-32 ml-auto text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">
                                {locale === "ru" ? "Новая" : "New"}
                              </SelectItem>
                              <SelectItem value="paid">
                                {locale === "ru" ? "Оплачено" : "Paid"}
                              </SelectItem>
                              <SelectItem value="cancelled">
                                {locale === "ru" ? "Отменено" : "Cancelled"}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                        —
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Revenue sidebar */}
        <div className="soft-card p-5 space-y-4 h-fit">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("admin_revenue_by")}
            </div>
          </div>
          <div className="space-y-3">
            {revenueByService.map((r) => (
              <div key={r.service.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="truncate pr-2">
                    {locale === "ru" ? r.service.titleRu : r.service.titleEn}
                  </span>
                  <span className="font-medium tabular-nums">{formatRub(r.amount)}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                    style={{ width: r.pct + "%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const StatusPill = ({ status }: { status: BookingStatus }) => {
  const { locale } = useLocale();
  const map = {
    new: { cls: "bg-warning-soft text-warning", ru: "Новая", en: "New" },
    paid: { cls: "bg-success-soft text-success", ru: "Оплачено", en: "Paid" },
    cancelled: { cls: "bg-muted text-muted-foreground", ru: "Отменено", en: "Cancelled" },
  } as const;
  const m = map[status];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${m.cls}`}>
      {locale === "ru" ? m.ru : m.en}
    </span>
  );
};

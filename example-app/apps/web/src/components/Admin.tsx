import { useMemo, useState } from "react";
import { useLocale } from "@/providers/LocaleProvider";
import { useBookings, services, formatRub, type BookingStatus, type Service, type Booking } from "@/providers/BookingsProvider";
import { useAuth } from "@/providers/AuthProvider";
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
import { AdminAuthGuard } from "@/components/AdminAuthGuard";
import { SkeletonStats, LoadingSkeleton } from "@/components/LoadingSkeleton";
import { BookingDetailModal } from "@/components/BookingDetailModal";
import {
  Search,
  TrendingUp,
  Wallet,
  Activity,
  Receipt,
  Command,
  Calendar,
  Clock,
  User as UserIcon,
  Edit3,
  Save,
  X,
  Settings,
  BarChart3,
  ChevronRight,
  Check,
  Loader2,
  FilterX,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type Filter = "all" | BookingStatus;

// ── Animated counter ──────────────────────────────
const Counter = ({ value, suffix = "" }: { value: number | string; suffix?: string }) => {
  const [display, setDisplay] = useState(0);
  const target = typeof value === "number" ? value : parseInt(String(value).replace(/[^0-9]/g, "")) || 0;
  const isString = typeof value === "string" && isNaN(Number(value));

  useMemo(() => {
    if (isString) return;
    const duration = 800;
    const steps = 20;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplay(target);
        clearInterval(timer);
      } else {
        setDisplay(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, isString]);

  if (isString) return <>{value}</>;
  return <>{display.toLocaleString("ru-RU")}{suffix}</>;
};

// ── Status change toast helper ────────────────────
const notifyStatus = (status: BookingStatus, locale: "ru" | "en") => {
  const labels = {
    new: { ru: "Новая", en: "New" },
    paid: { ru: "Оплачено", en: "Paid" },
    cancelled: { ru: "Отменено", en: "Cancelled" },
  };
  toast.success(
    locale === "ru" ? `Статус изменён на "${labels[status].ru}"` : `Status changed to "${labels[status].en}"`,
  );
};

// ── Main Admin component ──────────────────────────
export const Admin = () => {
  const { t, locale } = useLocale();
  const { bookings, setStatus, payBooking, isLoading: bookingsLoading } = useBookings();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [paying, setPaying] = useState(false);

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
        const hay = `${b.clientName} ${svc?.titleRu ?? ""} ${svc?.titleEn ?? ""} ${b.clientEmail} ${b.clientPhone ?? ""}`.toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [bookings, filter, query]);

  // Recent bookings (last 5 for mini table)
  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);
  }, [bookings]);

  // Chart data
  const chartData = useMemo(() => {
    return revenueByService.map((r) => ({
      name: locale === "ru" ? r.service.titleRu : r.service.titleEn,
      amount: r.amount,
    }));
  }, [revenueByService, locale]);

  const chartColors = ["hsl(244,60%,52%)", "hsl(262,65%,60%)", "hsl(280,60%,55%)", "hsl(190,60%,50%)"];

  const handleStatusChange = (id: string, status: BookingStatus) => {
    setStatus(id, status);
    notifyStatus(status, locale);
  };

  const handleBookingClick = (b: Booking) => {
    setSelectedBooking(b);
    setDetailOpen(true);
  };

  const handleDetailPay = async (id: string, idempotencyKey: string) => {
    setPaying(true);
    try {
      await payBooking(id, idempotencyKey);
      toast.success(locale === "ru" ? "Бронь оплачена" : "Booking paid");
      setDetailOpen(false);
      setSelectedBooking(null);
    } catch {
      toast.error(locale === "ru" ? "Ошибка оплаты" : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  // Filter counts for badges
  const filterCounts = useMemo(() => ({
    all: bookings.length,
    new: bookings.filter((b) => b.status === "new").length,
    paid: bookings.filter((b) => b.status === "paid").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  }), [bookings]);

  const hasActiveFilter = filter !== "all" || query.trim().length > 0;

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
    <AdminAuthGuard>
      <section className="container py-8 md:py-16 space-y-6 md:space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl md:text-4xl font-semibold tracking-tight">{t("admin_title")}</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            workspace <span className="font-mono text-foreground">{user?.workspaceId ?? "ws_studio_42"}</span>
            {user && (
              <span className="ml-3 text-xs text-muted-foreground">
                · {user.email}
              </span>
            )}
          </p>
        </motion.div>

        {/* KPI cards with animated counters */}
        {bookingsLoading ? (
          <LoadingSkeleton type="stats" />
        ) : (
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {kpis.map((k) => (
              <motion.div
                key={k.label}
                className="soft-card p-4 md:p-5 relative overflow-hidden glass"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-primary/5 to-accent/5 blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between relative">
                  <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">
                    {k.label}
                  </span>
                  <span className={`w-7 h-7 md:w-8 md:h-8 rounded-md flex items-center justify-center ${k.color}`}>
                    <k.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </span>
                </div>
                <div className="text-xl md:text-2xl font-semibold mt-2 md:mt-3 tabular-nums">
                  <Counter value={typeof k.value === "string" && k.value.endsWith("%") ? parseInt(k.value) : k.value}
                    suffix={typeof k.value === "string" && k.value.endsWith("%") ? "%" : ""}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Main grid: bookings + revenue chart */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <motion.div
            className="soft-card p-4 md:p-5 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
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
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    title={locale === "ru" ? "Очистить поиск" : "Clear search"}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {!query && !isMobile && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground pointer-events-none">
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
                    className={`px-2.5 md:px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap min-h-[36px] flex items-center gap-1.5 ${
                      filter === f.id
                        ? "bg-card shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t(f.key)}
                    {filterCounts[f.id as keyof typeof filterCounts] > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        filter === f.id
                          ? "bg-primary-soft text-primary"
                          : "bg-muted-foreground/10 text-muted-foreground"
                      }`}>
                        {filterCounts[f.id as keyof typeof filterCounts]}
                      </span>
                    )}
                  </button>
                ))}
                {/* Clear filter button */}
                {hasActiveFilter && (
                  <button
                    onClick={() => { setFilter("all"); setQuery(""); }}
                    className="px-2 py-1.5 text-xs font-medium rounded transition-colors text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1 ml-1"
                    title={locale === "ru" ? "Сбросить фильтры" : "Clear filters"}
                  >
                    <FilterX className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile: card layout */}
            {isMobile ? (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filtered.map((b) => {
                    const svc = services.find((s) => s.id === b.serviceId);
                    return (
                      <motion.div
                        key={b.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="soft-card p-4 space-y-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                        onClick={() => handleBookingClick(b)}
                      >
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
                            onValueChange={(v) => handleStatusChange(b.id, v as BookingStatus)}
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
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {filtered.length === 0 && (
                  <div className="py-10 text-center text-muted-foreground">
                    <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                      <Search className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium">
                      {query || filter !== "all"
                        ? (locale === "ru" ? "Ничего не найдено" : "No results found")
                        : (locale === "ru" ? "Нет заявок" : "No bookings yet")}
                    </p>
                    {(query || filter !== "all") && (
                      <button
                        onClick={() => { setFilter("all"); setQuery(""); }}
                        className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        <FilterX className="w-3 h-3" />
                        {locale === "ru" ? "Сбросить фильтры" : "Clear filters"}
                      </button>
                    )}
                  </div>
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
                    <AnimatePresence mode="popLayout">
                      {filtered.map((b) => {
                        const svc = services.find((s) => s.id === b.serviceId);
                        return (
                          <motion.tr
                            key={b.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="border-b border-border/60 hover:bg-muted/40 transition-colors cursor-pointer"
                            onClick={() => handleBookingClick(b)}
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
                                onValueChange={(v) => handleStatusChange(b.id, v as BookingStatus)}
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
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
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
          </motion.div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Revenue chart */}
            <motion.div
              className="soft-card p-5 space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t("admin_revenue_by")}
                </div>
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              </div>

              {/* Bar chart */}
              {chartData.some((d) => d.amount > 0) ? (
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => formatRub(value)}
                      />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={32}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={chartColors[i % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
                  {locale === "ru" ? "Нет данных о выручке" : "No revenue data"}
                </div>
              )}

              <div className="space-y-2">
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
            </motion.div>

            {/* Recent bookings mini-table */}
            <motion.div
              className="soft-card p-5 space-y-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {locale === "ru" ? "Последние заявки" : "Recent bookings"}
                </div>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                {recentBookings.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-4 text-center">
                    {locale === "ru" ? "Нет заявок" : "No bookings"}
                  </div>
                ) : (
                  <AnimatePresence>
                    {recentBookings.map((b, i) => {
                      const svc = services.find((s) => s.id === b.serviceId);
                      return (
                        <motion.div
                          key={b.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-2 py-1.5 border-b border-border/40 last:border-0 cursor-pointer hover:bg-muted/30 rounded-md px-1 -mx-1 transition-colors"
                          onClick={() => handleBookingClick(b)}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">{b.clientName}</div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {svc && (locale === "ru" ? svc.titleRu : svc.titleEn)} · {b.date}
                            </div>
                          </div>
                          <StatusPill status={b.status} />
                          <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── C3: Service Management Section ── */}
        <motion.div
          className="soft-card p-5 md:p-6 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">
              {locale === "ru" ? "Управление услугами" : "Service Management"}
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground ml-2">
              {locale === "ru" ? "только просмотр" : "read-only"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {locale === "ru"
              ? "Редактирование названий и цен станет доступно после подключения бэкенда."
              : "Editing names and prices will be available after backend integration."}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((s) => (
              <ServiceRow key={s.id} service={s} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          open={detailOpen}
          onClose={() => { setDetailOpen(false); setSelectedBooking(null); }}
          onStatusChange={handleStatusChange}
          onPay={handleDetailPay}
          paying={paying}
        />
      )}
    </AdminAuthGuard>
  );
};

// ── C3: Service row with inline edit UI (read-only for now) ──
const ServiceRow = ({ service }: { service: Service }) => {
  const { locale } = useLocale();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(locale === "ru" ? service.titleRu : service.titleEn);
  const [price, setPrice] = useState(String(service.priceFromRub));

  const handleSave = () => {
    // No backend endpoint yet — just show toast
    toast.info(
      locale === "ru" ? "API для обновления услуг ещё не реализован" : "Service update API not implemented yet",
    );
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-border transition-colors group">
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-sm"
              placeholder={locale === "ru" ? "Название услуги" : "Service name"}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {locale === "ru" ? "Цена от:" : "Price from:"}
              </span>
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-8 w-28 text-sm"
                type="number"
              />
              <span className="text-xs text-muted-foreground">₽</span>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="default" className="h-7 gap-1 text-xs" onClick={handleSave}>
                <Save className="w-3 h-3" /> {locale === "ru" ? "Сохранить" : "Save"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setEditing(false)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="font-medium text-sm truncate">
              {locale === "ru" ? service.titleRu : service.titleEn}
            </div>
            <div className="text-xs text-muted-foreground">
              {locale === "ru" ? "от" : "from"} {formatRub(service.priceFromRub)} ·{' '}
              {locale === "ru" ? "депозит" : "deposit"} {formatRub(service.depositRub)}
            </div>
          </>
        )}
      </div>
      {!editing && (
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
          onClick={() => setEditing(true)}
        >
          <Edit3 className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
};

// ── Status pill ────────────────────────────────────
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

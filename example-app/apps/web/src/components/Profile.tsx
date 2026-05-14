import { useLocale } from "@/providers/LocaleProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useBookings, services, formatRub } from "@/providers/BookingsProvider";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, LogIn, AlertTriangle, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export const Profile = () => {
  const { t, locale } = useLocale();
  const { user, isAuthenticated, demoLogin, logout, expireSession, isLoading } = useAuth();
  const { bookings } = useBookings();

  if (!isAuthenticated) {
    return (
      <section className="container py-16">
        <div className="max-w-md mx-auto soft-card p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-primary-soft flex items-center justify-center">
            <UserIcon className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold">{t("profile_title")}</h2>
          <p className="text-muted-foreground text-sm">{t("profile_signin_hint")}</p>
          <Button onClick={demoLogin} disabled={isLoading} className="w-full gap-1.5">
            <LogIn className="w-4 h-4" /> {t("profile_login")}
          </Button>
        </div>
      </section>
    );
  }

  const myBookings = bookings.filter((b) => b.clientEmail === user?.email || b.id.startsWith("b") === false || b.clientName === user?.name);
  const list = myBookings.length ? myBookings : bookings.slice(0, 2);
  const active = list.find((b) => b.status === "new" || b.status === "paid");

  return (
    <section className="container py-12 md:py-16 space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center font-semibold text-lg">
            {user?.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{user?.name}</h2>
            <div className="text-sm text-muted-foreground">{user?.email} · workspace <span className="font-mono">{user?.workspaceId}</span></div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { expireSession(); }} className="gap-1.5">
            <AlertTriangle className="w-4 h-4" /> {t("profile_expire")}
          </Button>
          <Button variant="ghost" size="sm" onClick={logout}>{t("profile_logout")}</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="soft-card p-5 lg:col-span-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{t("profile_active")}</div>
          {active ? (
            <ActiveCard b={active} />
          ) : (
            <div className="text-sm text-muted-foreground py-4">{t("profile_no_booking")}</div>
          )}
        </div>

        <div className="soft-card p-5 lg:col-span-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{t("profile_history")}</div>
          <div className="divide-y divide-border">
            {list.map((b) => {
              const svc = services.find((s) => s.id === b.serviceId);
              return (
                <div key={b.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{svc && (locale === "ru" ? svc.titleRu : svc.titleEn)}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{b.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.time}</span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{formatRub(b.amountRub)}</div>
                  <StatusBadge status={b.status} />
                  <Button variant="ghost" size="sm" onClick={() => toast(t("profile_receipt"), { description: `paymentId: ${b.paymentId ?? "—"}` })}>
                    <FileText className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

const ActiveCard = ({ b }: { b: any }) => {
  const { locale } = useLocale();
  const svc = services.find((s) => s.id === b.serviceId);
  return (
    <div className="space-y-3">
      <div className="font-semibold">{svc && (locale === "ru" ? svc.titleRu : svc.titleEn)}</div>
      <div className="text-sm text-muted-foreground space-y-1">
        <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{b.date}</div>
        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{b.time}</div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <StatusBadge status={b.status} />
        <span className="font-semibold">{formatRub(b.amountRub)}</span>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const { locale } = useLocale();
  const map: Record<string, { cls: string; ru: string; en: string }> = {
    new: { cls: "bg-warning-soft text-warning", ru: "Новая", en: "New" },
    paid: { cls: "bg-success-soft text-success", ru: "Оплачено", en: "Paid" },
    cancelled: { cls: "bg-muted text-muted-foreground", ru: "Отменено", en: "Cancelled" },
  };
  const m = map[status];
  return <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${m.cls}`}>{locale === "ru" ? m.ru : m.en}</span>;
};

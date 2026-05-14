import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/providers/LocaleProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { services, formatRub, useBookings } from "@/providers/BookingsProvider";
import { useAuth } from "@/providers/AuthProvider";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Loader2,
  ShieldCheck,
  Calendar,
  Clock,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

const TIMES = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00"];

const nextDays = (count: number) => {
  const out: { date: string; label: string; weekday: string }[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    out.push({
      date: d.toISOString().slice(0, 10),
      label: String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0"),
      weekday: d.toLocaleDateString("ru-RU", { weekday: "short" }),
    });
  }
  return out;
};

export const Booking = ({ initialServiceId, onDone }: { initialServiceId?: string; onDone: () => void }) => {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const { addBooking, payBooking } = useBookings();
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(initialServiceId ?? services[1].id);
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [paymentMeta, setPaymentMeta] = useState<{ paymentId: string; idempotencyKey: string } | null>(null);

  useEffect(() => {
    if (initialServiceId) setServiceId(initialServiceId);
  }, [initialServiceId]);

  const days = useMemo(() => nextDays(10), []);
  const service = services.find((s) => s.id === serviceId)!;

  const canNext = [
    !!serviceId,
    !!date && !!time,
    name.trim().length > 1 && /\S+@\S+/.test(email) && phone.trim().length > 5,
    true,
  ];

  const submitBooking = () => {
    const result = addBooking({
      clientName: name,
      clientEmail: email,
      clientPhone: phone,
      serviceId,
      date,
      time,
      amountRub: service.depositRub,
      status: "new",
    });
    setBookingId(result.booking.id);
    setIdempotencyKey(result.idempotencyKey);
    setStep(3);
  };

  const handlePay = async () => {
    if (!bookingId || !idempotencyKey) return;
    setPaying(true);
    try {
      const meta = await payBooking(bookingId, idempotencyKey);
      setPaymentMeta({ paymentId: meta.paymentId, idempotencyKey: meta.idempotencyKey });
      toast.success(t("booking_success"), { description: t("booking_success_sub") });
    } catch {
      toast.error(locale === "ru" ? "Ошибка оплаты" : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const stepLabels = [t("booking_step1"), t("booking_step2"), t("booking_step3"), t("booking_step4")];

  return (
    <section className="container py-8 md:py-16">
      <h2 className="text-2xl md:text-4xl font-semibold tracking-tight mb-6 md:mb-8">
        {t("booking_title")}
      </h2>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 lg:gap-8">
        <div className="soft-card p-4 md:p-8">
          {/* Stepper — horizontally scrollable on mobile */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-2">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    i < step
                      ? "bg-success text-white"
                      : i === step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-xs sm:text-sm whitespace-nowrap ${i === step ? "font-semibold" : "text-muted-foreground"}`}>
                  {label}
                </span>
                {i < stepLabels.length - 1 && (
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setServiceId(s.id)}
                  className={`text-left p-4 rounded-lg border transition-all min-h-[80px] ${
                    serviceId === s.id
                      ? "border-primary bg-primary-soft"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="font-medium text-sm sm:text-base">
                    {locale === "ru" ? s.titleRu : s.titleEn}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t("booking_deposit")}: {formatRub(s.depositRub)}
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> {locale === "ru" ? "Дата" : "Date"}
                </Label>
                {/* Horizontal scroll for date picker on mobile */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
                  {days.map((d) => (
                    <button
                      key={d.date}
                      onClick={() => setDate(d.date)}
                      className={`flex-shrink-0 snap-start px-3 py-2.5 rounded-lg border text-center min-w-[72px] transition-colors min-h-[44px] ${
                        date === d.date
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <div className="text-[10px] uppercase opacity-70">{d.weekday}</div>
                      <div className="text-sm font-semibold">{d.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {locale === "ru" ? "Время" : "Time"}
                </Label>
                {/* Time slots: wrap on mobile */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {TIMES.map((tm) => (
                    <button
                      key={tm}
                      onClick={() => setTime(tm)}
                      className={`py-2.5 text-sm rounded-md border transition-colors min-h-[44px] ${
                        time === tm
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {tm}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <div className="sm:col-span-2">
                <Label htmlFor="bn">{t("booking_name")}</Label>
                <Input
                  id="bn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Анна"
                  className="text-base h-11" // 16px min font size to prevent iOS zoom
                />
              </div>
              <div>
                <Label htmlFor="bp">{t("booking_phone")}</Label>
                <Input
                  id="bp"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 999 000 00 00"
                  className="text-base h-11"
                />
              </div>
              <div>
                <Label htmlFor="be">{t("booking_email")}</Label>
                <Input
                  id="be"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@mail.ru"
                  className="text-base h-11"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 max-w-xl">
              {!paymentMeta ? (
                <>
                  <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
                    <Row k={locale === "ru" ? "Услуга" : "Service"} v={locale === "ru" ? service.titleRu : service.titleEn} />
                    <Row k={locale === "ru" ? "Когда" : "When"} v={`${date} • ${time}`} />
                    <Row k={locale === "ru" ? "Клиент" : "Client"} v={`${name} • ${phone}`} />
                    <Row k={t("booking_deposit")} v={formatRub(service.depositRub)} bold />
                  </div>
                  <Button
                    size="lg"
                    onClick={handlePay}
                    disabled={paying}
                    className="w-full gap-2 h-12 text-base"
                  >
                    {paying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    {t("booking_pay")} {formatRub(service.depositRub)}
                  </Button>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {locale === "ru"
                      ? "Mock-checkout. Реальная оплата не списывается."
                      : "Mock checkout. No real charge."}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 mx-auto rounded-full bg-success-soft flex items-center justify-center">
                    <Check className="w-8 h-8 text-success" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{t("booking_success")}</h3>
                    <p className="text-muted-foreground mt-1">{t("booking_success_sub")}</p>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono bg-muted rounded-md p-3 inline-block">
                    paymentId: {paymentMeta.paymentId}
                    <br />
                    idempotencyKey: {paymentMeta.idempotencyKey}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={onDone}>
                      {locale === "ru" ? "В кабинет" : "To profile"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step < 3 && (
            <div className="flex justify-between mt-8 gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="min-h-[44px]"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> {t("booking_back")}
              </Button>
              <Button
                onClick={() => (step === 2 ? submitBooking() : setStep(step + 1))}
                disabled={!canNext[step]}
                className="min-h-[44px]"
              >
                {t("booking_next")} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <aside className="space-y-4">
          <div className="soft-card p-5 space-y-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {locale === "ru" ? "Ваша бронь" : "Your booking"}
            </div>
            <div className="font-semibold">{locale === "ru" ? service.titleRu : service.titleEn}</div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> {date || "—"}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {time || "—"}
              </div>
              <div className="flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" /> {name || "—"}
              </div>
            </div>
            <div className="pt-3 border-t border-border flex items-end justify-between">
              <span className="text-xs text-muted-foreground">{t("booking_deposit")}</span>
              <span className="text-xl font-semibold">{formatRub(service.depositRub)}</span>
            </div>
          </div>
          <div className="soft-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              {t("dev_title")}
            </div>
            <pre className="text-[11px] font-mono text-muted-foreground leading-relaxed overflow-x-auto">
              {`{
  workspaceId: "ws_studio_42",
  amount:  ${service.depositRub},
  currency: "RUB",
  status:  "pending",
  idempotencyKey: <generated>
}`}
            </pre>
          </div>
        </aside>
      </div>
    </section>
  );
};

const Row = ({ k, v, bold }: { k: string; v: string; bold?: boolean }) => (
  <div className="flex justify-between gap-4">
    <span className="text-muted-foreground">{k}</span>
    <span className={bold ? "font-semibold" : ""}>{v}</span>
  </div>
);

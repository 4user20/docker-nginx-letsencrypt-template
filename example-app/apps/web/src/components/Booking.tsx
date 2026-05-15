import { useEffect, useMemo, useState, useRef } from "react";
import { useLocale } from "@/providers/LocaleProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRub, useBookings } from "@/providers/BookingsProvider";
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
  LogIn,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ReceiptModal } from "@/components/ReceiptModal";
import { LoginModal } from "@/components/LoginModal";
import { RegisterModal } from "@/components/RegisterModal";

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

// ── Slide direction for step transitions ──
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

export const Booking = ({ initialServiceId, onDone }: { initialServiceId?: string; onDone: () => void }) => {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const { services, addBooking, payBooking } = useBookings();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const prevStepRef = useRef(step);
  const [serviceId, setServiceId] = useState(initialServiceId ?? services[0]?.id ?? "");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [paymentMeta, setPaymentMeta] = useState<{ paymentId: string; idempotencyKey: string } | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  useEffect(() => {
    if (initialServiceId) setServiceId(initialServiceId);
  }, [initialServiceId]);

  // Track step direction for animation
  useEffect(() => {
    setDirection(step > prevStepRef.current ? 1 : -1);
    prevStepRef.current = step;
  }, [step]);

  const days = useMemo(() => nextDays(10), []);
  const service = services.find((s) => s.id === serviceId);
  if (!service) return null;

  // ── Real-time validation ──
  const fieldErrors = useMemo(() => {
    const errs: Record<string, string | null> = {};
    if (touched["name"]) {
      errs["name"] = name.trim().length < 2
        ? (locale === "ru" ? "Минимум 2 символа" : "At least 2 characters")
        : null;
    }
    if (touched["email"]) {
      errs["email"] = !/\S+@\S+\.\S+/.test(email)
        ? (locale === "ru" ? "Некорректный email" : "Invalid email")
        : null;
    }
    if (touched["phone"]) {
      const digits = phone.replace(/\D/g, "");
      errs["phone"] = digits.length < 6
        ? (locale === "ru" ? "Минимум 6 цифр" : "At least 6 digits")
        : null;
    }
    return errs;
  }, [name, email, phone, touched, locale]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

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
    toast.success(t("booking_success"), { description: t("booking_success_sub") });
    setStep(3);
  };

  const handlePay = async () => {
    if (!bookingId || !idempotencyKey) return;
    setPaying(true);
    try {
      const meta = await payBooking(bookingId, idempotencyKey);
      setPaymentMeta({ paymentId: meta.paymentId, idempotencyKey: meta.idempotencyKey });
      toast.success(t("booking_success"), {
        description:
          locale === "ru"
            ? "Платёж обработан. Чек готов."
            : "Payment processed. Receipt ready.",
      });
      // Open receipt modal after short delay
      setTimeout(() => setReceiptOpen(true), 500);
    } catch {
      toast.error(locale === "ru" ? "Ошибка оплаты" : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const stepLabels = [t("booking_step1"), t("booking_step2"), t("booking_step3"), t("booking_step4")];

  // Build booking object for receipt
  const receiptBooking = useMemo(() => {
    if (!paymentMeta || !bookingId) return null;
    return {
      id: bookingId,
      workspaceId: "ws_studio_42",
      clientName: name,
      clientEmail: email,
      clientPhone: phone,
      serviceId,
      date,
      time,
      amountRub: service.depositRub,
      status: "paid" as const,
      paymentId: paymentMeta.paymentId,
      idempotencyKey: paymentMeta.idempotencyKey,
      createdAt: Date.now(),
    };
  }, [paymentMeta, bookingId, name, email, phone, serviceId, date, time, service]);

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
                <motion.div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold relative ${
                    i < step
                      ? "bg-success text-white"
                      : i === step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                  animate={i === step ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </motion.div>
                <span className={`text-xs sm:text-sm whitespace-nowrap ${i === step ? "font-semibold" : "text-muted-foreground"}`}>
                  {label}
                </span>
                {i < stepLabels.length - 1 && (
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-muted rounded-full mb-6 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${((step + 1) / stepLabels.length) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>

          {/* Auth prompt banner (shown when not authenticated) */}
          {!user && !showAuthPrompt && (
            <motion.div
              className="mb-4 p-3 rounded-lg bg-primary-soft/60 border border-primary/20 flex items-center gap-2 text-xs"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AlertCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="flex-1 text-muted-foreground">
                {locale === "ru"
                  ? "Войдите, чтобы сохранить историю броней"
                  : "Sign in to save your booking history"}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={() => setLoginOpen(true)}
                >
                  <LogIn className="w-3 h-3" />
                  {locale === "ru" ? "Войти" : "Sign in"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setShowAuthPrompt(false)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Animated step content */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {step === 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setServiceId(s.id)}
                         className={`text-left p-4 rounded-xl border transition-all min-h-[80px] cursor-pointer hover:scale-[1.02] active:scale-[0.98] hover:shadow-md ${
                          serviceId === s.id
                            ? "border-primary/60 bg-primary/[0.12] text-primary font-medium shadow-sm ring-1 ring-primary/20"
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
                      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
                        {days.map((d) => (
                          <button
                            key={d.date}
                            onClick={() => setDate(d.date)}
                             className={`flex-shrink-0 snap-start px-3 py-2.5 rounded-xl border text-center min-w-[72px] transition-all min-h-[44px] cursor-pointer hover:scale-[1.02] active:scale-[0.98] hover:shadow-md ${
                              date === d.date
                                ? "border-primary/60 bg-primary/[0.12] text-primary font-semibold shadow-sm ring-1 ring-primary/20"
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
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                        {TIMES.map((tm) => (
                          <button
                            key={tm}
                            onClick={() => setTime(tm)}
                             className={`py-2.5 text-sm rounded-xl border transition-all min-h-[44px] cursor-pointer hover:scale-[1.02] active:scale-[0.98] hover:shadow-md ${
                              time === tm
                                ? "border-primary/60 bg-primary/[0.12] text-primary font-medium shadow-sm ring-1 ring-primary/20"
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
                        onBlur={() => handleBlur("name")}
                        placeholder="Анна"
                        className={`text-base h-11 ${touched["name"] && fieldErrors["name"] ? "border-destructive" : ""}`}
                      />
                      {touched["name"] && fieldErrors["name"] && (
                        <p className="text-xs text-destructive mt-1">{fieldErrors["name"]}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="bp">{t("booking_phone")}</Label>
                      <Input
                        id="bp"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onBlur={() => handleBlur("phone")}
                        placeholder="+7 999 000 00 00"
                        className={`text-base h-11 ${touched["phone"] && fieldErrors["phone"] ? "border-destructive" : ""}`}
                      />
                      {touched["phone"] && fieldErrors["phone"] && (
                        <p className="text-xs text-destructive mt-1">{fieldErrors["phone"]}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="be">{t("booking_email")}</Label>
                      <Input
                        id="be"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => handleBlur("email")}
                        placeholder="you@mail.ru"
                        className={`text-base h-11 ${touched["email"] && fieldErrors["email"] ? "border-destructive" : ""}`}
                      />
                      {touched["email"] && fieldErrors["email"] && (
                        <p className="text-xs text-destructive mt-1">{fieldErrors["email"]}</p>
                      )}
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
                      <motion.div
                        className="text-center py-8 space-y-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
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
                        <div className="flex flex-wrap gap-2 justify-center">
                          <Button variant="outline" onClick={() => setReceiptOpen(true)}>
                            {locale === "ru" ? "Чек" : "Receipt"}
                          </Button>
                          <Button variant="outline" onClick={onDone}>
                            {locale === "ru" ? "В кабинет" : "To profile"}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

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

      {/* Receipt Modal */}
      {receiptBooking && (
        <ReceiptModal
          booking={receiptBooking}
          paymentId={paymentMeta?.paymentId ?? ""}
          open={receiptOpen}
          onClose={() => setReceiptOpen(false)}
        />
      )}

      {/* Auth Modals */}
      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSwitchToRegister={() => { setLoginOpen(false); setRegisterOpen(true); }}
      />
      <RegisterModal
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSwitchToLogin={() => { setRegisterOpen(false); setLoginOpen(true); }}
      />
    </section>
  );
};

const Row = ({ k, v, bold }: { k: string; v: string; bold?: boolean }) => (
  <div className="flex justify-between gap-4">
    <span className="text-muted-foreground">{k}</span>
    <span className={bold ? "font-semibold" : ""}>{v}</span>
  </div>
);

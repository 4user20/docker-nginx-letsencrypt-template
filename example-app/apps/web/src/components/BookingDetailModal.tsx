import { useMemo } from "react";
import { useLocale } from "@/providers/LocaleProvider";
import { useBookings, formatRub, type Booking, type BookingStatus } from "@/providers/BookingsProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  User as UserIcon,
  Mail,
  Phone,
  CreditCard,
  Tag,
  Loader2,
  Check,
  X,
  ChevronRight,
  DollarSign,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  booking: Booking;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: BookingStatus) => void;
  onPay: (id: string, idempotencyKey: string) => Promise<void>;
  paying: boolean;
}

export const BookingDetailModal = ({ booking, open, onClose, onStatusChange, onPay, paying }: Props) => {
  const { locale } = useLocale();
  const { services } = useBookings();
  const service = services.find((s) => s.id === booking.serviceId);

  const statusColors: Record<BookingStatus, string> = {
    new: "bg-warning-soft text-warning border-warning/30",
    paid: "bg-success-soft text-success border-success/30",
    cancelled: "bg-muted text-muted-foreground border-border",
  };

  const statusLabels: Record<BookingStatus, { ru: string; en: string }> = {
    new: { ru: "Новая", en: "New" },
    paid: { ru: "Оплачено", en: "Paid" },
    cancelled: { ru: "Отменено", en: "Cancelled" },
  };

  const createdDate = useMemo(
    () =>
      new Date(booking.createdAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [booking.createdAt, locale],
  );

  const handlePayClick = async () => {
    if (!booking.idempotencyKey) {
      toast.error(locale === "ru" ? "Нет ключа идемпотентности" : "No idempotency key");
      return;
    }
    await onPay(booking.id, booking.idempotencyKey);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <DialogTitle className="text-lg">{booking.clientName}</DialogTitle>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusColors[booking.status]}`}
            >
              {locale === "ru" ? statusLabels[booking.status].ru : statusLabels[booking.status].en}
            </span>
          </div>
          <DialogDescription>
            {locale === "ru" ? "Детали бронирования" : "Booking details"}
          </DialogDescription>
        </DialogHeader>

        {/* Two-column grid info */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mt-2">
          {/* Service */}
          <div className="col-span-2 sm:col-span-1">
            <Label icon={Tag} text={locale === "ru" ? "Услуга" : "Service"} />
            <p className="font-medium">
              {service ? (locale === "ru" ? service.titleRu : service.titleEn) : "—"}
            </p>
          </div>

          {/* Amount */}
          <div className="col-span-2 sm:col-span-1">
            <Label icon={DollarSign} text={locale === "ru" ? "Сумма" : "Amount"} />
            <p className="font-semibold">{formatRub(booking.amountRub)}</p>
          </div>

          {/* Date & Time */}
          <div className="col-span-2 sm:col-span-1">
            <Label icon={Calendar} text={locale === "ru" ? "Дата" : "Date"} />
            <p className="font-medium">{booking.date}</p>
          </div>

          {/* Time */}
          <div className="col-span-2 sm:col-span-1">
            <Label icon={Clock} text={locale === "ru" ? "Время" : "Time"} />
            <p className="font-medium">{booking.time}</p>
          </div>

          {/* Client name */}
          <div className="col-span-2 sm:col-span-1">
            <Label icon={UserIcon} text={locale === "ru" ? "Клиент" : "Client"} />
            <p className="font-medium">{booking.clientName}</p>
          </div>

          {/* Email */}
          <div className="col-span-2 sm:col-span-1">
            <Label icon={Mail} text="Email" />
            <p className="font-medium break-all">{booking.clientEmail}</p>
          </div>

          {/* Phone */}
          <div className="col-span-2 sm:col-span-1">
            <Label icon={Phone} text={locale === "ru" ? "Телефон" : "Phone"} />
            <p className="font-medium">{booking.clientPhone}</p>
          </div>

          {/* Booking ID */}
          <div className="col-span-2 sm:col-span-1">
            <Label icon={Receipt} text="ID" />
            <p className="font-mono text-xs text-muted-foreground break-all">{booking.id}</p>
          </div>
        </div>

        {/* Payment section (if paid) */}
        {booking.status === "paid" && booking.paymentId && (
          <motion.div
            className="mt-4 p-3 rounded-lg bg-success-soft/50 border border-success/20 space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium text-success">
              <Check className="w-3.5 h-3.5" />
              {locale === "ru" ? "Оплачено" : "Paid"}
            </div>
            <div className="text-xs text-muted-foreground space-y-1 font-mono">
              <div className="flex justify-between">
                <span>paymentId:</span>
                <span className="text-foreground/70">{booking.paymentId}</span>
              </div>
              {booking.idempotencyKey && (
                <div className="flex justify-between">
                  <span>idempotencyKey:</span>
                  <span className="text-foreground/70">{booking.idempotencyKey}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Timeline */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            {locale === "ru" ? "Таймлайн" : "Timeline"}
          </div>
          <div className="space-y-3">
            <TimelineItem
              icon={<Check className="w-3.5 h-3.5" />}
              label={locale === "ru" ? "Создана" : "Created"}
              value={createdDate}
              active
            />
            {booking.status === "paid" && (
              <TimelineItem
                icon={<CreditCard className="w-3.5 h-3.5" />}
                label={locale === "ru" ? "Оплачена" : "Paid"}
                value={locale === "ru" ? "Подтверждено" : "Confirmed"}
                active
              />
            )}
            {booking.status === "cancelled" && (
              <TimelineItem
                icon={<X className="w-3.5 h-3.5" />}
                label={locale === "ru" ? "Отменена" : "Cancelled"}
                value={locale === "ru" ? "Отменено" : "Cancelled"}
                active
              />
            )}
            {booking.status === "new" && (
              <TimelineItem
                icon={<CreditCard className="w-3.5 h-3.5 text-muted-foreground" />}
                label={locale === "ru" ? "Ожидает оплаты" : "Awaiting payment"}
                value={locale === "ru" ? "Ожидание..." : "Pending..."}
                active={false}
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-3">
          {/* Status change dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {locale === "ru" ? "Статус:" : "Status:"}
            </span>
            <Select
              value={booking.status}
              onValueChange={(v) => onStatusChange(booking.id, v as BookingStatus)}
            >
              <SelectTrigger className="h-9 w-36 text-xs">
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

          {/* Mark as paid button (only for unpaid bookings) */}
          {booking.status !== "paid" && booking.idempotencyKey && (
            <Button
              size="sm"
              variant="default"
              onClick={handlePayClick}
              disabled={paying}
              className="gap-1.5"
            >
              {paying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CreditCard className="w-3.5 h-3.5" />
              )}
              {locale === "ru" ? "Отметить оплаченным" : "Mark as paid"}
            </Button>
          )}

          <div className="ml-auto">
            <Button variant="ghost" size="sm" onClick={onClose}>
              {locale === "ru" ? "Закрыть" : "Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Label helper ──
const Label = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
    <Icon className="w-3.5 h-3.5" />
    {text}
  </div>
);

// ── Timeline item ──
const TimelineItem = ({
  icon,
  label,
  value,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  active: boolean;
}) => (
  <div className="flex items-center gap-3">
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
        active ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"
      }`}
    >
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">{value}</div>
    </div>
  </div>
);

import { useLocale } from "@/providers/LocaleProvider";
import { services, formatRub, type Booking } from "@/providers/BookingsProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

interface Props {
  booking: Booking;
  paymentId: string;
  open: boolean;
  onClose: () => void;
}

export const ReceiptModal = ({ booking, paymentId, open, onClose }: Props) => {
  const { locale } = useLocale();
  const service = services.find((s) => s.id === booking.serviceId);
  const date = new Date(booking.createdAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm print:max-w-full print:shadow-none print:border-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>
            {locale === "ru" ? "Чек об оплате" : "Payment Receipt"}
          </DialogTitle>
          <DialogDescription>
            {locale === "ru" ? "Детали платежа" : "Payment details"}
          </DialogDescription>
        </DialogHeader>

        {/* Receipt body */}
        <div className="font-mono text-sm space-y-3 print:pt-4">
          {/* Header */}
          <div className="text-center pb-3 border-b-2 border-dashed border-border">
            <div className="text-lg font-semibold tracking-tight font-sans">
              SlotPay Studio
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {date}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <Row
              label={locale === "ru" ? "Услуга" : "Service"}
              value={service ? (locale === "ru" ? service.titleRu : service.titleEn) : "—"}
            />
            <Row
              label={locale === "ru" ? "Дата брони" : "Booking date"}
              value={`${booking.date} · ${booking.time}`}
            />
            <Row
              label={locale === "ru" ? "Клиент" : "Client"}
              value={booking.clientName}
            />
            <Row
              label="Email"
              value={booking.clientEmail}
            />
            <Row
              label={locale === "ru" ? "Телефон" : "Phone"}
              value={booking.clientPhone}
            />
          </div>

          <div className="border-t border-dashed border-border pt-2">
            <Row
              label={locale === "ru" ? "Сумма" : "Amount"}
              value={formatRub(booking.amountRub)}
              bold
            />
            <Row
              label={locale === "ru" ? "Статус" : "Status"}
              value={locale === "ru" ? "Оплачено" : "Paid"}
            />
          </div>

          {/* IDs */}
          <div className="border-t border-dashed border-border pt-2 text-[10px] text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>paymentId</span>
              <span className="text-foreground/60">{paymentId}</span>
            </div>
            <div className="flex justify-between">
              <span>bookingId</span>
              <span className="text-foreground/60">{booking.id}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-2 border-t-2 border-dashed border-border">
            <div className="text-[10px] text-muted-foreground">
              {locale === "ru" ? "Спасибо за оплату!" : "Thank you for your payment!"}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" className="flex-1 gap-1.5" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            {locale === "ru" ? "Печать" : "Print"}
          </Button>
          <Button variant="ghost" className="flex-1 gap-1.5" onClick={onClose}>
            <X className="w-4 h-4" />
            {locale === "ru" ? "Закрыть" : "Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className="flex justify-between gap-4">
    <span className="text-muted-foreground">{label}</span>
    <span className={bold ? "font-semibold font-sans" : ""}>{value}</span>
  </div>
);

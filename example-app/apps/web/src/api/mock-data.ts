import type { Service } from "./client";

export const services: Service[] = [
  {
    id: "svc_landing",
    titleRu: "Лендинг + форма заявки",
    titleEn: "Landing + lead form",
    descRu: "Одностраничный сайт с формой сбора заявок. Адаптивный дизайн, SEO-оптимизация, интеграция с CRM.",
    descEn: "Single-page website with lead collection form. Responsive design, SEO optimization, CRM integration.",
    priceFromRub: 35000,
    depositRub: 2000,
  },
  {
    id: "svc_booking",
    titleRu: "Онлайн-запись + личный кабинет",
    titleEn: "Online booking + client profile",
    descRu: "Система онлайн-записи с личным кабинетом клиента. Управление расписанием, напоминания, история записей.",
    descEn: "Online booking system with client personal account. Schedule management, reminders, booking history.",
    priceFromRub: 70000,
    depositRub: 3000,
  },
  {
    id: "svc_payment",
    titleRu: "Платёжный модуль + интеграция",
    titleEn: "Payment module + integration",
    descRu: "Интеграция платёжного шлюза с поддержкой предоплат и полных оплат. ЮKassa / CloudPayments.",
    descEn: "Payment gateway integration with prepayment and full payment support. YooKassa / CloudPayments.",
    priceFromRub: 90000,
    depositRub: 4000,
  },
  {
    id: "svc_miniapp",
    titleRu: "Telegram Mini App",
    titleEn: "Telegram Mini App",
    descRu: "Telegram Mini App с интерфейсом бронирования и оплаты. Оптимизировано для мобильных устройств.",
    descEn: "Telegram Mini App with booking and payment interface. Optimized for mobile devices.",
    priceFromRub: 120000,
    depositRub: 5000,
  },
];

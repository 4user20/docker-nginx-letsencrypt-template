import type { Service } from "./client";

export const services: Service[] = [
  {
    id: "svc_landing",
    titleRu: "Лендинг + форма заявки",
    titleEn: "Landing + lead form",
    descRu: "Адаптивный одностраничник под услугу, форма заявки, интеграция с почтой.",
    descEn: "Adaptive one-pager, lead form, email integration.",
    priceFromRub: 35000,
    depositRub: 2000,
  },
  {
    id: "svc_booking",
    titleRu: "Онлайн-запись + личный кабинет",
    titleEn: "Online booking + client profile",
    descRu: "Каталог услуг, выбор слотов, кабинет клиента с историей и чеками.",
    descEn: "Service catalog, slot picker, client profile with history and receipts.",
    priceFromRub: 70000,
    depositRub: 3000,
  },
  {
    id: "svc_payment",
    titleRu: "Mock / payment integration ready",
    titleEn: "Mock / payment integration ready",
    descRu: "Готовая интеграция с ЮKassa или CloudPayments, idempotency, серверные платежи.",
    descEn: "Ready integration with YooKassa or CloudPayments, idempotency, server-side payments.",
    priceFromRub: 90000,
    depositRub: 4000,
  },
  {
    id: "svc_miniapp",
    titleRu: "Mini App / Telegram-ready интерфейс",
    titleEn: "Mini App / Telegram-ready UI",
    descRu: "Тот же продукт как Telegram Mini App: бронь и оплата прямо в мессенджере.",
    descEn: "Same product as a Telegram Mini App: booking and pay inside the chat.",
    priceFromRub: 120000,
    depositRub: 5000,
  },
];

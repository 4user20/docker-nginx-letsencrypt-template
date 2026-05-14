export type Locale = "ru" | "en";

const STORAGE_KEY = "app_locale_code";

export const loadLocale = (): Locale => {
  if (typeof window === "undefined") return "ru";
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "en" || saved === "ru" ? saved : "ru";
};

export const saveLocale = (locale: Locale) => {
  localStorage.setItem(STORAGE_KEY, locale);
};

type Dict = Record<string, { ru: string; en: string }>;

export const dict: Dict = {
  // nav
  nav_landing: { ru: "Главная", en: "Home" },
  nav_services: { ru: "Услуги", en: "Services" },
  nav_booking: { ru: "Запись", en: "Booking" },
  nav_profile: { ru: "Кабинет", en: "Profile" },
  nav_admin: { ru: "Админка", en: "Admin" },
  // landing
  hero_badge: { ru: "Лендинг + запись + предоплата за 7 дней", en: "Landing + booking + prepay in 7 days" },
  hero_title: { ru: "Продающий сайт с онлайн-записью и оплатой брони", en: "Selling website with online booking & prepay" },
  hero_sub: {
    ru: "SlotPay Studio — готовый продукт для салона, обучения, консультаций или сервиса. Клиент выбирает услугу, бронирует слот и оплачивает депозит. Вы получаете заявку и оплату.",
    en: "SlotPay Studio is a ready product for studios, courses, consulting and services. Clients pick a slot and pay a deposit. You get the booking and the money.",
  },
  hero_cta_primary: { ru: "Забронировать услугу", en: "Book a service" },
  hero_cta_secondary: { ru: "Посмотреть демо", en: "View demo" },
  badge_booking: { ru: "запись", en: "booking" },
  badge_prepay: { ru: "предоплата", en: "prepay" },
  badge_profile: { ru: "личный кабинет", en: "client profile" },
  badge_admin: { ru: "админка", en: "admin panel" },
  widget_title: { ru: "Ближайшие слоты", en: "Upcoming slots" },
  widget_total: { ru: "К оплате", en: "To pay" },
  widget_status_paid: { ru: "Оплачено", en: "Paid" },
  widget_status_pending: { ru: "Ожидает оплаты", en: "Awaiting payment" },
  // services
  services_title: { ru: "Услуги и стоимость", en: "Services & pricing" },
  services_sub: { ru: "Проектные цены в рублях. Без подписок и скрытых платежей.", en: "Project pricing in RUB. No subscriptions, no hidden fees." },
  services_from: { ru: "от", en: "from" },
  services_choose: { ru: "Выбрать", en: "Choose" },
  // booking
  booking_title: { ru: "Онлайн-запись", en: "Online booking" },
  booking_step1: { ru: "Услуга", en: "Service" },
  booking_step2: { ru: "Дата и время", en: "Date & time" },
  booking_step3: { ru: "Контакты", en: "Contacts" },
  booking_step4: { ru: "Оплата", en: "Payment" },
  booking_name: { ru: "Имя", en: "Name" },
  booking_phone: { ru: "Телефон", en: "Phone" },
  booking_email: { ru: "Email", en: "Email" },
  booking_next: { ru: "Далее", en: "Next" },
  booking_back: { ru: "Назад", en: "Back" },
  booking_pay: { ru: "Оплатить", en: "Pay" },
  booking_deposit: { ru: "Депозит брони", en: "Booking deposit" },
  booking_success: { ru: "Бронь подтверждена", en: "Booking confirmed" },
  booking_success_sub: { ru: "Мы отправили подтверждение и чек.", en: "We sent the confirmation and the receipt." },
  // profile
  profile_title: { ru: "Личный кабинет", en: "Client profile" },
  profile_login: { ru: "Войти в демо", en: "Sign in to demo" },
  profile_logout: { ru: "Выйти", en: "Sign out" },
  profile_active: { ru: "Активная бронь", en: "Active booking" },
  profile_history: { ru: "История заявок", en: "Booking history" },
  profile_receipt: { ru: "Чек", en: "Receipt" },
  profile_expire: { ru: "Симулировать истёкшую сессию", en: "Simulate expired session" },
  profile_no_booking: { ru: "Нет активных броней", en: "No active bookings" },
  profile_signin_hint: { ru: "Войдите, чтобы увидеть свои брони и историю.", en: "Sign in to see your bookings and history." },
  // admin
  admin_title: { ru: "Админ-панель", en: "Admin dashboard" },
  admin_kpi_today: { ru: "Заявки сегодня", en: "Today’s bookings" },
  admin_kpi_paid: { ru: "Оплачено", en: "Paid" },
  admin_kpi_conv: { ru: "Конверсия", en: "Conversion" },
  admin_kpi_avg: { ru: "Средний чек", en: "Avg. ticket" },
  admin_filter_all: { ru: "Все", en: "All" },
  admin_filter_new: { ru: "Новые", en: "New" },
  admin_filter_paid: { ru: "Оплачено", en: "Paid" },
  admin_filter_cancel: { ru: "Отменено", en: "Cancelled" },
  admin_search: { ru: "Поиск по имени или услуге…", en: "Search by name or service…" },
  admin_table_client: { ru: "Клиент", en: "Client" },
  admin_table_service: { ru: "Услуга", en: "Service" },
  admin_table_when: { ru: "Когда", en: "When" },
  admin_table_amount: { ru: "Сумма", en: "Amount" },
  admin_table_status: { ru: "Статус", en: "Status" },
  admin_table_actions: { ru: "Действия", en: "Actions" },
  admin_revenue_by: { ru: "Выручка по услугам", en: "Revenue by service" },
  // trust
  trust_title: { ru: "Готово к продакшену", en: "Production ready" },
  trust_sub: { ru: "Архитектура, которую можно подключить к боевым сервисам без переписывания.", en: "Architecture you can connect to live services without a rewrite." },
  // session expired
  expired_title: { ru: "Сессия истекла", en: "Session expired" },
  expired_sub: { ru: "Войдите снова, чтобы продолжить.", en: "Please sign in again to continue." },
  expired_ok: { ru: "Понятно", en: "Got it" },
  // dev drawer
  dev_title: { ru: "Технические детали платежа", en: "Payment technical details" },
};

export const t = (key: keyof typeof dict, locale: Locale): string => {
  return dict[key]?.[locale] ?? String(key);
};

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import * as api from "@/api/client";
import { useAuth } from "./AuthProvider";
import { services as mockServices } from "@/api/mock-data";

export type BookingStatus = "new" | "paid" | "cancelled";

// Re-export api types for convenience
export type { Service, Booking, CreateBookingData } from "@/api/client";

export const formatRub = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

interface BookingsCtx {
  bookings: api.Booking[];
  services: api.Service[];
  isLoading: boolean;
  addBooking: (b: api.CreateBookingData) => { booking: api.Booking; idempotencyKey: string };
  setStatus: (id: string, status: BookingStatus) => void;
  payBooking: (id: string, idempotencyKey: string) => Promise<{ paymentId: string; idempotencyKey: string; status: string }>;
}

const Ctx = createContext<BookingsCtx | null>(null);

export const BookingsProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<api.Booking[]>([]);
  const [services, setServices] = useState<api.Service[]>(mockServices);
  const [isLoading, setLoading] = useState(false);

  // Fetch services from API on mount (fall back to mock data)
  useEffect(() => {
    api.getServices()
      .then((res) => { if (res.services.length > 0) setServices(res.services); })
      .catch(() => { /* keep mock data */ });
  }, []);

  // Fetch bookings from API when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setBookings([]);
      return;
    }
    setLoading(true);
    api
      .getBookings()
      .then((res) => setBookings(res.bookings))
      .catch(() => {
        // Fail silently — the app will show an empty state
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const addBooking = useCallback<BookingsCtx["addBooking"]>((b) => {
    // Optimistically create via API; fall back to local-only if the call fails
    const tempId = "b_" + Math.random().toString(36).slice(2, 8);
    const idempotencyKey = "idm_" + Math.random().toString(36).slice(2, 8);
    const optimistic: api.Booking = {
      ...b,
      id: tempId,
      workspaceId: "ws_studio_42",
      createdAt: Date.now(),
      idempotencyKey,
    };

    setBookings((prev) => [optimistic, ...prev]);

    api.createBooking(b).then((res) => {
      setBookings((prev) =>
        prev.map((bk) => (bk.id === tempId ? { ...res.booking, idempotencyKey: res.idempotencyKey } : bk)),
      );
    }).catch(() => {
      // API failed — keep the optimistic booking
    });

    return { booking: optimistic, idempotencyKey };
  }, []);

  const setStatus = useCallback((id: string, status: BookingStatus) => {
    // Optimistic update
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    api.updateBookingStatus(id, status).catch(() => {
      // Revert on failure by re-fetching
      api.getBookings().then((res) => setBookings(res.bookings)).catch(() => {});
    });
  }, []);

  const payBooking = useCallback<BookingsCtx["payBooking"]>(async (id, idempotencyKey) => {
    const res = await api.payBooking(id, idempotencyKey);
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, status: "paid" as BookingStatus, paymentId: res.paymentId, idempotencyKey: res.idempotencyKey }
          : b,
      ),
    );
    return res;
  }, []);

  const value = useMemo(
    () => ({ bookings, services, isLoading, addBooking, setStatus, payBooking }),
    [bookings, services, isLoading, addBooking, setStatus, payBooking],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useBookings = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBookings must be used within BookingsProvider");
  return ctx;
};

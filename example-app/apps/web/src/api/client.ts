// ──────────────────────────────────────────────
// SlotPay Studio API client
// ──────────────────────────────────────────────

import type { BookingStatus } from "@/providers/BookingsProvider";

// ── Types matching the backend contract ────────

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: string;
  workspaceId: string;
}

export interface Service {
  id: string;
  titleRu: string;
  titleEn: string;
  descRu: string;
  descEn: string;
  priceFromRub: number;
  depositRub: number;
}

export interface Booking {
  id: string;
  workspaceId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: string;
  date: string;
  time: string;
  amountRub: number;
  status: BookingStatus;
  paymentId?: string;
  idempotencyKey?: string;
  createdAt: number;
}

export interface CreateBookingData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: string;
  date: string;
  time: string;
  amountRub: number;
  status: BookingStatus;
}

export interface StatsData {
  todayCount: number;
  paidCount: number;
  conversion: number;
  avgTicket: number;
  revenueByService: { serviceId: string; amount: number }[];
}

// ── Auth response types ────────────────────────

interface AuthResponse {
  token: string;
  user: DemoUser;
}

// ── API client ─────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Request failed: ${res.statusText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

// ── Auth ───────────────────────────────────────

export const demoLogin = () =>
  request<AuthResponse>("/api/auth/demo-login", {
    method: "POST",
    body: JSON.stringify({}),
  });

export const loginWithPassword = (email: string, password: string) =>
  request<AuthResponse>("/api/auth/login-with-password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const register = (data: { name: string; email: string; password: string }) =>
  request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getMe = () => request<DemoUser>("/api/me");

export const logout = () =>
  request<void>("/api/auth/logout", {
    method: "POST",
  });

// ── Services ───────────────────────────────────

export const getServices = () =>
  request<{ services: Service[] }>("/api/services");

export const updateService = (id: string, data: { titleRu?: string; titleEn?: string; priceFromRub?: number }) =>
  request<{ service: Service }>(`/api/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

// ── Bookings ───────────────────────────────────

export const getBookings = (params?: { status?: string; search?: string }) => {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.search) qs.set("search", params.search);
  const q = qs.toString();
  return request<{ bookings: Booking[] }>(`/api/bookings${q ? `?${q}` : ""}`);
};

export const createBooking = (data: CreateBookingData) =>
  request<{ booking: Booking; idempotencyKey: string }>("/api/bookings", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateBookingStatus = (id: string, status: string) =>
  request<{ booking: Booking }>(`/api/bookings/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const payBooking = (id: string, idempotencyKey: string) =>
  request<{ paymentId: string; idempotencyKey: string; status: string }>(
    `/api/bookings/${id}/pay`,
    {
      method: "POST",
      body: JSON.stringify({ idempotencyKey }),
    },
  );

// ── Stats ──────────────────────────────────────

export const getStats = () => request<StatsData>("/api/stats");

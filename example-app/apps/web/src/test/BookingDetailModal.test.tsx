import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BookingDetailModal } from "@/components/BookingDetailModal";
import { LocaleProvider } from "@/providers/LocaleProvider";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const mockBooking = {
  id: "b_abc123",
  workspaceId: "ws_studio_42",
  clientName: "Анна Тестова",
  clientEmail: "anna@test.ru",
  clientPhone: "+7 999 111 22 33",
  serviceId: "svc_booking",
  date: "2026-05-20",
  time: "14:30",
  amountRub: 3000,
  status: "new" as const,
  createdAt: Date.now() - 86400000,
};

const mockBookingPaid = {
  ...mockBooking,
  status: "paid" as const,
  paymentId: "pay_987xyz",
  idempotencyKey: "idm_abc123",
};

describe("BookingDetailModal", () => {
  it("renders booking client name and email when open", () => {
    render(
      <LocaleProvider>
        <BookingDetailModal
          booking={mockBooking}
          open={true}
          onClose={vi.fn()}
          onStatusChange={vi.fn()}
          onPay={vi.fn()}
          paying={false}
        />
      </LocaleProvider>
    );
    // Name appears in the dialog title
    expect(screen.getByRole("heading", { name: "Анна Тестова" })).toBeInTheDocument();
    // Email appears as text
    expect(screen.getAllByText("anna@test.ru").length).toBeGreaterThanOrEqual(1);
  });

  it("shows payment info when booking is paid", () => {
    render(
      <LocaleProvider>
        <BookingDetailModal
          booking={mockBookingPaid}
          open={true}
          onClose={vi.fn()}
          onStatusChange={vi.fn()}
          onPay={vi.fn()}
          paying={false}
        />
      </LocaleProvider>
    );
    expect(screen.getByText("pay_987xyz")).toBeInTheDocument();
  });

  it("renders status change select", () => {
    render(
      <LocaleProvider>
        <BookingDetailModal
          booking={mockBooking}
          open={true}
          onClose={vi.fn()}
          onStatusChange={vi.fn()}
          onPay={vi.fn()}
          paying={false}
        />
      </LocaleProvider>
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Booking } from "@/components/Booking";
import { LocaleProvider } from "@/providers/LocaleProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { BookingsProvider } from "@/providers/BookingsProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const queryClient = new QueryClient();

const renderBooking = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <AuthProvider>
          <BookingsProvider>
            <Booking onDone={vi.fn()} />
          </BookingsProvider>
        </AuthProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );

describe("Booking", () => {
  beforeEach(() => {
    localStorage.setItem("app_locale_code", "en");
  });

  it("renders booking title", () => {
    renderBooking();
    expect(screen.getByText("Online booking")).toBeInTheDocument();
  });

  it("shows login prompt when not authenticated", () => {
    renderBooking();
    // The banner should contain "Sign in" text (in the message or button)
    const signInElements = screen.getAllByText(/sign in/i);
    expect(signInElements.length).toBeGreaterThanOrEqual(1);
    // Also verify the descriptive message is present
    expect(screen.getByText(/save your booking history/i)).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RegisterModal } from "@/components/RegisterModal";
import { LocaleProvider } from "@/providers/LocaleProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const queryClient = new QueryClient();

beforeEach(() => {
  localStorage.setItem("app_locale_code", "en");
});

describe("RegisterModal", () => {
  it("renders heading when open", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <AuthProvider>
            <RegisterModal open={true} onOpenChange={vi.fn()} onSwitchToLogin={vi.fn()} />
          </AuthProvider>
        </LocaleProvider>
      </QueryClientProvider>
    );
    expect(
      screen.getByRole("heading", { name: "Create Account" })
    ).toBeInTheDocument();
  });

  it("renders name, email, password, and confirm password fields", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <AuthProvider>
            <RegisterModal open={true} onOpenChange={vi.fn()} onSwitchToLogin={vi.fn()} />
          </AuthProvider>
        </LocaleProvider>
      </QueryClientProvider>
    );
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("shows sign in link", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <AuthProvider>
            <RegisterModal open={true} onOpenChange={vi.fn()} onSwitchToLogin={vi.fn()} />
          </AuthProvider>
        </LocaleProvider>
      </QueryClientProvider>
    );
    expect(
      screen.getByRole("button", { name: "Sign in" })
    ).toBeInTheDocument();
  });

  it("does not render admin demo checkbox (removed)", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <AuthProvider>
            <RegisterModal open={true} onOpenChange={vi.fn()} onSwitchToLogin={vi.fn()} />
          </AuthProvider>
        </LocaleProvider>
      </QueryClientProvider>
    );
    expect(
      screen.queryByRole("checkbox", { name: /admin demo/i })
    ).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginModal } from "@/components/LoginModal";
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

describe("LoginModal", () => {
  it("renders heading when open", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <AuthProvider>
            <LoginModal open={true} onOpenChange={vi.fn()} onSwitchToRegister={vi.fn()} />
          </AuthProvider>
        </LocaleProvider>
      </QueryClientProvider>
    );
    expect(
      screen.getByRole("heading", { name: "Sign In" })
    ).toBeInTheDocument();
  });

  it("renders email and password fields", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <AuthProvider>
            <LoginModal open={true} onOpenChange={vi.fn()} onSwitchToRegister={vi.fn()} />
          </AuthProvider>
        </LocaleProvider>
      </QueryClientProvider>
    );
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("shows register link", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <AuthProvider>
            <LoginModal open={true} onOpenChange={vi.fn()} onSwitchToRegister={vi.fn()} />
          </AuthProvider>
        </LocaleProvider>
      </QueryClientProvider>
    );
    // The "Register" text is the register link button text
    const registerBtn = screen.getByRole("button", { name: "Register" });
    expect(registerBtn).toBeInTheDocument();
  });

  it("shows demo login button", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <AuthProvider>
            <LoginModal open={true} onOpenChange={vi.fn()} onSwitchToRegister={vi.fn()} />
          </AuthProvider>
        </LocaleProvider>
      </QueryClientProvider>
    );
    expect(
      screen.getByRole("button", { name: "Sign in with demo" })
    ).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/providers/AuthProvider";
import { LocaleProvider } from "@/providers/LocaleProvider";

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

const queryClient = new QueryClient();

describe("AuthProvider import", () => {
  it("can render with nested AuthProvider", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <AuthProvider><div>test</div></AuthProvider>
        </LocaleProvider>
      </QueryClientProvider>
    );
    expect(screen.getByText("test")).toBeInTheDocument();
  });
});

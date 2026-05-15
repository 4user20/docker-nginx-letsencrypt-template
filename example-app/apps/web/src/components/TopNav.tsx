import { useState } from "react";
import { useLocale } from "@/providers/LocaleProvider";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Languages, LogOut, Menu, Moon, Sparkles, Sun, X } from "lucide-react";
import { Locale } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { LoginModal } from "./LoginModal";
import { RegisterModal } from "./RegisterModal";
import { useTheme } from "next-themes";
import { useEffect, useState as ReactUseState } from "react";

interface Props {
  active: string;
  onNavigate: (id: string) => void;
}

const tabs: { id: string; key: any }[] = [
  { id: "home", key: "nav_landing" },
  { id: "services", key: "nav_services" },
  { id: "booking", key: "nav_booking" },
  { id: "profile", key: "nav_profile" },
  { id: "admin", key: "nav_admin" },
];

export const TopNav = ({ active, onNavigate }: Props) => {
  const { locale, setLocale, t } = useLocale();
  const { isAuthenticated, user, logout, demoLogin, isLoading } = useAuth();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = ReactUseState(false);

  useEffect(() => setMounted(true), []);

  const toggle = () => setLocale(locale === "ru" ? "en" : ("ru" as Locale));

  const handleNav = (id: string) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  const handleDemoLogin = async () => {
    try {
      await demoLogin();
      toast.success(
        locale === "ru" ? "Добро пожаловать!" : "Welcome!",
        { description: locale === "ru" ? "Вы вошли в демо-режиме." : "You signed in as a demo user." },
      );
    } catch {
      toast.error(locale === "ru" ? "Ошибка входа" : "Login failed");
    }
  };

  const handleLogout = () => {
    logout();
    toast.info(locale === "ru" ? "Вы вышли из системы" : "Signed out");
  };

  return (
    <header className="sticky top-0 z-40 glass">
      <div className="container flex h-16 items-center gap-2">
        {/* Logo */}
        <button
          onClick={() => handleNav("home")}
          className="flex items-center gap-2 font-semibold tracking-tight min-h-[44px]"
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="text-sm sm:text-base">
            SlotPay{" "}
            <span className="text-muted-foreground font-normal font-heading">Studio</span>
          </span>
        </button>

        {/* Desktop nav */}
        {!isMobile && (
          <nav className="flex items-center gap-1 ml-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleNav(tab.id)}
                className={`min-h-[44px] px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active === tab.id
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {t(tab.key)}
              </button>
            ))}
          </nav>
        )}

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="min-h-[44px] min-w-[44px] rounded-full"
              aria-label={locale === "ru" ? "Переключить тему" : "Toggle theme"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={toggle} className="gap-1.5 min-h-[44px]">
            <Languages className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">{locale}</span>
          </Button>

          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 min-h-[44px]"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline truncate max-w-[100px]">{user?.name}</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setLoginOpen(true)}
              disabled={isLoading}
              className="gap-1.5 min-h-[44px]"
            >
              <Sparkles className="w-4 h-4" />
              {t("profile_login")}
            </Button>
          )}

          {/* Mobile hamburger */}
          {isMobile && (
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <span className="font-semibold text-sm font-heading">SlotPay Studio</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMobileOpen(false)}
                      className="min-h-[44px] min-w-[44px]"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <nav className="flex-1 p-2 space-y-1">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleNav(tab.id)}
                        className={`w-full text-left min-h-[44px] px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                          active === tab.id
                            ? "bg-primary-soft text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {t(tab.key)}
                      </button>
                    ))}
                  </nav>
                  <div className="p-4 border-t border-border space-y-2">
                    {mounted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="w-full gap-2"
                      >
                        {theme === "dark" ? (
                          <><Sun className="w-4 h-4" /> Light mode</>
                        ) : (
                          <><Moon className="w-4 h-4" /> Dark mode</>
                        )}
                      </Button>
                    )}
                    {isAuthenticated ? (
                      <div className="text-xs text-muted-foreground px-2">
                        {user?.name} · {user?.email}
                      </div>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => { setLoginOpen(true); setMobileOpen(false); }}
                          disabled={isLoading}
                          className="w-full gap-1.5"
                        >
                          <Sparkles className="w-4 h-4" />
                          {t("profile_login")}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          <button
                            onClick={() => { handleDemoLogin(); setMobileOpen(false); }}
                            className="hover:text-foreground underline underline-offset-2"
                          >
                            {locale === "ru" ? "Демо-доступ" : "Demo access"}
                          </button>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      {/* Auth Modals */}
      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSwitchToRegister={() => { setLoginOpen(false); setRegisterOpen(true); }}
      />
      <RegisterModal
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSwitchToLogin={() => { setRegisterOpen(false); setLoginOpen(true); }}
      />
    </header>
  );
};

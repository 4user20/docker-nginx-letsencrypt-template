import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Landing } from "@/components/Landing";
import { Services } from "@/components/Services";
import { Booking } from "@/components/Booking";
import { Profile } from "@/components/Profile";
import { Admin } from "@/components/Admin";
import { TrustBlock } from "@/components/TrustBlock";
import { SessionExpiredModal } from "@/components/SessionExpiredModal";
import { LocaleProvider, useLocale } from "@/providers/LocaleProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { BookingsProvider } from "@/providers/BookingsProvider";

const Shell = () => {
  const [view, setView] = useState("home");
  const [preselectedService, setPreselectedService] = useState<string | undefined>();
  const { locale } = useLocale();

  const navigate = (id: string) => {
    setView(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const chooseService = (serviceId: string) => {
    setPreselectedService(serviceId);
    navigate("booking");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav active={view} onNavigate={navigate} />

      <main className="flex-1">
        {view === "home" && (
          <>
            <Landing onNavigate={navigate} />
            <Services onChoose={chooseService} />
            <TrustBlock />
          </>
        )}
        {view === "services" && <Services onChoose={chooseService} />}
        {view === "booking" && <Booking initialServiceId={preselectedService} onDone={() => navigate("profile")} />}
        {view === "profile" && <Profile />}
        {view === "admin" && <Admin />}
      </main>

      <footer className="border-t border-border py-6 md:py-8 mt-6 md:mt-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div>© 2026 SlotPay Studio · {locale === "ru" ? "демонстрационный продукт" : "demo product"}</div>
          <div className="font-mono">v1.0 · mock-mode</div>
        </div>
      </footer>

      <SessionExpiredModal />
    </div>
  );
};

const Index = () => (
  <LocaleProvider>
    <AuthProvider>
      <BookingsProvider>
        <Shell />
      </BookingsProvider>
    </AuthProvider>
  </LocaleProvider>
);

export default Index;

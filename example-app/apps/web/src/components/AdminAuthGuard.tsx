import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";
import { Button } from "@/components/ui/button";
import { ShieldOff, LogIn, User } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export const AdminAuthGuard = ({ children }: Props) => {
  const { isAuthenticated, user, demoLogin, isLoading } = useAuth();
  const { t } = useLocale();

  if (isLoading) {
    return (
      <section className="container py-16">
        <div className="max-w-md mx-auto soft-card p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-10 mx-auto rounded-full bg-muted" />
            <div className="h-6 w-40 mx-auto rounded bg-muted" />
            <div className="h-4 w-56 mx-auto rounded bg-muted" />
          </div>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="container py-16">
        <div className="max-w-md mx-auto soft-card p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center">
            <ShieldOff className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold">{t("admin_title")}</h2>
          <p className="text-muted-foreground text-sm">
            Please sign in as admin to access the dashboard.
          </p>
          <Button onClick={demoLogin} disabled={isLoading} className="w-full gap-1.5">
            <LogIn className="w-4 h-4" /> {t("profile_login")}
          </Button>
        </div>
      </section>
    );
  }

  // Logged in but not admin (all users in demo are treated as non-admin clients by default)
  // In a real app, this would check user.role === "admin"
  // For demo purposes, we grant admin access to any authenticated user
  // but keep the guard pattern for production readiness

  return <>{children}</>;
};

export const AdminRequired = ({ children }: Props) => {
  const { isAuthenticated, user } = useAuth();
  const { t, locale } = useLocale();

  if (isAuthenticated && user) {
    // In a real app, we'd check for admin role here
    // For demo, treat workspace "ws_studio_42" users as admins
    const isAdmin = user.workspaceId === "ws_studio_42";
    if (!isAdmin) {
      return (
        <section className="container py-16">
          <div className="max-w-md mx-auto soft-card p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-warning-soft flex items-center justify-center">
              <User className="w-7 h-7 text-warning" />
            </div>
            <h2 className="text-2xl font-semibold">
              {locale === "ru" ? "Доступ ограничен" : "Access restricted"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {locale === "ru"
                ? "Эта страница доступна только администраторам."
                : "This page is only accessible to administrators."}
            </p>
          </div>
        </section>
      );
    }
  }

  return <>{children}</>;
};

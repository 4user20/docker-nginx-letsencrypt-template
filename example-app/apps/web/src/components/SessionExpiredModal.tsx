import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export const SessionExpiredModal = () => {
  const { sessionExpired, dismissExpired } = useAuth();
  const { t } = useLocale();
  return (
    <Dialog open={sessionExpired} onOpenChange={(o) => !o && dismissExpired()}>
      <DialogContent>
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-warning-soft text-warning flex items-center justify-center mb-2">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <DialogTitle>{t("expired_title")}</DialogTitle>
          <DialogDescription>{t("expired_sub")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={dismissExpired}>{t("expired_ok")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

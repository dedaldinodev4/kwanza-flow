"use client";

import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { useAppActions } from "@/providers/app-data-provider";
import { useMessage } from "@/hooks/use-i18n";

export function ResetDemoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { resetDemoData } = useAppActions();
  const message = useMessage()

  function confirm() {
    const result = resetDemoData();
    if (result.ok) toast.success(t("Demo data restored"));
    else toast.warning(t("{{error}} Demo data was restored for this session only.", {
      error: message(result.error, result.params)
    }));
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
      {open && (
        <AlertDialogContent
          title={t("Reset demo data?")}
          description={t("Everything you added or changed will be replaced with fresh demo data: transactions, budgets, goals and your profile settings. Your theme and language choices are kept. This cannot be undone.")}
          confirmLabel={t("Reset demo data")}
          onConfirm={confirm}
        />
      )}
    </AlertDialog>
  );
}

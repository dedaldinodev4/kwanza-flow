"use client";

import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { useAppActions } from "@/providers/app-data-provider";
import { message  } from "@/i18n/utils";

export function ResetDemoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { resetDemoData } = useAppActions();

  function confirm() {
    const result = resetDemoData();
    if (result.ok) toast.success(message("Demo data restored"));
    else toast.warning(`${result.error} Demo data was restored for this session only.`);
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
      {open && (
        <AlertDialogContent
          title={t("Reset demo data?")}
          description={t("Everything you added or changed will be replaced with fresh demo data: transactions, budgets, goals and your profile settings. Your theme choice is kept. This cannot be undone.")}
          confirmLabel={t("Reset demo data")}
          onConfirm={confirm}
        />
      )}
    </AlertDialog>
  );
}

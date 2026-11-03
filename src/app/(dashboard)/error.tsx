"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

/** Error boundary for the dashboard routes: the shell and navigation stay usable. */
export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className="rounded-card bg-card mx-auto mt-10 max-w-md border p-6 text-center"
    >
      <AlertTriangle aria-hidden className="text-warning mx-auto size-8" />
      <h1 className="text-section mt-3">{t("Something went wrong")}</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        {t(
          "This page could not be displayed. Your data is stored in this browser and has not been changed.",
        )}
      </p>
      <Button className="mt-4" onClick={reset}>
        {t("Try again")}
      </Button>
    </div>
  );
}

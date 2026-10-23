"use client";

import { useTranslation } from "react-i18next";

export function SkipLink() {
  const { t } = useTranslation();
  return (
    <a
      href="#main"
      className="rounded-control bg-primary text-primary-foreground sr-only z-50 px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      {t("Skip to main content")}
    </a>
  );
}

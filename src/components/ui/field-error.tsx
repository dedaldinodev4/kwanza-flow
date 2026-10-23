"use client";

import { useTranslation } from "react-i18next";

export function FieldError({ id, message }: { id: string; message?: string }) {
  const { t } = useTranslation();
  if (!message) return null;
  return (
    <p id={id} className="text-caption text-destructive mt-1.5 font-medium">
      {t(message)}
    </p>
  );
}

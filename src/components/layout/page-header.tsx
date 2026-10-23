"use client"

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-page-title">{t(title)}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{t(description)}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

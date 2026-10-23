"use client";

import { useTranslation } from "react-i18next";
import { useLanguage } from "@/providers/i18n-provider";
import { LANGUAGES, LANGUAGE_LABELS } from "@/i18n/languages";
import { cn } from "@/lib/utils";

/**
 * Two toggle buttons. Each language is named in ITSELF and carries its own `lang`, so a screen reader pronounces
 * "Português" correctly even while the page is in English. The header variant shows codes to save space; its
 * accessible name starts with the visible code (WCAG "label in name").
 */
export function LanguageSwitcher({ variant }: { variant: "sidebar" | "header" }) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t("Language")}
      className={cn(
        "flex gap-1 p-1",
        variant === "sidebar" ? "rounded-control bg-sidebar-active/60 mb-3" : "rounded-full border",
      )}
    >
      {LANGUAGES.map((code) => {
        const active = language === code;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={active}
            aria-label={
              variant === "header" ? `${code.toUpperCase()} – ${LANGUAGE_LABELS[code]}` : undefined
            }
            onClick={() => setLanguage(code)}
            className={cn(
              "transition-ui min-h-9 font-semibold",
              variant === "sidebar"
                ? cn(
                  "rounded-control focus-visible:outline-sidebar-ring flex-1 px-2 text-xs",
                  active
                    ? "bg-sidebar-foreground text-sidebar"
                    : "text-sidebar-muted hover:text-sidebar-foreground",
                )
                : cn(
                  "rounded-full px-3 text-xs",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ),
            )}
          >
            {variant === "header" ? code.toUpperCase() : LANGUAGE_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}

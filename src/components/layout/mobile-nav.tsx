"use client";

import { useTranslation } from "react-i18next";
import { Brand } from "./brand";
import { LanguageSwitcher } from "./language-switcher";
import { NavLinks } from "./nav-links";


export function MobileHeader() {
  const { t } = useTranslation();
  return (
    <header className="bg-card flex h-14 items-center justify-between border-b px-4 lg:hidden">
      <Brand />
      <div className="flex items-center gap-2">
        <LanguageSwitcher variant="header" />
        <span className="bg-warning-surface text-caption text-warning rounded-full px-2.5 py-1 font-medium">
          {t("Local demo")}
        </span>
      </div>
    </header>
  );
}


export function MobileTabBar() {
  const { t } = useTranslation();
  return (
    <nav
    aria-label={t("Primary")}
    className="bg-card fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
  >
    <NavLinks variant="tabbar" />
  </nav>
  );
}

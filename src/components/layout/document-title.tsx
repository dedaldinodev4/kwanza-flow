"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { isActivePath, NAV_ITEMS } from "./nav-items";

/** Keeps the tab title in the user's language after hydration and after every client-side navigation. */
export function DocumentTitle() {
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  useEffect(() => {
    const item = NAV_ITEMS.find((n) => isActivePath(pathname, n.href));
    document.title = item ? `${t(item.label)} · KwanzaFlow` : "KwanzaFlow";
  }, [pathname, t, i18n.language]);
  return null;
}

"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
      <div>
        <p className="text-muted-foreground text-sm font-medium">404</p>
        <h1 className="text-page-title mt-1">{t("Page not found")}</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {t("That page does not exist in KwanzaFlow.")}
        </p>
        <Link href="/" className={`${buttonVariants()} mt-6`}>
          {t("Back to Overview")}
        </Link>
      </div>
    </main>
  );
}

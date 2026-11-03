"use client";

import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/feedback";
import { PageHeader } from "@/components/layout/page-header";

import { useAppData } from "@/providers/app-data-provider";

import { AppearanceSection } from "./appearance-section";
import { DataSection } from "./data-section";
import { FormattingSection } from "./formatting-section";
import { ProfileSection } from "./profile-section";

const HEADER = { title: "Settings", description: "Profile, formatting, and appearance." };

export function SettingsView() {
  const { t } = useTranslation();
  const state = useAppData();

  if (state.status !== "ready") {
    return (
      <div aria-busy="true" className="space-y-6">
        <PageHeader
          title={t("{{title}}", { title: HEADER.title })}
          description={t("{{description}}", { title: HEADER.description })}
        />
        <span className="sr-only">{t("Loading your settings…")}</span>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const { preferences } = state.data;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("{{title}}", { title: HEADER.title })}
        description={t("{{description}}", { title: HEADER.description })}
      />
      <ProfileSection preferences={preferences} />
      <FormattingSection preferences={preferences} />
      <AppearanceSection preferences={preferences} />
      <DataSection data={state.data} />
    </div>
  );
}

"use client";

import { useTranslation } from "react-i18next";

import { Card, CardHeader } from "@/components/ui/card";
import { ChoiceGroup } from "@/components/ui/choice-group";

import { useLanguage } from "@/providers/i18n-provider";
import { LANGUAGES, LANGUAGE_LABELS } from "@/i18n/languages";

export function LanguageSection() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  return (
    <Card aria-labelledby="language-title">
      <CardHeader
        title={t("Language")}
        titleId="language-title"
        description={t(
          "Choose the language of the interface. Your choice is remembered on this device.",
        )}
      />
      <ChoiceGroup
        legend={t("Language")}
        name="language"
        value={language}
        options={LANGUAGES.map((code) => ({ value: code, label: LANGUAGE_LABELS[code] }))}
        onChange={setLanguage}
      />
    </Card>
  );
}
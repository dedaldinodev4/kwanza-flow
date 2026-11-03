"use client";

import { toast } from "sonner";

import { Card, CardHeader } from "@/components/ui/card";
import { ChoiceGroup, type Choice } from "@/components/ui/choice-group";

import { formatMoney } from "@/lib/formatters/currency";
import { useAppActions } from "@/providers/app-data-provider";
import type { UserPreferences } from "@/types/domain";

import { updatePreferences } from "../services/preferences-service";
import { useTranslation } from "react-i18next";
import { message } from "@/i18n/utils";

type Locale = UserPreferences["locale"];

const SAMPLE_MINOR = 123_456_750; // Kz 1 234 567,50


const OPTIONS: readonly { value: Locale; label: string }[] = [
  { value: "pt-AO", label: "Portuguese (Angola)" },
  { value: "en-US", label: "English (United States)" },
];


export function localeOptions(): Choice<Locale>[] {
  return OPTIONS.map((o) => ({
    ...o,
    description: formatMoney(SAMPLE_MINOR, { locale: o.value }),
  }));
}


export function selectedLocaleOption(locale: Locale): Locale {
  return locale === "pt-PT" ? "pt-AO" : locale;
}

export function FormattingSection({ preferences }: { preferences: UserPreferences }) {
  const { t } = useTranslation()
  const { tryMutate } = useAppActions();
  const options = localeOptions();

  function choose(locale: Locale) {
    const result = tryMutate((data) => updatePreferences(data, { locale }));
    if (!result.ok) toast.error(result.error);
  }

  return (
    <Card aria-labelledby="formatting-title">
      <CardHeader
        title={message("Currency and number format")}
        titleId="formatting-title"
        description={message("How amounts and percentages are written.")}
      />
      <div className="space-y-5">
        <ChoiceGroup
          legend={message("Number format")}
          name="locale"
          value={selectedLocaleOption(preferences.locale)}
          options={options}
          onChange={choose}
        />
        <dl className="text-sm">
          <dt className="text-label text-muted-foreground">{t("Currency")}</dt>
          <dd>{t("Angolan kwanza (AOA, Kz). It is the only currency in this demo.")}</dd>
        </dl>
      </div>
    </Card>
  );
}

import { render } from "@testing-library/react";
import type { ReactElement } from "react";

import { I18nProvider } from "@/providers/i18n-provider";
import type { Language } from "@/i18n/languages";

import { buildMockData } from "@/mocks/mock-data";
import { AppDataProvider } from "@/providers/app-data-provider";
import type { AppData } from "@/types/domain";

export const TODAY = "2026-10-10";

/** Renders inside the real provider with deterministic data and a fixed "today". */
export function renderWithData(
  ui: ReactElement,
  data: AppData = buildMockData(TODAY),
  language: Language = "en",
) {
  return render(
    <I18nProvider language={language}>
      <AppDataProvider today={TODAY} initialData={data}>
        {ui}
      </AppDataProvider>
    </I18nProvider>,
  );
}

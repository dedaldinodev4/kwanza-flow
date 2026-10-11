import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { buildMockData } from "@/mocks/mock-data";
import { AppDataProvider } from "@/providers/app-data-provider";
import type { AppData } from "@/types/domain";

export const TODAY = "2026-10-10";

/** Renders inside the real provider with deterministic data and a fixed "today". */
export function renderWithData(ui: ReactElement, data: AppData = buildMockData(TODAY)) {
  return render(
    <AppDataProvider today={TODAY} initialData={data}>
      {ui}
    </AppDataProvider>,
  );
}

"use client";

import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Card, CardHeader } from "@/components/ui/card";
import { ChoiceGroup, type Choice } from "@/components/ui/choice-group";

import { useIsClient } from "@/hooks/use-is-client";
import { useAppActions } from "@/providers/app-data-provider";
import type { UserPreferences } from "@/types/domain";

import { updatePreferences } from "../services/preferences-service";

type Theme = "light" | "dark" | "system";
type Density = UserPreferences["density"];

const THEME_OPTIONS: readonly Choice<Theme>[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System", description: "Follow your device" },
];

const DENSITY_OPTIONS: readonly Choice<Density>[] = [
  { value: "comfortable", label: "Comfortable", description: "More space around content" },
  { value: "compact", label: "Compact", description: "Tighter cards and lists" },
];

export function AppearanceSection({ preferences }: { preferences: UserPreferences }) {
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();
  const { tryMutate } = useAppActions();

  function chooseDensity(density: Density) {
    const result = tryMutate((data) => updatePreferences(data, { density }));
    if (!result.ok) toast.error(result.error);
  }

  return (
    <Card aria-labelledby="appearance-title">
      <CardHeader
        title="Appearance"
        titleId="appearance-title"
        description="Theme and layout density. Both apply immediately."
      />
      <div className="space-y-6">
        {/* The theme is only known in the browser, so nothing appears selected until after hydration. */}
        <ChoiceGroup
          legend="Theme"
          name="theme"
          value={isClient ? ((theme as Theme | undefined) ?? "system") : ""}
          options={THEME_OPTIONS}
          onChange={setTheme}
        />
        <ChoiceGroup
          legend="Layout density"
          name="density"
          value={preferences.density}
          options={DENSITY_OPTIONS}
          onChange={chooseDensity}
        />
      </div>
    </Card>
  );
}

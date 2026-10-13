import {
  userPreferencesSchema,
  type AppData,
  type UserPreferences
} from "@/types/domain";


export type PreferencesPatch = Partial<
  Pick<UserPreferences, "displayName" | "locale" | "density" | "openingBalance">
>;

export type PreferencesResult = { ok: true; data: AppData } | { ok: false; error: string };


//* updatePreferences *//
export function updatePreferences(data: AppData, patch: PreferencesPatch): PreferencesResult {
  const parsed = userPreferencesSchema.safeParse({ ...data.preferences, ...patch });
  if (!parsed.success)
    return {
      ok: false,
      error: "Those settings are not valid."
    };
    
  return {
    ok: true,
    data: { ...data, preferences: parsed.data }
  };
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui";

import { formatMinorForInput } from "@/lib/money/parse-money";
import { useAppActions } from "@/providers/app-data-provider";
import type { UserPreferences } from "@/types/domain";

import { profileFormSchema, toProfilePatch, type ProfileFormValues } from "../schemas/profile-form";
import { updatePreferences } from "../services/preferences-service";

export function ProfileSection({ preferences }: { preferences: UserPreferences }) {

  const formKey = `${preferences.displayName}|${preferences.openingBalance}`;
  return (
    <Card aria-labelledby="profile-title">
      <CardHeader
        title="Demo profile"
        titleId="profile-title"
        description="KwanzaFlow has no accounts or sign-in. This only labels your local demo data."
      />
      <ProfileForm key={formKey} preferences={preferences} />
    </Card>
  );
}

function ProfileForm({ preferences }: { preferences: UserPreferences }) {
  const uid = useId();
  const { tryMutate } = useAppActions();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: preferences.displayName,
      openingBalance: formatMinorForInput(preferences.openingBalance),
    },
    mode: "onTouched",
  });

  async function onValid(values: ProfileFormValues) {
    const patch = toProfilePatch(values);
    const result = tryMutate((data) => updatePreferences(data, patch));
    if (!result.ok && result.reason === "rejected") {
      setError("root.server", { message: result.error });
      return;
    }
    if (!result.ok) toast.warning(`${result.error} Your change is kept for this session only.`);
    else toast.success("Profile saved");
  }

  const id = (name: string) => `${uid}-${name}`;
  return (
    <form onSubmit={(event) => void handleSubmit(onValid)(event)} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor={id("name")}>Display name</Label>
          <Input
            id={id("name")}
            autoComplete="off"
            aria-invalid={!!errors.displayName}
            aria-describedby={errors.displayName ? id("name-error") : undefined}
            {...register("displayName")}
          />
          <FieldError id={id("name-error")} message={errors.displayName?.message} />
        </div>
        <div>
          <Label htmlFor={id("opening")}>Opening balance (Kz)</Label>
          <Input
            id={id("opening")}
            inputMode="decimal"
            autoComplete="off"
            aria-invalid={!!errors.openingBalance}
            aria-describedby={[
              id("opening-hint"),
              errors.openingBalance ? id("opening-error") : null,
            ]
              .filter(Boolean)
              .join(" ")}
            {...register("openingBalance")}
          />
          <p id={id("opening-hint")} className="text-caption text-muted-foreground mt-1.5">
            The demo account&apos;s balance before the first transaction. Your current balance is
            this plus all income, minus all expenses.
          </p>
          <FieldError id={id("opening-error")} message={errors.openingBalance?.message} />
        </div>
      </div>
      {errors.root?.server && (
        <p
          role="alert"
          className="rounded-control bg-destructive-surface text-destructive p-3 text-sm font-medium"
        >
          {errors.root.server.message}
        </p>
      )}
      <Button type="submit" disabled={!isDirty || isSubmitting}>
        {isSubmitting ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

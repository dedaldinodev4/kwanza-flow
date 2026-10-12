"use client";

import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReturnFocus } from "@/hooks/use-return-focus";

export const AlertDialog = AlertDialogPrimitive.Root;


export function AlertDialogContent({
  title,
  description,
  children,
  confirmLabel,
  onConfirm,
  onCloseAutoFocus,
  ...props
}: Omit<ComponentProps<typeof AlertDialogPrimitive.Content>, "title"> & {
  title: string;
  description: string;
  children?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  const returnFocus = useReturnFocus();
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <AlertDialogPrimitive.Content
        className={cn(
          "bg-card text-card-foreground fixed z-50 p-4 shadow-lg outline-none sm:p-6",
          "rounded-t-card inset-x-0 bottom-0 border-t pb-[max(1rem,env(safe-area-inset-bottom))]",
          "sm:rounded-card sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border",
        )}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          if (!event.defaultPrevented) returnFocus(event);
        }}
        {...props}
      >
        <AlertDialogPrimitive.Title className="text-section">{title}</AlertDialogPrimitive.Title>
        <AlertDialogPrimitive.Description className="text-muted-foreground mt-1 text-sm">
          {description}
        </AlertDialogPrimitive.Description>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogPrimitive.Cancel className={buttonVariants({ variant: "outline" })}>
            Cancel
          </AlertDialogPrimitive.Cancel>
          <AlertDialogPrimitive.Action
            className={buttonVariants({ variant: "destructive" })}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogPrimitive.Action>
        </div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}

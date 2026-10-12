"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useReturnFocus } from "@/hooks/use-return-focus";

export const Dialog = DialogPrimitive.Root;


export function DialogContent({
  title,
  description,
  children,
  className,
  onCloseAutoFocus,
  ...props
}: Omit<ComponentProps<typeof DialogPrimitive.Content>, "title"> & {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const returnFocus = useReturnFocus();
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <DialogPrimitive.Content
        className={cn(
          "bg-card text-card-foreground fixed z-50 flex max-h-[92dvh] flex-col shadow-lg outline-none",
          "rounded-t-card inset-x-0 bottom-0 border-t",
          "sm:rounded-card sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border",
          className,
        )}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event); // a caller can take over (and preventDefault) first
          if (!event.defaultPrevented) returnFocus(event);
        }}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b p-4 sm:p-6">
          <div className="min-w-0">
            <DialogPrimitive.Title className="text-section">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-muted-foreground mt-1 text-sm">
              {description}
            </DialogPrimitive.Description>
          </div>
          <DialogPrimitive.Close
            aria-label="Close"
            className="transition-ui rounded-control hover:bg-muted -mt-1 -mr-2 grid size-11 shrink-0 place-items-center"
          >
            <X aria-hidden className="size-5" />
          </DialogPrimitive.Close>
        </div>
        <div className="overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

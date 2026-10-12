"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui";

//* The form stack (react-hook-form, Zod resolver, Radix dialog) is only needed once someone opens it. *//
const TransactionFormDialog = dynamic(
  () => import("./transaction-form-dialog").then((m) => m.TransactionFormDialog),
  { ssr: false },
);

//* Self-contained primary action: used in the dashboard header; the list page manages its own dialog. *//
export function AddTransactionButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden className="size-4" />
        Add transaction
      </Button>
      {open && <TransactionFormDialog mode={{ kind: "create" }} onClose={() => setOpen(false)} />}
    </>
  );
}

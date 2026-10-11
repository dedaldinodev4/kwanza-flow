import { useAppActions, useAppData } from "@/providers/app-data-provider";

/** Exposes store contents and a way to change them "from elsewhere" (e.g. another tab) in tests. */
export function Probe() {
  const state = useAppData();
  const { mutate } = useAppActions();
  if (state.status !== "ready") return null;
  return (
    <div>
      <output aria-label="transaction count">{state.data.transactions.length}</output>
      <button type="button" onClick={() => mutate((d) => ({ ...d, transactions: [] }))}>
        probe: clear transactions
      </button>
    </div>
  );
}

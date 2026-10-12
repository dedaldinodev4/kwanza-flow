import { 
  act, fireEvent, screen,
  waitFor, within 
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { 
  beforeEach, describe, 
  expect, it, vi 
} from "vitest";

import { buildMockData } from "@/mocks/mock-data";
import { Probe } from "@/test/probe";
import { renderWithData, TODAY } from "@/test/render";
import { toast } from "sonner";

import { 
  TransactionFormDialog, 
  type FormMode 
} from "./transaction-form-dialog";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

const data = buildMockData(TODAY);
const count = () => Number(screen.getByLabelText("transaction count").textContent);

function open(mode: FormMode, onClose = vi.fn()) {
  renderWithData(
    <>
      <TransactionFormDialog mode={mode} onClose={onClose} />
      <Probe />
    </>,
    data,
  );
  return { onClose };
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Description"), "Pharmacy run");
  await user.type(screen.getByLabelText("Amount (Kz)"), "12.500,50");
  await user.selectOptions(screen.getByLabelText("Category"), "health");
}

beforeEach(() => vi.clearAllMocks());

describe("Transaction-form-dialog - create", () => {
  it("is an accessible modal dialog with a title and description", () => {
    open({ kind: "create" });
    const dialog = screen.getByRole("dialog", { name: "Add transaction" });
    expect(dialog).toHaveAccessibleDescription(/Record an income or an expense/);
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("starts with an expense dated today", () => {
    open({ kind: "create" });
    expect(screen.getByRole("radio", { name: "Expense" })).toBeChecked();
    expect(screen.getByLabelText("Date")).toHaveValue(TODAY);
  });

  it("shows an inline, associated error for every missing required field", async () => {
    const user = userEvent.setup();
    open({ kind: "create" });
    await user.clear(screen.getByLabelText("Date"));
    await user.click(screen.getByRole("button", { name: "Add transaction" }));

    for (const [label, message] of [
      ["Description", "Enter a description."],
      ["Amount (Kz)", "Enter an amount."],
      ["Category", "Choose a category."],
      ["Date", "Choose a date."],
    ] as const) {
      const field = await screen.findByLabelText(label);
      expect(field).toHaveAttribute("aria-invalid", "true");
      expect(field).toHaveAccessibleDescription(expect.stringContaining(message));
    }
    expect(count()).toBe(data.transactions.length); // nothing was saved
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("explains an invalid amount and clears the error once it is corrected", async () => {
    const user = userEvent.setup();
    open({ kind: "create" });
    const amount = screen.getByLabelText("Amount (Kz)");
    await user.type(amount, "abc");
    await user.tab(); // blur validates (mode: onTouched)
    expect(
      await screen.findByText("Enter a valid amount, for example 1.500,50."),
    ).toBeInTheDocument();
    await user.clear(amount);
    await user.type(amount, "0");
    expect(await screen.findByText("Amount must be greater than zero.")).toBeInTheDocument();
    await user.clear(amount);
    await user.type(amount, "250");
    await waitFor(() => expect(screen.queryByText(/Amount must be/)).not.toBeInTheDocument());
    expect(amount).not.toHaveAttribute("aria-invalid", "true");
  });

  it("offers only categories for the chosen type and clears a category that no longer fits", async () => {
    const user = userEvent.setup();
    open({ kind: "create" });
    const category = screen.getByLabelText("Category") as HTMLSelectElement;
    const names = () => Array.from(category.options).map((o) => o.text);
    expect(names()).toContain("Groceries");
    expect(names()).not.toContain("Salary");

    await user.selectOptions(category, "groceries");
    await user.click(screen.getByRole("radio", { name: "Income" }));
    expect(names()).toContain("Salary");
    expect(names()).not.toContain("Groceries");
    expect(category).toHaveValue(""); // groceries is not an income category
  });

  it("saves a valid transaction: stores integer minor units, closes, and confirms with a toast", async () => {
    const user = userEvent.setup();
    const { onClose } = open({ kind: "create" });
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Add transaction" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(count()).toBe(data.transactions.length + 1);
    expect(toast.success).toHaveBeenCalledWith("Transaction added");
  });

  it("cannot be submitted twice: a second submit event adds nothing", async () => {
    const user = userEvent.setup();
    open({ kind: "create" });
    await fillValid(user);
    const form = screen.getByRole("button", { name: "Add transaction" }).closest("form")!;

    await act(async () => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });

    await waitFor(() => expect(count()).toBe(data.transactions.length + 1)); // exactly one, not two
  });

  it("Cancel closes without saving", async () => {
    const user = userEvent.setup();
    const { onClose } = open({ kind: "create" });
    await user.type(screen.getByLabelText("Description"), "Never saved");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
    expect(count()).toBe(data.transactions.length);
  });

  it("closes with Escape", async () => {
    const user = userEvent.setup();
    const { onClose } = open({ kind: "create" });
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});

describe("Transaction-form-dialog - accessibility wiring", () => {
  it("never leaves an aria-describedby pointing at a missing element", async () => {
    const user = userEvent.setup();
    open({ kind: "create" });
    await user.clear(screen.getByLabelText("Date"));
    await user.click(screen.getByRole("button", { name: "Add transaction" }));
    await screen.findByText("Choose a category.");

    const dialog = screen.getByRole("dialog");
    const referenced = Array.from(dialog.querySelectorAll("[aria-describedby]")).flatMap((el) =>
      el.getAttribute("aria-describedby")!.split(" "),
    );
    expect(referenced.length).toBeGreaterThan(4);
    for (const id of referenced) expect(document.getElementById(id), `#${id}`).not.toBeNull();
  });
});

describe("Transaction-form-dialog - edit", () => {
  const target = data.transactions.find(
    (t) => t.description === "Apartment rent" && t.date.startsWith("2026-10"),
  )!;

  it("pre-fills every field from the transaction", () => {
    open({ kind: "edit", transaction: target });
    expect(screen.getByRole("dialog", { name: "Edit transaction" })).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toHaveValue("Apartment rent");
    expect(screen.getByLabelText("Amount (Kz)")).toHaveValue("220000");
    expect(screen.getByLabelText("Category")).toHaveValue("housing");
    expect(screen.getByLabelText("Date")).toHaveValue(target.date);
  });

  it("saves changes without adding a transaction", async () => {
    const user = userEvent.setup();
    const { onClose } = open({ kind: "edit", transaction: target });
    const description = screen.getByLabelText("Description");
    await user.clear(description);
    await user.type(description, "Rent (updated)");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(count()).toBe(data.transactions.length);
    expect(toast.success).toHaveBeenCalledWith("Transaction updated");
  });

  it("lets the person try again after a refused save (the form is not left dead)", async () => {
    const user = userEvent.setup();
    open({ kind: "edit", transaction: target });
    fireEvent.click(
      screen.getByRole("button", { name: "probe: clear transactions", hidden: true }),
    );

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    const first = await screen.findByRole("alert");
    expect(first).toHaveTextContent("no longer exists");

    // Each submit starts by clearing the previous server error, so the alert can only come back
    // if the handler really ran a second time rather than being blocked by a stale lock.
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("no longer exists");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
  });

  it("explains and stays open when the transaction was removed elsewhere in the meantime", async () => {
    const user = userEvent.setup();
    const { onClose } = open({ kind: "edit", transaction: target });
    // Radix marks everything behind the modal aria-hidden, so look the button up with `hidden`.
    fireEvent.click(
      screen.getByRole("button", { name: "probe: clear transactions", hidden: true }),
    );
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That transaction no longer exists.",
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});

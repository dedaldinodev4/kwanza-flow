import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { formatMoney } from "@/lib/formatters/currency";
import { buildMockData } from "@/mocks/mock-data";
import { makeGoal } from "@/test/factories";
import { Probe } from "@/test/probe";
import { renderWithData, TODAY } from "@/test/render";
import { GoalsView } from "./goals-view";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

const data = buildMockData(TODAY);
const kz = (minor: number) => formatMoney(minor, { locale: "pt-AO" }).replace(/\s/g, " ");
const norm = (el: HTMLElement) => el.textContent?.replace(/\s/g, " ") ?? "";
const cards = () =>
  within(screen.getByRole("region", { name: "Your goals" })).getAllByRole("listitem");
const names = () => cards().map((c) => within(c).getByRole("heading").textContent);
const card = (name: string) => cards().find((c) => within(c).queryByRole("heading", { name }))!;

beforeEach(() => vi.clearAllMocks());

describe("Goals-view", () => {
  it("lists active goals by soonest date, with completed goals last", () => {
    renderWithData(<GoalsView />);
    expect(names()).toEqual(["Trip to Benguela", "Emergency fund", "New laptop"]);
  });

  it("summarises saved, target and completed goals from the same data", () => {
    renderWithData(<GoalsView />);
    const saved = data.goals.reduce((t, g) => t + g.currentAmount, 0);
    const target = data.goals.reduce((t, g) => t + g.targetAmount, 0);
    const summary = screen.getByRole("region", { name: "Savings summary" });
    expect(norm(summary)).toContain(kz(saved));
    expect(norm(summary)).toContain(kz(target));
    expect(norm(summary)).toContain("1 of 3");
  });

  it("shows progress, remaining and the date for an active goal", () => {
    renderWithData(<GoalsView />);
    const trip = card("Trip to Benguela");
    expect(
      within(trip).getByRole("progressbar", { name: "Trip to Benguela progress" }),
    ).toHaveAttribute("aria-valuenow", "27");
    expect(norm(trip)).toContain(`${kz(330_000_00)} to go · by 15 Mar 2027`);
  });

  it("shows a completed goal as reached and does not offer to add money to it", () => {
    renderWithData(<GoalsView />);
    const laptop = card("New laptop");
    expect(within(laptop).getByText("Goal reached")).toBeInTheDocument();
    expect(within(laptop).queryByRole("button", { name: /Add money/ })).not.toBeInTheDocument();
    expect(
      within(card("Emergency fund")).getByRole("button", { name: "Add money to Emergency fund" }),
    ).toBeInTheDocument();
  });

  it("flags a goal whose target date has passed, in words", () => {
    const overdue = makeGoal({
      id: "o",
      name: "Old plan",
      targetAmount: 1_000_00,
      currentAmount: 100_00,
      targetDate: "2026-06-01",
    });
    renderWithData(<GoalsView />, { ...data, goals: [overdue] });
    expect(within(card("Old plan")).getByText("Target date passed")).toBeInTheDocument();
  });

  it("guides a user with no goals", () => {
    renderWithData(<GoalsView />, { ...data, goals: [] });
    expect(screen.getByText("No savings goals yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add goal" })).toBeEnabled();
  });
});

describe("creating a goal", () => {
  async function open() {
    const user = userEvent.setup();
    renderWithData(<GoalsView />);
    await user.click(screen.getByRole("button", { name: "Add goal" }));
    const dialog = await screen.findByRole("dialog", { name: "Add savings goal" });
    return { user, dialog };
  }

  it("requires a name and a target, with inline messages", async () => {
    const { user, dialog } = await open();
    await user.click(within(dialog).getByRole("button", { name: "Add goal" }));
    expect(await within(dialog).findByText("Enter a name for the goal.")).toBeInTheDocument();
    expect(within(dialog).getByText("Enter a target amount.")).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("rejects a target date in the past", async () => {
    const { user, dialog } = await open();
    await user.type(within(dialog).getByLabelText("Goal name"), "Course");
    await user.type(within(dialog).getByLabelText("Target amount (Kz)"), "80.000");
    fireEvent.change(within(dialog).getByLabelText(/Target date/), {
      target: { value: "2026-01-01" },
    });
    await user.click(within(dialog).getByRole("button", { name: "Add goal" }));
    expect(await within(dialog).findByText("Choose today or a later date.")).toBeInTheDocument();
  });

  it("creates a goal with nothing saved yet and no date", async () => {
    const { user, dialog } = await open();
    await user.type(within(dialog).getByLabelText("Goal name"), "Course");
    await user.type(within(dialog).getByLabelText("Target amount (Kz)"), "80.000");
    await user.click(within(dialog).getByRole("button", { name: "Add goal" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(toast.success).toHaveBeenCalledWith("Goal added");
    expect(norm(card("Course"))).toContain(`${kz(0)} of ${kz(80_000_00)}`);
    expect(within(card("Course")).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("creates a goal that is already partly saved, with a date", async () => {
    const { user, dialog } = await open();
    await user.type(within(dialog).getByLabelText("Goal name"), "Camera");
    await user.type(within(dialog).getByLabelText("Target amount (Kz)"), "200.000");
    await user.type(within(dialog).getByLabelText(/Already saved/), "50.000");
    fireEvent.change(within(dialog).getByLabelText(/Target date/), {
      target: { value: "2027-05-01" },
    });
    await user.click(within(dialog).getByRole("button", { name: "Add goal" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(within(card("Camera")).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    expect(norm(card("Camera"))).toContain("by 1 May 2027");
  });
});

describe("editing a goal", () => {
  it("pre-fills the form, and clearing the date really removes it", async () => {
    const user = userEvent.setup();
    renderWithData(<GoalsView />);
    await user.click(
      within(card("Trip to Benguela")).getByRole("button", { name: "Edit Trip to Benguela" }),
    );
    const dialog = await screen.findByRole("dialog", { name: "Edit goal" });
    expect(within(dialog).getByLabelText("Goal name")).toHaveValue("Trip to Benguela");
    expect(within(dialog).getByLabelText("Target amount (Kz)")).toHaveValue("450000");
    expect(within(dialog).getByLabelText(/Saved so far/)).toHaveValue("120000");

    fireEvent.change(within(dialog).getByLabelText(/Target date/), { target: { value: "" } });
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(norm(card("Trip to Benguela"))).not.toContain("by 15 Mar 2027");
    expect(toast.success).toHaveBeenCalledWith("Goal updated");
  });

  it("lowering the target to what is saved completes the goal", async () => {
    const user = userEvent.setup();
    renderWithData(<GoalsView />);
    await user.click(
      within(card("Trip to Benguela")).getByRole("button", { name: "Edit Trip to Benguela" }),
    );
    const dialog = await screen.findByRole("dialog");
    const target = within(dialog).getByLabelText("Target amount (Kz)");
    await user.clear(target);
    await user.type(target, "120.000");
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(within(card("Trip to Benguela")).getByText("Goal reached")).toBeInTheDocument();
  });

  it("keeps an unchanged past date valid so other fields can still be edited", async () => {
    const user = userEvent.setup();
    const overdue = makeGoal({
      id: "o",
      name: "Old plan",
      targetAmount: 1_000_00,
      currentAmount: 100_00,
      targetDate: "2026-06-01",
    });
    renderWithData(<GoalsView />, { ...data, goals: [overdue] });
    await user.click(within(card("Old plan")).getByRole("button", { name: "Edit Old plan" }));
    const dialog = await screen.findByRole("dialog");
    const name = within(dialog).getByLabelText("Goal name");
    await user.clear(name);
    await user.type(name, "Renamed plan");
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(names()).toContain("Renamed plan");
  });
});

describe("contributions", () => {
  async function openContribute(goal: string) {
    const user = userEvent.setup();
    renderWithData(<GoalsView />);
    await user.click(within(card(goal)).getByRole("button", { name: `Add money to ${goal}` }));
    const dialog = await screen.findByRole("dialog", { name: `Add money to ${goal}` });
    return { user, dialog };
  }

  it("shows how much is saved and left", async () => {
    const { dialog } = await openContribute("Emergency fund");
    expect(norm(dialog)).toContain(
      `${kz(850_000_00)} saved of ${kz(2_000_000_00)} · ${kz(1_150_000_00)} to go`,
    );
  });

  it.each([
    ["", "Enter an amount."],
    ["0", "Amount must be greater than zero."],
    ["-5.000", "Enter a valid amount, for example 1.500,50."],
    ["abc", "Enter a valid amount, for example 1.500,50."],
  ])("refuses %j so a balance can never go negative", async (input, message) => {
    const { user, dialog } = await openContribute("Emergency fund");
    if (input) await user.type(within(dialog).getByLabelText("Amount (Kz)"), input);
    await user.click(within(dialog).getByRole("button", { name: "Add money" }));
    expect(await within(dialog).findByText(message)).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" })); // the page behind a modal is hidden
    expect(norm(card("Emergency fund"))).toContain(`${kz(850_000_00)} of`); // unchanged
  });

  it("adds the amount and updates progress", async () => {
    const { user, dialog } = await openContribute("Emergency fund");
    await user.type(within(dialog).getByLabelText("Amount (Kz)"), "150.000");
    await user.click(within(dialog).getByRole("button", { name: "Add money" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(norm(card("Emergency fund"))).toContain(`${kz(1_000_000_00)} of ${kz(2_000_000_00)}`);
    expect(within(card("Emergency fund")).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
    expect(toast.success).toHaveBeenCalledWith(
      `Added ${formatMoney(150_000_00, { locale: "pt-AO" })} to Emergency fund`,
    );
  });

  it("completes the goal when the remaining amount is contributed, and stops offering to add money", async () => {
    const { user, dialog } = await openContribute("Trip to Benguela");
    await user.type(within(dialog).getByLabelText("Amount (Kz)"), "330.000");
    await user.click(within(dialog).getByRole("button", { name: "Add money" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(toast.success).toHaveBeenCalledWith("Goal reached: Trip to Benguela");
    const trip = card("Trip to Benguela");
    expect(within(trip).getByText("Goal reached")).toBeInTheDocument();
    expect(within(trip).queryByRole("button", { name: /Add money/ })).not.toBeInTheDocument();
    // Active goals first; completed goals after, most recently completed first.
    expect(names()).toEqual(["Emergency fund", "Trip to Benguela", "New laptop"]);
  });
});

describe("deleting a goal", () => {
  it("asks first, defaults to Cancel, and deletes only after confirmation", async () => {
    const user = userEvent.setup();
    renderWithData(<GoalsView />);
    await user.click(within(card("New laptop")).getByRole("button", { name: "Delete New laptop" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Delete this goal?" });
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(names()).toContain("New laptop");

    await user.click(within(card("New laptop")).getByRole("button", { name: "Delete New laptop" }));
    await user.click(await screen.findByRole("button", { name: "Delete goal" }));
    await waitFor(() => expect(names()).not.toContain("New laptop"));
    expect(toast.success).toHaveBeenCalledWith("Goal deleted");
    expect(screen.getByRole("heading", { name: "Your goals" })).toHaveFocus();
  });
});

describe("when a goal was removed elsewhere in the meantime", () => {
  it("a contribution is refused with an explanation and the form can be retried", async () => {
    const user = userEvent.setup();
    renderWithData(
      <>
        <GoalsView />
        <Probe />
      </>,
    );
    await user.click(
      within(card("Emergency fund")).getByRole("button", { name: "Add money to Emergency fund" }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Amount (Kz)"), "5.000");
    fireEvent.click(screen.getByRole("button", { name: "probe: clear goals", hidden: true }));

    await user.click(within(dialog).getByRole("button", { name: "Add money" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "That goal no longer exists.",
    );
    expect(toast.success).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Add money" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "That goal no longer exists.",
    );
  });

  it("an edit is refused the same way", async () => {
    const user = userEvent.setup();
    renderWithData(
      <>
        <GoalsView />
        <Probe />
      </>,
    );
    await user.click(
      within(card("Emergency fund")).getByRole("button", { name: "Edit Emergency fund" }),
    );
    const dialog = await screen.findByRole("dialog", { name: "Edit goal" });
    fireEvent.click(screen.getByRole("button", { name: "probe: clear goals", hidden: true }));
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "That goal no longer exists.",
    );

    // A refused save must unlock the form: the alert can only return if the handler really re-ran.
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "That goal no longer exists.",
    );
  });
});

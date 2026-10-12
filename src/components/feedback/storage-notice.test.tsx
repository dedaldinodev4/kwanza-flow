import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BACKUP_KEY, STORAGE_KEY } from "@/store/storage/repository";
import { AppDataProvider } from "@/providers/app-data-provider";
import { TODAY } from "@/test/render";

import { StorageNotice } from "./storage-notice";

const app = (
  <AppDataProvider today={TODAY}>
    <StorageNotice />
  </AppDataProvider>
);

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("StorageNotice", () => {
  it("shows nothing when storage is healthy", () => {
    render(app);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("tells the person when corrupted data was replaced, and lets them dismiss it", async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, "{corrupted");
    render(app);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/could not be read/);
    expect(alert).toHaveTextContent(/backup/);
    expect(localStorage.getItem(BACKUP_KEY)).toBe("{corrupted");

    await user.click(screen.getByRole("button", { name: "Dismiss message" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("explains that nothing will be kept when the browser blocks saving, and cannot be dismissed away", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    render(app);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/full or blocked/);
    // A save failure is not something to hide: the problem is ongoing until saving works again.
    expect(screen.queryByRole("button", { name: "Dismiss message" })).not.toBeInTheDocument();
  });
});

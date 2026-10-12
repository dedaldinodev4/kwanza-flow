import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    // Integration tests drive real dialogs, forms and lazily loaded charts (some perform ~30 user
    // interactions), so the 5s default is too tight under parallel load. A genuine hang still fails.
    testTimeout: 15_000,
  },
});

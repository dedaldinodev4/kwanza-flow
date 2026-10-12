import { configure } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Dialogs and charts are code-split, so their first load in a test can take a moment.
configure({ asyncUtilTimeout: 4000 });
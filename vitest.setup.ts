import { configure } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { installMatchMedia } from "@/test/match-media";

// Dialogs and charts are code-split, so their first load in a test can take a moment.
configure({ asyncUtilTimeout: 4000 });

// next-themes needs matchMedia, which jsdom does not provide.
installMatchMedia();
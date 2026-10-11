import { Brand } from "./brand";
import { NavLinks } from "./nav-links";

/** Compact top bar (brand + demo label) for <1024px. */
export function MobileHeader() {
  return (
    <header className="bg-card flex h-14 items-center justify-between border-b px-4 lg:hidden">
      <Brand />
      <span className="bg-warning-surface text-caption text-warning rounded-full px-2.5 py-1 font-medium">
        Local demo
      </span>
    </header>
  );
}

/** Bottom tab bar for <1024px, respecting the iOS safe area. */
export function MobileTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="bg-card fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <NavLinks variant="tabbar" />
    </nav>
  );
}

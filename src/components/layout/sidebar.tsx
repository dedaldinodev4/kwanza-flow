import { Brand } from "./brand";
import { NavLinks } from "./nav-links";

export function Sidebar() {
  return (
    <aside className="bg-sidebar fixed inset-y-0 left-0 hidden w-62 flex-col px-4 py-6 lg:flex">
      <Brand onDark className="px-2" />
      <nav aria-label="Primary" className="mt-8 flex-1">
        <NavLinks variant="sidebar" />
      </nav>
      <div className="rounded-control bg-sidebar-active/60 text-caption text-sidebar-muted p-3">
        <p className="text-sidebar-foreground font-medium">Local demo</p>
        <p className="mt-1">Sample data stored only in this browser. Not a real bank account.</p>
      </div>
    </aside>
  );
}

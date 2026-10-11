import {
  ArrowLeftRight,
  LayoutDashboard,
  PiggyBank,
  Settings,
  Target,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: "/" | "/transactions" | "/budgets" | "/goals" | "/settings";
  label: string;
  icon: LucideIcon;
}

/** Single source of truth for navigation, shared by the sidebar and the mobile tab bar. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

/** `/` only matches exactly; other items match their own subtree. */
export function isActivePath(pathname: string, href: NavItem["href"]): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

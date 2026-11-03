import {
  ArrowLeftRight,
  LayoutDashboard,
  PiggyBank,
  Settings,
  Target,
  type LucideIcon,
} from "lucide-react";
import { message } from "@/i18n/utils/message";

export interface NavItem {
  href: "/" | "/transactions" | "/budgets" | "/goals" | "/settings";
  label: string;
  icon: LucideIcon;
}

/** Single source of truth for navigation, shared by the sidebar and the mobile tab bar. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: message("Overview"), icon: LayoutDashboard },
  { href: "/transactions", label: message("Transactions"), icon: ArrowLeftRight },
  { href: "/budgets", label: message("Budgets"), icon: PiggyBank },
  { href: "/goals", label: message("Goals"), icon: Target },
  { href: "/settings", label: message("Settings"), icon: Settings },
] as const;

/** `/` only matches exactly; other items match their own subtree. */
export function isActivePath(pathname: string, href: NavItem["href"]): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

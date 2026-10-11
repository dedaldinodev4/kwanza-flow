import { MobileHeader, MobileTabBar } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: any) {
  return (
    <>
      <a
        href="#main"
        className="rounded-control bg-primary text-primary-foreground sr-only z-50 px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to main content
      </a>
      <Sidebar />
      <div className="lg:pl-62">
        <MobileHeader />
        <main
          id="main"
          className="max-w-content mx-auto w-full px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-16"
        >
          {children}
        </main>
      </div>
      <MobileTabBar />
    </>
  );
}

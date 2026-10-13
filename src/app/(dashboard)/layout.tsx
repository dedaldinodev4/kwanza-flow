import { StorageNotice } from "@/components/feedback/storage-notice";
import { Toaster } from "@/components/feedback/toaster";
import { MobileHeader, MobileTabBar } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { DensityScope } from "@/features/settings/components/density-scope";
import { AppDataProvider } from "@/providers/app-data-provider";

export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <AppDataProvider>
      <DensityScope>
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
            <StorageNotice />
            {children}
          </main>
        </div>
        <MobileTabBar />
        <Toaster />
      </DensityScope>
    </AppDataProvider>
  );
}

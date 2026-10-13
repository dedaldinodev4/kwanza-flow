import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
      <div>
        <p className="text-muted-foreground text-sm font-medium">404</p>
        <h1 className="text-page-title mt-1">Page not found</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          That page does not exist in KwanzaFlow.
        </p>
        <Link href="/" className={`${buttonVariants()} mt-6`}>
          Back to Overview
        </Link>
      </div>
    </main>
  );
}

"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirectUrl = searchParams.get("redirect") || "/shop";
    const mode = searchParams.get("mode") || "login";
    router.replace(`/account?mode=${encodeURIComponent(mode)}&redirect=${encodeURIComponent(redirectUrl)}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-ivory-light flex items-center justify-center p-12">
      <div className="w-8 h-8 rounded-full border-2 border-rose border-t-transparent animate-spin" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ivory-light flex items-center justify-center p-12">
          <div className="w-8 h-8 rounded-full border-2 border-rose border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginRedirectContent />
    </Suspense>
  );
}

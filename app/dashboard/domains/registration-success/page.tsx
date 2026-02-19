"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DomainRegistrationSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.replace("/dashboard/domains/search");
      return;
    }

    async function verifyAndRedirect() {
      try {
        const res = await fetch(
          `/api/stripe/checkout/verify?session_id=${sessionId}`,
        );
        const data = await res.json();

        if (!data.success || !data.domainName) {
          setError("Payment verification failed. Please contact support.");
          return;
        }

        // Poll for the domain to be created by the webhook
        pollingRef.current = setInterval(async () => {
          try {
            const domainRes = await fetch(
              `/api/domains?name=${encodeURIComponent(data.domainName)}`,
            );
            const domainData = await domainRes.json();

            if (domainData.domain?.id) {
              if (pollingRef.current) clearInterval(pollingRef.current);
              router.replace(`/dashboard/domains/${domainData.domain.id}`);
            }
          } catch {
            // keep polling
          }
        }, 2000);
      } catch {
        setError("Something went wrong. Please contact support.");
      }
    }

    verifyAndRedirect();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [sessionId, router]);

  if (error) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <button
            className="text-sm text-muted-foreground underline"
            onClick={() => router.push("/dashboard/domains/search")}
          >
            Back to search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-3">
        <p className="text-muted-foreground">Setting up your domain…</p>
        <p className="text-xs text-muted-foreground/60">This may take a few seconds.</p>
      </div>
    </div>
  );
}

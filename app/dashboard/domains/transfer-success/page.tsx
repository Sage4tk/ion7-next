"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, CheckCircle } from "lucide-react";

export default function DomainTransferSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const freeDomain = searchParams.get("domain"); // set for credit-covered transfers
  const [error, setError] = useState<string | null>(null);
  const [domainName, setDomainName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Free transfer — domain already created, show success immediately
    if (freeDomain) {
      setDomainName(freeDomain);
      setReady(true);
      return;
    }

    // Paid transfer — verify Stripe session then poll for domain record
    if (!sessionId) {
      router.replace("/dashboard/domains/transfer");
      return;
    }

    async function verifyAndWait() {
      try {
        const res = await fetch(`/api/stripe/checkout/verify?session_id=${sessionId}`);
        const data = await res.json();

        if (!data.success || !data.domainName) {
          setError("Payment verification failed. Please contact support.");
          return;
        }

        setDomainName(data.domainName);

        // Poll until the domain record is created by the webhook
        pollingRef.current = setInterval(async () => {
          try {
            const domainRes = await fetch(
              `/api/domains?name=${encodeURIComponent(data.domainName)}`,
            );
            const domainData = await domainRes.json();

            if (domainData.domain?.id) {
              if (pollingRef.current) clearInterval(pollingRef.current);
              setReady(true);
            }
          } catch {
            // keep polling
          }
        }, 2000);
      } catch {
        setError("Something went wrong. Please contact support.");
      }
    }

    verifyAndWait();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [sessionId, freeDomain, router]);

  if (error) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <button
            className="text-sm text-muted-foreground underline"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Processing your transfer request…</p>
          <p className="text-xs text-muted-foreground/60">This may take a few seconds.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-4 max-w-md px-6">
        <CheckCircle className="mx-auto h-16 w-16 text-green-400" />
        <h1 className="text-2xl font-bold">Transfer Initiated!</h1>
        {domainName && (
          <p className="text-muted-foreground">
            The transfer of{" "}
            <span className="font-semibold text-foreground">{domainName}</span>{" "}
            has been submitted.
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Domain transfers typically take <strong className="text-foreground">5–7 days</strong> to complete.
          Your current registrar may send you a confirmation email — approve it to speed things up.
          Once the transfer is done, you&apos;ll be able to fully manage your domain here.
        </p>
        <Button onClick={() => router.push("/dashboard")} className="mt-2">
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

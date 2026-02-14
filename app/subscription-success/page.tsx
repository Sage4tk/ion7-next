"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useUserStore } from "@/lib/store/user";

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { fetchUser } = useUserStore();
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.replace("/choose-plan");
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/stripe/checkout/verify?session_id=${sessionId}`);
        const data = await res.json();

        if (data.success) {
          setVerified(true);
          await fetchUser();
        } else {
          setError("Payment verification failed. Please contact support.");
        }
      } catch {
        setError("Something went wrong. Please contact support.");
      }
    }

    verify();
  }, [sessionId, router, fetchUser]);

  if (error) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background text-foreground">
        <Card className="mx-auto max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">{error}</p>
            <Button className="mt-4" onClick={() => router.push("/choose-plan")}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">Verifying payment...</p>
      </div>
    );
  }

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background text-foreground">
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <CardTitle className="text-2xl">Subscription Active!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-muted-foreground">
            Your subscription has been activated. You now have full access to your dashboard.
          </p>
          <Button className="w-full" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

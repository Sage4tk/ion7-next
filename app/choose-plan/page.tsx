"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useUserStore } from "@/lib/store/user";
import { plans, type BillingInterval } from "@/lib/plans";
import { BillingToggle } from "@/components/billing-toggle";

export default function ChoosePlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const { user, fetched, fetchUser } = useUserStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!fetched) return;
    if (!user) {
      router.replace("/login");
    } else if (user.plan) {
      router.replace("/dashboard");
    }
  }, [user, fetched, router]);

  async function handleSelect(planId: string) {
    setLoading(planId);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, interval }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to start checkout");
        setLoading(null);
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong");
      setLoading(null);
    }
  }

  if (!fetched || !user || user.plan) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            ion<span className="text-primary">7</span>
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Choose your plan
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Select a plan to get started with ion7. You can upgrade or change
            your plan at any time.
          </p>
          <div className="mt-6 flex justify-center">
            <BillingToggle interval={interval} onChange={setInterval} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={
                plan.popular
                  ? "relative border-primary/50 shadow-lg shadow-primary/5"
                  : "border-border/50"
              }
            >
              {plan.popular && (
                <div className="absolute -top-3 left-6">
                  <Badge>Recommended</Badge>
                </div>
              )}
              <CardHeader>
                {interval === "monthly" ? (
                  <div className="mb-1 text-sm font-medium text-primary">
                    {plan.yearlyPrice}
                  </div>
                ) : null}
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-2">
                  {interval === "monthly" ? (
                    <>
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">
                        {plan.yearlyDisplayPrice}
                      </span>
                      <span className="text-muted-foreground"> /year</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={loading !== null}
                  onClick={() => handleSelect(plan.id)}
                >
                  {loading === plan.id ? "Redirecting..." : `Select ${plan.name}`}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

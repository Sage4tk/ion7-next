"use client";

import { useState } from "react";
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
import { plans, type BillingInterval } from "@/lib/plans";
import { BillingToggle } from "@/components/billing-toggle";

export function PricingSection() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-16 text-center">
        <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          No hidden fees. Pick a plan that fits and upgrade anytime.
        </p>
        <div className="mt-6 flex justify-center">
          <BillingToggle interval={interval} onChange={setInterval} />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
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
                asChild
              >
                <Link href="/register">Get Started</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}

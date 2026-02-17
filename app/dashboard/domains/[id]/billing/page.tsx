"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUserStore } from "@/lib/store/user";
import { plans, type BillingInterval } from "@/lib/plans";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { BillingToggle } from "@/components/billing-toggle";

interface PreviewData {
  currentPlan: { id: string; name: string } | null;
  newPlan: { id: string; name: string };
  immediateAmount: number;
  currency: string;
  nextBillingDate: number;
  lines: { description: string; amount: number }[];
}

const planOrder = ["basic", "pro", "business"];

export default function BillingPage() {
  const { id } = useParams<{ id: string }>();
  const { user, fetchUser, fetched } = useUserStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  useEffect(() => {
    if (!fetched) fetchUser();
  }, [fetched, fetchUser]);

  useEffect(() => {
    if (user?.billingInterval === "yearly" || user?.billingInterval === "monthly") {
      setInterval(user.billingInterval);
    }
  }, [user?.billingInterval]);

  const currentPlanId = user?.plan ?? null;
  const currentInterval = (user?.billingInterval ?? "monthly") as BillingInterval;

  const handlePlanClick = async (planId: string) => {
    if (planId === currentPlanId && interval === currentInterval) return;
    setSelectedPlan(planId);
    setDialogOpen(true);
    setPreview(null);
    setPreviewLoading(true);

    try {
      const res = await fetch("/api/stripe/subscription/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPlan: planId, interval }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to load preview");
        setDialogOpen(false);
        return;
      }

      setPreview(await res.json());
    } catch {
      toast.error("Failed to load preview");
      setDialogOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedPlan) return;
    setUpdating(true);

    try {
      const res = await fetch("/api/stripe/subscription/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPlan: selectedPlan, interval }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update plan");
        return;
      }

      toast.success("Plan updated successfully!");
      setDialogOpen(false);
      fetchUser();
    } catch {
      toast.error("Failed to update plan");
    } finally {
      setUpdating(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  const isUpgrade = (planId: string) => {
    if (!currentPlanId) return true;
    return planOrder.indexOf(planId) > planOrder.indexOf(currentPlanId);
  };

  const isSamePlanDifferentInterval = (planId: string) => {
    return planId === currentPlanId && interval !== currentInterval;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Billing & Plans</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and switch plans.
        </p>
      </div>

      <div className="flex justify-center">
        <BillingToggle interval={interval} onChange={setInterval} />
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId && interval === currentInterval;
          const upgrade = isUpgrade(plan.id);
          const intervalSwitch = isSamePlanDifferentInterval(plan.id);

          return (
            <div
              key={plan.id}
              className={`relative rounded-lg border p-4 sm:p-6 transition-colors ${
                isCurrent
                  ? "border-primary/50 bg-primary/5"
                  : "border-border/50 bg-muted/30 hover:border-border"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                  Popular
                </span>
              )}

              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-2">
                {interval === "monthly" ? (
                  <>
                    <span className="text-2xl sm:text-3xl font-bold">
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl sm:text-3xl font-bold">
                      {plan.yearlyDisplayPrice}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {" "}/year
                    </span>
                  </>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.description}
              </p>

              <div className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                {isCurrent ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    Current Plan
                  </Button>
                ) : !currentPlanId ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    No active subscription
                  </Button>
                ) : intervalSwitch ? (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => handlePlanClick(plan.id)}
                  >
                    Switch to {interval === "yearly" ? "Yearly" : "Monthly"}
                  </Button>
                ) : upgrade ? (
                  <Button
                    className="w-full gap-2"
                    onClick={() => handlePlanClick(plan.id)}
                  >
                    <Sparkles className="h-4 w-4" />
                    Upgrade to {plan.name}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => handlePlanClick(plan.id)}
                  >
                    <ArrowDown className="h-4 w-4" />
                    Downgrade to {plan.name}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Proration Preview Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPlan && isSamePlanDifferentInterval(selectedPlan)
                ? "Switch Billing Interval"
                : selectedPlan && isUpgrade(selectedPlan)
                  ? "Upgrade Plan"
                  : "Downgrade Plan"}
            </DialogTitle>
            <DialogDescription>
              Review the changes to your subscription before confirming.
            </DialogDescription>
          </DialogHeader>

          {previewLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : preview ? (
            <div className="space-y-4">
              {/* Plan Change Summary */}
              <div className="flex items-center justify-center gap-3 rounded-lg bg-muted/50 p-4">
                <span className="font-medium">
                  {preview.currentPlan?.name ?? "None"}
                  {currentInterval === "yearly" ? " (Yearly)" : " (Monthly)"}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-primary">
                  {preview.newPlan.name}
                  {interval === "yearly" ? " (Yearly)" : " (Monthly)"}
                </span>
              </div>

              {/* Proration Line Items */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Price adjustment</p>
                {preview.lines.map((line, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {line.description}
                    </span>
                    <span
                      className={`shrink-0 font-medium ${line.amount < 0 ? "text-red-400" : "text-green-400"}`}
                    >
                      {formatAmount(line.amount, preview.currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t border-border/50 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Amount due today</span>
                  <span className="text-lg font-bold">
                    {formatAmount(preview.immediateAmount, preview.currency)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Next billing date:{" "}
                  {new Date(preview.nextBillingDate * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={previewLoading || !preview || updating}
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

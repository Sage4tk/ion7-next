"use client";

import type { BillingInterval } from "@/lib/plans";

interface BillingToggleProps {
  interval: BillingInterval;
  onChange: (interval: BillingInterval) => void;
}

export function BillingToggle({ interval, onChange }: BillingToggleProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-border/50 bg-muted/50 p-1">
      <button
        onClick={() => onChange("monthly")}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          interval === "monthly"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => onChange("yearly")}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          interval === "yearly"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Yearly
        <span className="ml-1.5 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
          Save 2 months
        </span>
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Briefcase, User, UtensilsCrossed, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PresetType } from "@/lib/blocks/types";

const presets: {
  type: PresetType;
  name: string;
  description: string;
  icon: typeof Briefcase;
  features: string[];
}[] = [
  {
    type: "business",
    name: "Business",
    description: "Professional landing page for companies and startups.",
    icon: Briefcase,
    features: ["Hero with CTA", "Feature cards", "About section", "Contact info"],
  },
  {
    type: "portfolio",
    name: "Portfolio",
    description: "Personal site to showcase your work and skills.",
    icon: User,
    features: ["Profile hero", "Project cards", "About me", "Contact info"],
  },
  {
    type: "restaurant",
    name: "Restaurant",
    description: "Beautiful site for restaurants and food businesses.",
    icon: UtensilsCrossed,
    features: ["Hero banner", "Menu with prices", "Photo gallery", "Hours & contact"],
  },
];

interface Props {
  onSelect: (preset: PresetType) => Promise<void>;
}

export function PresetSelector({ onSelect }: Props) {
  const [loading, setLoading] = useState<PresetType | null>(null);

  async function handleSelect(type: PresetType) {
    setLoading(type);
    try {
      await onSelect(type);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold">Choose a Starter Preset</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a starting point. You can add, remove, and reorder sections after.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {presets.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.type}
              className="flex flex-col rounded-lg border border-border/50 bg-muted/30 p-6"
            >
              <Icon className="h-8 w-8 text-primary" />
              <h3 className="mt-3 text-lg font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
              <ul className="mt-4 flex-1 space-y-1">
                {p.features.map((f) => (
                  <li key={f} className="text-xs text-muted-foreground">
                    &bull; {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-4 w-full"
                onClick={() => handleSelect(p.type)}
                disabled={loading !== null}
              >
                {loading === p.type ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `Select ${p.name}`
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

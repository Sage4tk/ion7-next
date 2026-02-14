"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { PricingData } from "@/lib/blocks/types";

interface Props {
  data: PricingData;
  onChange: (data: PricingData) => void;
}

export function PricingEditor({ data, onChange }: Props) {
  function updatePlan(index: number, fields: Partial<PricingData["plans"][0]>) {
    const plans = data.plans.map((p, i) => (i === index ? { ...p, ...fields } : p));
    onChange({ ...data, plans });
  }

  function addFeature(pi: number) {
    const plans = data.plans.map((p, i) => {
      if (i !== pi) return p;
      return { ...p, features: [...p.features, "New feature"] };
    });
    onChange({ ...data, plans });
  }

  function updateFeature(pi: number, fi: number, value: string) {
    const plans = data.plans.map((p, i) => {
      if (i !== pi) return p;
      const features = p.features.map((f, j) => (j === fi ? value : f));
      return { ...p, features };
    });
    onChange({ ...data, plans });
  }

  function removeFeature(pi: number, fi: number) {
    const plans = data.plans.map((p, i) => {
      if (i !== pi) return p;
      return { ...p, features: p.features.filter((_, j) => j !== fi) };
    });
    onChange({ ...data, plans });
  }

  function addPlan() {
    onChange({
      ...data,
      plans: [...data.plans, { name: "New Plan", price: "$0", interval: "month", features: [], highlighted: false }],
    });
  }

  function removePlan(index: number) {
    onChange({ ...data, plans: data.plans.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-6">
      {data.plans.map((plan, pi) => (
        <div key={pi} className="space-y-3 rounded-lg border border-border/50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Plan {pi + 1}</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => removePlan(pi)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Name</Label>
              <Input value={plan.name} onChange={(e) => updatePlan(pi, { name: e.target.value })} />
            </div>
            <div>
              <Label>Price</Label>
              <Input value={plan.price} onChange={(e) => updatePlan(pi, { price: e.target.value })} />
            </div>
            <div>
              <Label>Interval</Label>
              <Input value={plan.interval} onChange={(e) => updatePlan(pi, { interval: e.target.value })} placeholder="month" />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={plan.highlighted}
                onChange={(e) => updatePlan(pi, { highlighted: e.target.checked })}
                className="rounded border-border"
              />
              Highlighted (featured plan)
            </label>
          </div>
          <div className="space-y-2">
            <Label>Features</Label>
            {plan.features.map((f, fi) => (
              <div key={fi} className="flex items-center gap-2">
                <Input value={f} onChange={(e) => updateFeature(pi, fi, e.target.value)} />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeFeature(pi, fi)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => addFeature(pi)}>
              <Plus className="h-4 w-4" /> Add Feature
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addPlan}>
        <Plus className="h-4 w-4" /> Add Plan
      </Button>
    </div>
  );
}

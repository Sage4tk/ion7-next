import type { PricingData, ThemeColors } from "@/lib/blocks/types";
import { Check } from "lucide-react";

interface Props {
  data: PricingData;
  theme: ThemeColors;
}

export function PricingRender({ data, theme }: Props) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <h2 className="mb-12 text-center text-3xl font-bold">Pricing</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {data.plans.map((plan, i) => (
          <div
            key={i}
            className="flex flex-col rounded-lg border p-6"
            style={{
              borderColor: plan.highlighted ? theme.primary : `${theme.text}20`,
              backgroundColor: plan.highlighted ? `${theme.primary}10` : "transparent",
            }}
          >
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <div className="mt-2">
              <span className="text-3xl font-bold">{plan.price}</span>
              {plan.interval && (
                <span className="ml-1 text-sm opacity-60">/{plan.interval}</span>
              )}
            </div>
            <ul className="mt-6 flex-1 space-y-2">
              {plan.features.map((feature, fi) => (
                <li key={fi} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0" style={{ color: theme.primary }} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

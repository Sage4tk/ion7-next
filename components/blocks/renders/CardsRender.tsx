import type { CardsData, ThemeColors } from "@/lib/blocks/types";
import { Zap, Shield, BarChart, Code, Layout, Image, Star, Heart, Globe, Briefcase } from "lucide-react";

const iconMap: Record<string, typeof Zap> = {
  Zap, Shield, BarChart, Code, Layout, Image, Star, Heart, Globe, Briefcase,
};

interface Props {
  data: CardsData;
  theme: ThemeColors;
}

export function CardsRender({ data, theme }: Props) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      {data.title && (
        <h2 className="mb-10 text-center text-3xl font-bold">{data.title}</h2>
      )}
      <div className="grid gap-8 md:grid-cols-3">
        {data.cards.map((card, i) => {
          const Icon = iconMap[card.icon] || Zap;
          return (
            <div
              key={i}
              className="rounded-lg p-6"
              style={{ backgroundColor: `${theme.primary}15` }}
            >
              <Icon className="h-8 w-8" style={{ color: theme.primary }} />
              <h3 className="mt-4 text-lg font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm opacity-70">{card.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

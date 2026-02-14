import type { ContactData, ThemeColors } from "@/lib/blocks/types";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

interface Props {
  data: ContactData;
  theme: ThemeColors;
}

export function ContactRender({ data, theme }: Props) {
  const items = [
    { icon: Mail, value: data.email },
    { icon: Phone, value: data.phone },
    { icon: MapPin, value: data.address },
    { icon: Clock, value: data.hours },
  ].filter((item) => item.value);

  return (
    <section
      className="border-t py-16"
      style={{ borderColor: `${theme.text}20` }}
    >
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-2xl font-bold">Contact</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {items.map(({ icon: Icon, value }, i) => (
            <div key={i} className="flex items-center gap-3">
              <Icon className="h-5 w-5 shrink-0" style={{ color: theme.primary }} />
              <span className="text-sm">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

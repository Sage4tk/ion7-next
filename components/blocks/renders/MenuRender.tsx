import type { MenuData, ThemeColors } from "@/lib/blocks/types";

interface Props {
  data: MenuData;
  theme: ThemeColors;
}

export function MenuRender({ data, theme }: Props) {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <h2 className="text-center text-3xl font-bold">Our Menu</h2>
      <div className="mt-12 space-y-12">
        {data.categories.map((cat, ci) => (
          <div key={ci}>
            <h3
              className="text-xl font-semibold"
              style={{ color: theme.primary }}
            >
              {cat.name}
            </h3>
            <div className="mt-4 space-y-4">
              {cat.items.map((item, ii) => (
                <div
                  key={ii}
                  className="flex items-baseline justify-between border-b pb-3"
                  style={{ borderColor: `${theme.text}15` }}
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm opacity-60">{item.description}</p>
                  </div>
                  <span
                    className="ml-4 whitespace-nowrap font-semibold"
                    style={{ color: theme.primary }}
                  >
                    {item.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

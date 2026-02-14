import type { HeroData, ThemeColors } from "@/lib/blocks/types";

interface Props {
  data: HeroData;
  theme: ThemeColors;
}

export function HeroRender({ data, theme }: Props) {
  return (
    <section
      className="relative flex min-h-[70vh] items-center justify-center text-center"
      style={{
        backgroundImage: data.bgImage ? `url(${data.bgImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {data.bgImage && <div className="absolute inset-0 bg-black/60" />}
      <div className="relative z-10 mx-auto max-w-3xl px-6">
        <h1 className="text-5xl font-bold leading-tight">{data.heading}</h1>
        <p className="mt-4 text-lg opacity-80">{data.subheading}</p>
        {data.ctaText && (
          <a
            href={data.ctaUrl || "#"}
            className="mt-8 inline-block rounded-lg px-8 py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: theme.primary }}
          >
            {data.ctaText}
          </a>
        )}
      </div>
    </section>
  );
}

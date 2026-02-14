import type { TextData, ThemeColors } from "@/lib/blocks/types";

interface Props {
  data: TextData;
  theme: ThemeColors;
}

export function TextRender({ data, theme }: Props) {
  const imageFirst = data.imagePosition === "left";

  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className={`flex flex-col items-center gap-12 md:flex-row ${imageFirst ? "" : "md:flex-row-reverse"}`}>
        {data.image && (
          <img
            src={data.image}
            alt={data.heading}
            className="h-64 w-64 rounded-lg object-cover"
          />
        )}
        <div className={data.image ? "" : "mx-auto max-w-3xl text-center"}>
          <h2 className="text-3xl font-bold">{data.heading}</h2>
          <p className="mt-4 leading-relaxed opacity-80 whitespace-pre-line">{data.body}</p>
        </div>
      </div>
    </section>
  );
}

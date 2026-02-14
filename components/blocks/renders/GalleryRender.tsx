import type { GalleryData, ThemeColors } from "@/lib/blocks/types";

interface Props {
  data: GalleryData;
  theme: ThemeColors;
}

export function GalleryRender({ data, theme }: Props) {
  if (data.images.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="text-center text-3xl font-bold">Gallery</h2>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {data.images.map((img, i) => (
          <img
            key={i}
            src={img.url}
            alt={img.alt}
            className="h-48 w-full rounded-lg object-cover"
          />
        ))}
      </div>
    </section>
  );
}

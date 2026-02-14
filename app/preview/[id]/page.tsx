import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import type { SiteContent } from "@/lib/blocks/types";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const site = await prisma.site.findUnique({ where: { id } });
  if (!site) notFound();

  const content = site.content as unknown as SiteContent;
  const sorted = [...content.blocks].sort((a, b) => a.order - b.order);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: content.theme.background, color: content.theme.text }}
    >
      {sorted.map((block) => (
        <BlockRenderer key={block.id} block={block} theme={content.theme} />
      ))}
      <footer className="py-8 text-center text-xs opacity-50">
        &copy; {new Date().getFullYear()} All rights reserved.
      </footer>
    </div>
  );
}

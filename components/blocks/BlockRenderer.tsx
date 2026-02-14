import type { Block, ThemeColors } from "@/lib/blocks/types";
import { HeroRender } from "./renders/HeroRender";
import { CardsRender } from "./renders/CardsRender";
import { TextRender } from "./renders/TextRender";
import { GalleryRender } from "./renders/GalleryRender";
import { ContactRender } from "./renders/ContactRender";
import { MenuRender } from "./renders/MenuRender";
import { PricingRender } from "./renders/PricingRender";

interface Props {
  block: Block;
  theme: ThemeColors;
}

export function BlockRenderer({ block, theme }: Props) {
  switch (block.type) {
    case "hero":
      return <HeroRender data={block.data} theme={theme} />;
    case "cards":
      return <CardsRender data={block.data} theme={theme} />;
    case "text":
      return <TextRender data={block.data} theme={theme} />;
    case "gallery":
      return <GalleryRender data={block.data} theme={theme} />;
    case "contact":
      return <ContactRender data={block.data} theme={theme} />;
    case "menu":
      return <MenuRender data={block.data} theme={theme} />;
    case "pricing":
      return <PricingRender data={block.data} theme={theme} />;
    default:
      return null;
  }
}

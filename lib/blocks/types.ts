export type BlockType =
  | "hero"
  | "cards"
  | "text"
  | "gallery"
  | "contact"
  | "menu"
  | "pricing";

export type PresetType = "business" | "portfolio" | "restaurant";

export interface ThemeColors {
  primary: string;
  background: string;
  text: string;
}

// ── Block Data Types ──

export interface HeroData {
  heading: string;
  subheading: string;
  ctaText: string;
  ctaUrl: string;
  bgImage: string;
}

export interface CardsData {
  title: string;
  cards: { icon: string; title: string; description: string }[];
}

export interface TextData {
  heading: string;
  body: string;
  image: string;
  imagePosition: "left" | "right";
}

export interface GalleryData {
  images: { url: string; alt: string }[];
}

export interface ContactData {
  email: string;
  phone: string;
  address: string;
  hours: string;
}

export interface MenuData {
  categories: {
    name: string;
    items: { name: string; description: string; price: string }[];
  }[];
}

export interface PricingData {
  plans: {
    name: string;
    price: string;
    interval: string;
    features: string[];
    highlighted: boolean;
  }[];
}

// ── Block Discriminated Union ──

interface BlockBase {
  id: string;
  order: number;
}

export type Block =
  | (BlockBase & { type: "hero"; data: HeroData })
  | (BlockBase & { type: "cards"; data: CardsData })
  | (BlockBase & { type: "text"; data: TextData })
  | (BlockBase & { type: "gallery"; data: GalleryData })
  | (BlockBase & { type: "contact"; data: ContactData })
  | (BlockBase & { type: "menu"; data: MenuData })
  | (BlockBase & { type: "pricing"; data: PricingData });

export interface SiteContent {
  theme: ThemeColors;
  blocks: Block[];
}

// ── Block metadata ──

export const blockTypeLabels: Record<BlockType, string> = {
  hero: "Hero Banner",
  cards: "Feature Cards",
  text: "Text Section",
  gallery: "Image Gallery",
  contact: "Contact Info",
  menu: "Menu / Price List",
  pricing: "Pricing Plans",
};

export const blockTypeDescriptions: Record<BlockType, string> = {
  hero: "Full-width banner with heading, subheading, and call-to-action",
  cards: "Grid of feature or service cards with icons",
  text: "Text content with optional image",
  gallery: "Grid of images",
  contact: "Contact information with email, phone, address, and hours",
  menu: "Categorized menu with item names, descriptions, and prices",
  pricing: "Pricing plan comparison cards",
};

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown, ArrowUp, ArrowDown, Trash2, Plus, Loader2 } from "lucide-react";
import { BlockTypePicker } from "./BlockTypePicker";
import { HeroEditor } from "./editors/HeroEditor";
import { CardsEditor } from "./editors/CardsEditor";
import { TextEditor } from "./editors/TextEditor";
import { GalleryEditor } from "./editors/GalleryEditor";
import { ContactEditor } from "./editors/ContactEditor";
import { MenuEditor } from "./editors/MenuEditor";
import { PricingEditor } from "./editors/PricingEditor";
import {
  blockTypeLabels,
  type Block,
  type BlockType,
  type SiteContent,
  type HeroData,
  type CardsData,
  type TextData,
  type GalleryData,
  type ContactData,
  type MenuData,
  type PricingData,
} from "@/lib/blocks/types";

const defaultBlockData: Record<BlockType, Block["data"]> = {
  hero: { heading: "Your Heading", subheading: "Your subheading here.", ctaText: "Learn More", ctaUrl: "#", bgImage: "" } as HeroData,
  cards: { title: "Features", cards: [{ icon: "Star", title: "Feature", description: "Description here." }] } as CardsData,
  text: { heading: "Section Title", body: "Your content here.", image: "", imagePosition: "right" } as TextData,
  gallery: { images: [] } as GalleryData,
  contact: { email: "hello@example.com", phone: "", address: "", hours: "" } as ContactData,
  menu: { categories: [{ name: "Category", items: [{ name: "Item", description: "", price: "$0" }] }] } as MenuData,
  pricing: { plans: [{ name: "Basic", price: "$9", interval: "month", features: ["Feature 1"], highlighted: false }] } as PricingData,
};

interface Props {
  content: SiteContent;
  onSave: (content: SiteContent) => Promise<void>;
}

export function PageBuilder({ content: initial, onSave }: Props) {
  const [content, setContent] = useState<SiteContent>(initial);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { theme, blocks } = content;
  const sorted = [...blocks].sort((a, b) => a.order - b.order);

  function setBlocks(newBlocks: Block[]) {
    setContent({ ...content, blocks: newBlocks });
  }

  function updateBlock(id: string, data: Block["data"]) {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, data } : b) as Block));
  }

  function moveBlock(id: string, dir: -1 | 1) {
    const idx = sorted.findIndex((b) => b.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const updated = sorted.map((b, i) => {
      if (i === idx) return { ...b, order: sorted[swapIdx].order };
      if (i === swapIdx) return { ...b, order: sorted[idx].order };
      return b;
    }) as Block[];
    setBlocks(updated);
  }

  function removeBlock(id: string) {
    setBlocks(blocks.filter((b) => b.id !== id));
  }

  function addBlock(type: BlockType) {
    const maxOrder = blocks.length > 0 ? Math.max(...blocks.map((b) => b.order)) : -1;
    const newBlock = {
      id: Math.random().toString(36).slice(2, 10),
      type,
      order: maxOrder + 1,
      data: structuredClone(defaultBlockData[type]),
    } as Block;
    setBlocks([...blocks, newBlock]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(content);
    } finally {
      setSaving(false);
    }
  }

  function renderEditor(block: Block) {
    switch (block.type) {
      case "hero":
        return <HeroEditor data={block.data} onChange={(d) => updateBlock(block.id, d)} />;
      case "cards":
        return <CardsEditor data={block.data} onChange={(d) => updateBlock(block.id, d)} />;
      case "text":
        return <TextEditor data={block.data} onChange={(d) => updateBlock(block.id, d)} />;
      case "gallery":
        return <GalleryEditor data={block.data} onChange={(d) => updateBlock(block.id, d)} />;
      case "contact":
        return <ContactEditor data={block.data} onChange={(d) => updateBlock(block.id, d)} />;
      case "menu":
        return <MenuEditor data={block.data} onChange={(d) => updateBlock(block.id, d)} />;
      case "pricing":
        return <PricingEditor data={block.data} onChange={(d) => updateBlock(block.id, d)} />;
    }
  }

  function blockDescription(block: Block): string {
    switch (block.type) {
      case "hero": return block.data.heading || "Hero";
      case "cards": return block.data.title || `${block.data.cards.length} cards`;
      case "text": return block.data.heading || "Text";
      case "gallery": return `${block.data.images.length} images`;
      case "contact": return block.data.email || "Contact";
      case "menu": return `${block.data.categories.length} categories`;
      case "pricing": return `${block.data.plans.length} plans`;
    }
  }

  return (
    <div className="space-y-6">
      {/* Theme Editor */}
      <div className="rounded-lg border border-border/50 p-4">
        <h3 className="mb-3 text-sm font-semibold">Theme Colors</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {(["primary", "background", "text"] as const).map((key) => (
            <div key={key}>
              <Label className="capitalize">{key}</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={theme[key]}
                  onChange={(e) => setContent({ ...content, theme: { ...theme, [key]: e.target.value } })}
                  className="h-10 w-10 cursor-pointer rounded border border-border"
                />
                <Input
                  value={theme[key]}
                  onChange={(e) => setContent({ ...content, theme: { ...theme, [key]: e.target.value } })}
                  className="w-28"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Block List */}
      <div className="space-y-3">
        {sorted.map((block, idx) => (
          <Collapsible key={block.id}>
            <div className="rounded-lg border border-border/50">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/30"
                >
                  <div>
                    <span className="text-sm font-medium">{blockTypeLabels[block.type]}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{blockDescription(block)}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border/30 px-4 py-4">
                  {renderEditor(block)}
                  <div className="mt-4 flex items-center gap-2 border-t border-border/30 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={idx === 0}
                      onClick={() => moveBlock(block.id, -1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={idx === sorted.length - 1}
                      onClick={() => moveBlock(block.id, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <div className="flex-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBlock(block.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>

      {/* Add Section */}
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={() => setPickerOpen(true)}
      >
        <Plus className="h-4 w-4" /> Add Section
      </Button>

      <BlockTypePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={addBlock}
      />

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save Changes
      </Button>
    </div>
  );
}

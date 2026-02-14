"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { blockTypeLabels, blockTypeDescriptions, type BlockType } from "@/lib/blocks/types";
import { Heading1, LayoutGrid, Type, Image, Phone, UtensilsCrossed, DollarSign } from "lucide-react";

const blockTypeIcons: Record<BlockType, typeof Heading1> = {
  hero: Heading1,
  cards: LayoutGrid,
  text: Type,
  gallery: Image,
  contact: Phone,
  menu: UtensilsCrossed,
  pricing: DollarSign,
};

const allBlockTypes: BlockType[] = ["hero", "cards", "text", "gallery", "contact", "menu", "pricing"];

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (type: BlockType) => void;
}

export function BlockTypePicker({ open, onClose, onSelect }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {allBlockTypes.map((type) => {
            const Icon = blockTypeIcons[type];
            return (
              <button
                key={type}
                type="button"
                className="flex items-start gap-3 rounded-lg border border-border/50 p-4 text-left transition-colors hover:bg-muted/50"
                onClick={() => {
                  onSelect(type);
                  onClose();
                }}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">{blockTypeLabels[type]}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{blockTypeDescriptions[type]}</p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

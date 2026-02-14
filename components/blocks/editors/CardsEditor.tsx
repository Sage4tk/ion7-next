"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { CardsData } from "@/lib/blocks/types";

interface Props {
  data: CardsData;
  onChange: (data: CardsData) => void;
}

export function CardsEditor({ data, onChange }: Props) {
  function updateCard(index: number, fields: Partial<CardsData["cards"][0]>) {
    const cards = data.cards.map((c, i) => (i === index ? { ...c, ...fields } : c));
    onChange({ ...data, cards });
  }

  function addCard() {
    onChange({
      ...data,
      cards: [...data.cards, { icon: "Star", title: "New Card", description: "Description here." }],
    });
  }

  function removeCard(index: number) {
    onChange({ ...data, cards: data.cards.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Section Title</Label>
        <Input value={data.title} onChange={(e) => onChange({ ...data, title: e.target.value })} />
      </div>
      {data.cards.map((card, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-border/50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Card {i + 1}</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeCard(i)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div>
            <Label>Icon Name</Label>
            <Input value={card.icon} onChange={(e) => updateCard(i, { icon: e.target.value })} placeholder="e.g. Zap, Shield, Star" />
          </div>
          <div>
            <Label>Title</Label>
            <Input value={card.title} onChange={(e) => updateCard(i, { title: e.target.value })} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={card.description} onChange={(e) => updateCard(i, { description: e.target.value })} />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addCard}>
        <Plus className="h-4 w-4" /> Add Card
      </Button>
    </div>
  );
}

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { MenuData } from "@/lib/blocks/types";

interface Props {
  data: MenuData;
  onChange: (data: MenuData) => void;
}

export function MenuEditor({ data, onChange }: Props) {
  function updateCategory(ci: number, name: string) {
    const categories = data.categories.map((c, i) => (i === ci ? { ...c, name } : c));
    onChange({ ...data, categories });
  }

  function updateItem(ci: number, ii: number, fields: Partial<MenuData["categories"][0]["items"][0]>) {
    const categories = data.categories.map((cat, i) => {
      if (i !== ci) return cat;
      const items = cat.items.map((item, j) => (j === ii ? { ...item, ...fields } : item));
      return { ...cat, items };
    });
    onChange({ ...data, categories });
  }

  function addItem(ci: number) {
    const categories = data.categories.map((cat, i) => {
      if (i !== ci) return cat;
      return { ...cat, items: [...cat.items, { name: "New Item", description: "", price: "$0" }] };
    });
    onChange({ ...data, categories });
  }

  function removeItem(ci: number, ii: number) {
    const categories = data.categories.map((cat, i) => {
      if (i !== ci) return cat;
      return { ...cat, items: cat.items.filter((_, j) => j !== ii) };
    });
    onChange({ ...data, categories });
  }

  function addCategory() {
    onChange({
      ...data,
      categories: [...data.categories, { name: "New Category", items: [] }],
    });
  }

  function removeCategory(ci: number) {
    onChange({ ...data, categories: data.categories.filter((_, i) => i !== ci) });
  }

  return (
    <div className="space-y-6">
      {data.categories.map((cat, ci) => (
        <div key={ci} className="space-y-3 rounded-lg border border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Category Name</Label>
              <Input value={cat.name} onChange={(e) => updateCategory(ci, e.target.value)} />
            </div>
            <Button type="button" variant="ghost" size="sm" className="ml-2 mt-5" onClick={() => removeCategory(ci)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>

          {cat.items.map((item, ii) => (
            <div key={ii} className="ml-4 flex items-start gap-2 border-l-2 border-border/30 pl-4">
              <div className="grid flex-1 gap-2 sm:grid-cols-3">
                <div>
                  <Label>Name</Label>
                  <Input value={item.name} onChange={(e) => updateItem(ci, ii, { name: e.target.value })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={item.description} onChange={(e) => updateItem(ci, ii, { description: e.target.value })} />
                </div>
                <div>
                  <Label>Price</Label>
                  <Input value={item.price} onChange={(e) => updateItem(ci, ii, { price: e.target.value })} />
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" className="mt-5" onClick={() => removeItem(ci, ii)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" className="ml-4 gap-2" onClick={() => addItem(ci)}>
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addCategory}>
        <Plus className="h-4 w-4" /> Add Category
      </Button>
    </div>
  );
}

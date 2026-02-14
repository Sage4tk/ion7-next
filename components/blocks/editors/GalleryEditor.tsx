"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/templates/ImageUpload";
import { Plus, Trash2 } from "lucide-react";
import type { GalleryData } from "@/lib/blocks/types";

interface Props {
  data: GalleryData;
  onChange: (data: GalleryData) => void;
}

export function GalleryEditor({ data, onChange }: Props) {
  function updateImage(index: number, fields: Partial<GalleryData["images"][0]>) {
    const images = data.images.map((img, i) => (i === index ? { ...img, ...fields } : img));
    onChange({ ...data, images });
  }

  function addImage() {
    onChange({ ...data, images: [...data.images, { url: "", alt: "" }] });
  }

  function removeImage(index: number) {
    onChange({ ...data, images: data.images.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-4">
      {data.images.map((img, i) => (
        <div key={i} className="flex items-start gap-4 rounded-lg border border-border/50 p-4">
          <ImageUpload
            value={img.url}
            onChange={(v) => updateImage(i, { url: v })}
          />
          <div className="flex-1 space-y-2">
            <div>
              <Label>Alt Text</Label>
              <Input value={img.alt} onChange={(e) => updateImage(i, { alt: e.target.value })} placeholder="Describe the image" />
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => removeImage(i)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addImage}>
        <Plus className="h-4 w-4" /> Add Image
      </Button>
    </div>
  );
}

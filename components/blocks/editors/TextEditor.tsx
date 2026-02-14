"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/templates/ImageUpload";
import type { TextData } from "@/lib/blocks/types";

interface Props {
  data: TextData;
  onChange: (data: TextData) => void;
}

export function TextEditor({ data, onChange }: Props) {
  function update(fields: Partial<TextData>) {
    onChange({ ...data, ...fields });
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Heading</Label>
        <Input value={data.heading} onChange={(e) => update({ heading: e.target.value })} />
      </div>
      <div>
        <Label>Body</Label>
        <Textarea value={data.body} onChange={(e) => update({ body: e.target.value })} rows={5} />
      </div>
      <ImageUpload
        label="Image"
        value={data.image}
        onChange={(v) => update({ image: v })}
      />
      {data.image && (
        <div>
          <Label>Image Position</Label>
          <div className="mt-1 flex gap-2">
            <Button
              type="button"
              variant={data.imagePosition === "left" ? "default" : "outline"}
              size="sm"
              onClick={() => update({ imagePosition: "left" })}
            >
              Left
            </Button>
            <Button
              type="button"
              variant={data.imagePosition === "right" ? "default" : "outline"}
              size="sm"
              onClick={() => update({ imagePosition: "right" })}
            >
              Right
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

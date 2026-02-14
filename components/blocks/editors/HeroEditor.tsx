"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/templates/ImageUpload";
import type { HeroData } from "@/lib/blocks/types";

interface Props {
  data: HeroData;
  onChange: (data: HeroData) => void;
}

export function HeroEditor({ data, onChange }: Props) {
  function update(fields: Partial<HeroData>) {
    onChange({ ...data, ...fields });
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Heading</Label>
        <Input value={data.heading} onChange={(e) => update({ heading: e.target.value })} />
      </div>
      <div>
        <Label>Subheading</Label>
        <Textarea value={data.subheading} onChange={(e) => update({ subheading: e.target.value })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>CTA Button Text</Label>
          <Input value={data.ctaText} onChange={(e) => update({ ctaText: e.target.value })} />
        </div>
        <div>
          <Label>CTA URL</Label>
          <Input value={data.ctaUrl} onChange={(e) => update({ ctaUrl: e.target.value })} placeholder="#" />
        </div>
      </div>
      <ImageUpload
        label="Background Image"
        value={data.bgImage}
        onChange={(v) => update({ bgImage: v })}
      />
    </div>
  );
}

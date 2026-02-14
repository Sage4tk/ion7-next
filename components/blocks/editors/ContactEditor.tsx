"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContactData } from "@/lib/blocks/types";

interface Props {
  data: ContactData;
  onChange: (data: ContactData) => void;
}

export function ContactEditor({ data, onChange }: Props) {
  function update(fields: Partial<ContactData>) {
    onChange({ ...data, ...fields });
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Email</Label>
        <Input value={data.email} onChange={(e) => update({ email: e.target.value })} />
      </div>
      <div>
        <Label>Phone</Label>
        <Input value={data.phone} onChange={(e) => update({ phone: e.target.value })} />
      </div>
      <div>
        <Label>Address</Label>
        <Input value={data.address} onChange={(e) => update({ address: e.target.value })} />
      </div>
      <div>
        <Label>Hours</Label>
        <Input value={data.hours} onChange={(e) => update({ hours: e.target.value })} placeholder="e.g. Mon-Fri 9am-5pm" />
      </div>
    </div>
  );
}

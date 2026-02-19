"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRightLeft, Loader2 } from "lucide-react";

export default function DomainTransferPage() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedDomain = domain.trim().toLowerCase();
    const trimmedCode = authCode.trim();

    if (!trimmedDomain || !trimmedCode) return;

    const dotIndex = trimmedDomain.lastIndexOf(".");
    if (dotIndex === -1 || dotIndex === 0 || dotIndex === trimmedDomain.length - 1) {
      toast.error("Please enter a full domain name, e.g. mysite.com");
      return;
    }

    const name = trimmedDomain.slice(0, dotIndex);
    const extension = trimmedDomain.slice(dotIndex + 1);

    setLoading(true);
    try {
      const res = await fetch("/api/domains/transfer-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, extension, authCode: trimmedCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to start transfer");
        return;
      }

      if (data.free) {
        router.push(
          `/dashboard/domains/transfer-success?domain=${encodeURIComponent(data.domainName)}`,
        );
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-xl font-bold tracking-tight">
            ion<span className="text-primary">7</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="text-center">
          <ArrowRightLeft className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold">Transfer Your Domain</h1>
          <p className="mt-2 text-muted-foreground">
            Move your existing domain to ion7. You&apos;ll need the authorization (EPP) code from your current registrar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="domain">Domain Name</Label>
            <Input
              id="domain"
              type="text"
              placeholder="e.g. mysite.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="authCode">Authorization (EPP) Code</Label>
            <Input
              id="authCode"
              type="text"
              placeholder="Your domain's auth code"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Get this from your current registrar&apos;s control panel. It may be called an EPP code, auth code, or transfer key.
            </p>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/30 px-5 py-4 text-sm">
            <p className="font-medium mb-2">Before you transfer</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Unlock your domain at your current registrar</li>
              <li>Domain must be at least 60 days old</li>
              <li>Transfer includes 1 year renewal</li>
              <li>Transfers typically take 5–7 days to complete</li>
            </ul>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !domain.trim() || !authCode.trim()}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRightLeft className="mr-2 h-4 w-4" />
            )}
            {loading ? "Checking domain…" : "Continue to Payment"}
          </Button>
        </form>
      </main>
    </div>
  );
}

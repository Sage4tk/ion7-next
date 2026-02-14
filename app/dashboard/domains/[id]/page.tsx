"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, Calendar, Loader2, ExternalLink } from "lucide-react";
import { PresetSelector } from "@/components/blocks/PresetSelector";
import { PageBuilder } from "@/components/blocks/PageBuilder";
import type { PresetType, SiteContent } from "@/lib/blocks/types";

interface Domain {
  id: string;
  name: string;
  status: string;
  registeredAt: string | null;
  expiresAt: string | null;
}

interface Site {
  id: string;
  template: string;
  content: SiteContent;
}

interface DnsRecord {
  type: string;
  name: string;
  value: string;
  ttl: number;
  prio?: number;
}

export default function DomainManagePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [domain, setDomain] = useState<Domain | null>(null);
  const [site, setSite] = useState<Site | null | undefined>(undefined); // undefined = loading
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dnsLoading, setDnsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDomain() {
      try {
        const res = await fetch(`/api/domains/${id}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Domain not found" : "Failed to load domain");
          return;
        }
        const data = await res.json();
        setDomain(data.domain);
      } catch {
        setError("Failed to load domain");
      } finally {
        setLoading(false);
      }
    }

    async function fetchSite() {
      try {
        const res = await fetch(`/api/domains/${id}/site`);
        if (res.ok) {
          const data = await res.json();
          setSite(data.site ?? null);
        } else {
          setSite(null);
        }
      } catch {
        setSite(null);
      }
    }

    async function fetchDns() {
      try {
        const res = await fetch(`/api/domains/${id}/dns`);
        if (res.ok) {
          const data = await res.json();
          setRecords(data.records);
        }
      } catch {
        // DNS records are non-critical
      } finally {
        setDnsLoading(false);
      }
    }

    fetchDomain();
    fetchSite();
    fetchDns();
  }, [id]);

  const handleSelectPreset = useCallback(async (preset: PresetType) => {
    const res = await fetch(`/api/domains/${id}/site`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template: preset }),
    });
    if (!res.ok) throw new Error("Failed to create site");
    const data = await res.json();
    setSite(data.site);
  }, [id]);

  const handleSave = useCallback(async (content: SiteContent) => {
    const res = await fetch(`/api/domains/${id}/site`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error("Failed to save");
    const data = await res.json();
    setSite(data.site);
    setSaveMessage("Saved successfully!");
    setTimeout(() => setSaveMessage(null), 3000);
  }, [id]);

  if (loading) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !domain) {
    return (
      <div className="dark flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <p className="text-muted-foreground">{error || "Domain not found"}</p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    expired: "bg-red-500/20 text-red-400",
    transferred: "bg-blue-500/20 text-blue-400",
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Domain Info */}
        <div className="rounded-lg border border-border/50 bg-muted/30 p-6">
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{domain.name}</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor[domain.status] || "bg-muted text-muted-foreground"}`}
            >
              {domain.status}
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {domain.registeredAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Registered {new Date(domain.registeredAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {domain.expiresAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Expires {new Date(domain.expiresAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Website Builder Section */}
        <div className="mt-8">
          {site === undefined ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : site === null ? (
            <PresetSelector onSelect={handleSelectPreset} />
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold capitalize">
                  {site.template} Site
                </h2>
                <div className="flex items-center gap-3">
                  {saveMessage && (
                    <span className="text-sm text-green-400">{saveMessage}</span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.open(`/preview/${site.id}`, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Preview
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <PageBuilder
                  content={site.content}
                  onSave={handleSave}
                />
              </div>
            </div>
          )}
        </div>

        {/* DNS Records */}
        <div className="mt-8">
          <h2 className="text-xl font-bold">DNS Records</h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-border/50">
            {dnsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : records.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                No DNS records found.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">TTL</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/30 last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium">
                        {record.type}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {record.name || "@"}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-muted-foreground">
                        {record.value}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {record.ttl}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

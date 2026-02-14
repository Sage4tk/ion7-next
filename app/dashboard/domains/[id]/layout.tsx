"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, Calendar, Loader2, Mail } from "lucide-react";
import Link from "next/link";

interface Domain {
  id: string;
  name: string;
  status: string;
  registeredAt: string | null;
  expiresAt: string | null;
}

const statusColor: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  expired: "bg-red-500/20 text-red-400",
  transferred: "bg-blue-500/20 text-blue-400",
};

export default function DomainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const [domain, setDomain] = useState<Domain | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    fetchDomain();
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

  const basePath = `/dashboard/domains/${id}`;
  const isEmailsTab = pathname.startsWith(`${basePath}/emails`);

  const tabs = [
    { label: "Website", href: basePath, icon: Globe, active: !isEmailsTab },
    { label: "Emails", href: `${basePath}/emails`, icon: Mail, active: isEmailsTab },
  ];

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

      <div className="mx-auto max-w-6xl px-6 py-12">
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

        {/* Sidebar + Content */}
        <div className="mt-8 flex gap-8">
          <aside className="w-48 shrink-0">
            <nav className="flex flex-col gap-1">
              {tabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    tab.active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}

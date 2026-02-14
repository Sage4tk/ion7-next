"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Globe, Loader2, Search } from "lucide-react";
import { useUserStore } from "@/lib/store/user";

interface DomainResult {
  domain: string;
  status: string;
  price: number | null;
  currency: string | null;
}

export default function DomainSearchPage() {
  const router = useRouter();
  const { fetchUser } = useUserStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DomainResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [registering, setRegistering] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setResults([]);

    try {
      const res = await fetch("/api/domains/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Search failed");
        return;
      }

      setResults(data.results);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSearching(false);
    }
  }

  async function handleRegister(domain: string) {
    const dotIndex = domain.lastIndexOf(".");
    const name = domain.slice(0, dotIndex);
    const extension = domain.slice(dotIndex + 1);

    setRegistering(domain);

    try {
      const res = await fetch("/api/domains/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, extension }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      toast.success(`${domain} registered successfully!`);
      await fetchUser();
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setRegistering(null);
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
          <Globe className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold">Find Your Domain</h1>
          <p className="mt-2 text-muted-foreground">
            Search for available domains and register them instantly.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mt-8 flex gap-2">
          <Input
            type="text"
            placeholder="e.g. mysite.com or mysite"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={searching || !query.trim()}>
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2">Search</span>
          </Button>
        </form>

        {searching && (
          <div className="mt-8 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg border border-border/50 bg-muted/30"
              />
            ))}
          </div>
        )}

        {!searching && results.length > 0 && (
          <div className="mt-8 space-y-3">
            {results.map((r) => {
              const available = r.status === "free";
              return (
                <div
                  key={r.domain}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{r.domain}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        available
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {available ? "Available" : "Taken"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.price !== null && (
                      <span className="text-sm text-muted-foreground">
                        {r.currency === "EUR" ? "\u20AC" : "$"}
                        {r.price.toFixed(2)}/yr
                      </span>
                    )}
                    {available && (
                      <Button
                        size="sm"
                        onClick={() => handleRegister(r.domain)}
                        disabled={registering !== null}
                      >
                        {registering === r.domain ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : null}
                        Register
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!searching && results.length === 0 && query && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Enter a domain name and click Search to check availability.
          </p>
        )}
      </main>
    </div>
  );
}

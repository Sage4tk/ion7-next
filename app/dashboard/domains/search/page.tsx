"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Gift, Globe, Loader2, Search } from "lucide-react";
import { calcChargeAmountAed, eurToAed } from "@/lib/domain-credit";

interface DomainResult {
  domain: string;
  status: string;
  price: number | null;
  currency: string | null;
}

export default function DomainSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const CACHE_KEY = "domain-search-results";
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<DomainResult[]>(() => {
    if (!initialQuery) return [];
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { q, results: r } = JSON.parse(cached);
        if (q === initialQuery) return r as DomainResult[];
      }
    } catch { /* ignore */ }
    return [];
  });
  const [searching, setSearching] = useState(false);
  const [registering, setRegistering] = useState<string | null>(null);
  const [confirmDomain, setConfirmDomain] = useState<{ domain: string; price: number | null } | null>(null);

  const runSearch = useCallback(async (searchQuery: string) => {
    setSearching(true);
    setResults([]);

    try {
      const res = await fetch("/api/domains/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Search failed");
        return;
      }

      setResults(data.results);
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ q: searchQuery, results: data.results }),
      );
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery && results.length === 0) {
      runSearch(initialQuery);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    const params = new URLSearchParams(searchParams);
    params.set("q", query.trim());
    router.replace(`?${params.toString()}`);

    await runSearch(query.trim());
  }

  function handleRegister(domain: string, price: number | null) {
    const chargeAmount = price !== null ? calcChargeAmountAed(price) : null;
    const isFree = chargeAmount !== null && chargeAmount <= 0;

    if (isFree) {
      // Show confirmation dialog before registering for free
      setConfirmDomain({ domain, price });
      return;
    }

    // Paid — go straight to Stripe checkout
    startRegistration(domain, false);
  }

  async function startRegistration(domain: string, isFree: boolean) {
    const dotIndex = domain.lastIndexOf(".");
    const name = domain.slice(0, dotIndex);
    const extension = domain.slice(dotIndex + 1);

    setRegistering(domain);
    setConfirmDomain(null);

    try {
      if (isFree) {
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

        router.push(`/dashboard/domains/${data.domain.id}`);
      } else {
        const res = await fetch("/api/domains/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, extension }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Registration failed");
          return;
        }

        window.location.href = data.url;
      }
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
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
            <Gift className="h-3.5 w-3.5" />
            50 AED domain credit included — most domains are free
          </div>
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
              const priceAed = r.price !== null ? eurToAed(r.price) : null;
              const chargeAmountAed = r.price !== null ? calcChargeAmountAed(r.price) : null;
              const isFree = available && chargeAmountAed !== null && chargeAmountAed <= 0;

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
                    {available && priceAed !== null && (
                      <div className="text-right">
                        {isFree ? (
                          <span className="text-sm font-medium text-green-400">Free</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground line-through">
                              AED {priceAed.toFixed(2)}
                            </span>
                            <span className="text-sm font-medium">
                              AED {chargeAmountAed!.toFixed(2)}/yr
                            </span>
                          </div>
                        )}
                        {isFree && (
                          <p className="text-xs text-muted-foreground">50 AED credit applied</p>
                        )}
                        {!isFree && chargeAmountAed !== null && (
                          <p className="text-xs text-muted-foreground">after 50 AED credit</p>
                        )}
                      </div>
                    )}
                    {!available && priceAed !== null && (
                      <span className="text-sm text-muted-foreground">
                        AED {priceAed.toFixed(2)}/yr
                      </span>
                    )}
                    {available && (
                      <Button
                        size="sm"
                        onClick={() => handleRegister(r.domain, r.price)}
                        disabled={registering !== null}
                        variant={isFree ? "default" : "default"}
                      >
                        {registering === r.domain ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : isFree ? (
                          <Gift className="mr-1 h-3 w-3" />
                        ) : null}
                        {isFree ? "Get for Free" : "Register"}
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

      {/* Free domain confirmation dialog */}
      <Dialog
        open={confirmDomain !== null}
        onOpenChange={(open) => { if (!open) setConfirmDomain(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Domain Registration</DialogTitle>
            <DialogDescription>
              You&apos;re about to register this domain. Once registered it cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 rounded-lg border border-border/50 bg-muted/30 px-4 py-3 space-y-1">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold break-all">{confirmDomain?.domain}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-400">
              <Gift className="h-3.5 w-3.5 shrink-0" />
              Free — covered by your 50 AED credit
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDomain(null)}
              disabled={registering !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={() => confirmDomain && startRegistration(confirmDomain.domain, true)}
              disabled={registering !== null}
            >
              {registering !== null ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {registering !== null ? "Registering…" : "Yes, Register Domain"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LogOut, CreditCard, Globe, Calendar, Settings, AlertTriangle } from "lucide-react";
import { useUserStore } from "@/lib/store/user";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, fetched, fetchUser, clear } = useUserStore();
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!fetched) return;
    if (!user) {
      router.replace("/login");
    } else if (!user.plan) {
      router.replace("/choose-plan");
    } else if (user.accountStatus !== "frozen" && user.domains.length === 1) {
      router.replace(`/dashboard/domains/${user.domains[0].id}`);
    }
  }, [user, fetched, router]);

  if (!fetched || loading) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || !user.plan) return null;

  if (user.accountStatus !== "frozen" && user.domains.length === 1) return null;

  function handleLogout() {
    clear();
    signOut({ callbackUrl: "/" });
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to open billing portal");
        setPortalLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong");
      setPortalLoading(false);
    }
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-xl font-bold tracking-tight">
            ion<span className="text-primary">7</span>
          </span>
          <div className="flex items-center gap-2">
            {user.stripeCustomerId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="gap-2"
              >
                <CreditCard className="h-4 w-4" />
                {portalLoading ? "Loading..." : "Manage Subscription"}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-12">
        {user.accountStatus === "frozen" ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 px-6 py-20 text-center">
            <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
            <h2 className="text-2xl font-bold">Your account is frozen</h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              A recent payment failed. Please update your payment method to
              restore access to your account.
            </p>
            <Button
              className="mt-6"
              onClick={handleManageSubscription}
              disabled={portalLoading}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {portalLoading ? "Loading..." : "Update Payment Method"}
            </Button>
          </div>
        ) : user.domains.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border/50 bg-muted/30 px-6 py-20 text-center">
            <Globe className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-2xl font-bold">Buy a domain to get started</h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              You need a domain to start building your website. Search for your
              perfect domain and register it in seconds.
            </p>
            <Button className="mt-6" onClick={() => router.push("/dashboard/domains/search")}>
              Search for a Domain
            </Button>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {user.domains.map((domain) => (
                <div
                  key={domain.id}
                  className="rounded-lg border border-border/50 bg-muted/30 p-5"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{domain.name}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="capitalize">{domain.status}</span>
                    {domain.expiresAt && (
                      <>
                        <span>·</span>
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          Expires{" "}
                          {new Date(domain.expiresAt).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full gap-2"
                    onClick={() =>
                      router.push(`/dashboard/domains/${domain.id}`)
                    }
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Manage
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

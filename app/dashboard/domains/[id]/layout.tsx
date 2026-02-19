"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Globe,
  Calendar,
  Loader2,
  Mail,
  LayoutDashboard,
  CreditCard,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/lib/store/user";

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
  failed: "bg-destructive/20 text-destructive",
};

export default function DomainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const { user, fetched, fetchUser, clear } = useUserStore();
  const hasMultipleDomains = (user?.domains?.length ?? 0) > 1;

  useEffect(() => {
    if (!fetched) fetchUser();
  }, [fetched, fetchUser]);

  useEffect(() => {
    if (!fetched) return;
    if (!user) {
      router.replace("/login");
    } else if (!user.plan) {
      router.replace("/choose-plan");
    }
  }, [user, fetched, router]);

  function handleLogout() {
    clear();
    signOut({ callbackUrl: "/" });
  }
  const [domain, setDomain] = useState<Domain | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDomain() {
      try {
        const res = await fetch(`/api/domains/${id}`);
        if (!res.ok) {
          setError(
            res.status === 404 ? "Domain not found" : "Failed to load domain",
          );
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
  const isWebsiteTab = pathname.startsWith(`${basePath}/website`);
  const isEmailsTab = pathname.startsWith(`${basePath}/emails`);
  const isBillingTab = pathname.startsWith(`${basePath}/billing`);
  const isDashboardTab = !isWebsiteTab && !isEmailsTab && !isBillingTab;

  const domainActive = domain.status === "active";

  const tabs = [
    {
      label: "Dashboard",
      href: basePath,
      icon: LayoutDashboard,
      active: isDashboardTab,
      disabled: false,
    },
    {
      label: "Website",
      href: `${basePath}/website`,
      icon: Globe,
      active: isWebsiteTab,
      disabled: !domainActive,
    },
    {
      label: "Emails",
      href: `${basePath}/emails`,
      icon: Mail,
      active: isEmailsTab,
      disabled: !domainActive,
    },
    {
      label: "Billing",
      href: `${basePath}/billing`,
      icon: CreditCard,
      active: isBillingTab,
      disabled: false,
    },
  ];

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {hasMultipleDomains ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          ) : (
            <span className="text-xl font-bold tracking-tight">
              ion<span className="text-primary">7</span>
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2 flex flex-row items-center"
          >
            <LogOut className="h-4 w-4 " />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-12">
        {/* Domain Info */}
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h1 className="text-lg sm:text-2xl font-bold break-all">
              {domain.name}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor[domain.status] || "bg-muted text-muted-foreground"}`}
            >
              {domain.status}
            </span>
          </div>

          <div className="mt-3 sm:mt-4 grid gap-2 sm:gap-4 sm:grid-cols-2">
            {domain.registeredAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>
                  Registered{" "}
                  {new Date(domain.registeredAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {domain.expiresAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>
                  Expires {new Date(domain.expiresAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="mt-4 overflow-x-auto md:hidden">
          <nav className="flex gap-1 rounded-lg border border-border/50 bg-muted/30 p-1">
            {tabs.map((tab) =>
              tab.disabled ? (
                <span
                  key={tab.href}
                  title="Available once transfer completes"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap cursor-not-allowed opacity-40 text-muted-foreground"
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </span>
              ) : (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    tab.active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              ),
            )}
          </nav>
        </div>

        {/* Sidebar + Content */}
        <div className="mt-4 sm:mt-8 flex gap-8">
          <aside className="hidden md:block w-48 shrink-0">
            <nav className="flex flex-col gap-1">
              {tabs.map((tab) =>
                tab.disabled ? (
                  <span
                    key={tab.href}
                    title="Available once transfer completes"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium cursor-not-allowed opacity-40 text-muted-foreground"
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </span>
                ) : (
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
                ),
              )}
            </nav>
          </aside>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useUserStore } from "@/lib/store/user";
import { plans } from "@/lib/plans";
import {
  Loader2,
  CreditCard,
  Globe,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Gift,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DOMAIN_CREDIT_AED } from "@/lib/domain-credit";

interface SiteInfo {
  id: string;
  template: string;
  createdAt: string;
  updatedAt: string;
}

interface DomainDetail {
  id: string;
  name: string;
  status: string;
  registeredAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

function getDaysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function DomainDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, fetchUser, fetched } = useUserStore();
  const [domain, setDomain] = useState<DomainDetail | null>(null);
  const [site, setSite] = useState<SiteInfo | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);
  const [renewalInfo, setRenewalInfo] = useState<{ isFree: boolean; chargeAmountAed: number } | null>(null);

  useEffect(() => {
    if (!fetched) fetchUser();
  }, [fetched, fetchUser]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [domainRes, siteRes] = await Promise.all([
          fetch(`/api/domains/${id}`),
          fetch(`/api/domains/${id}/site`),
        ]);

        if (domainRes.ok) {
          const data = await domainRes.json();
          setDomain(data.domain);

          // Fetch renewal price if expiry is within 60 days
          const expiry = data.domain?.expiresAt ? new Date(data.domain.expiresAt) : null;
          const daysLeft = expiry ? Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
          if (data.domain?.status === "active" && daysLeft !== null && daysLeft <= 60) {
            try {
              const renewRes = await fetch(`/api/domains/${id}/renew`);
              if (renewRes.ok) {
                const renewData = await renewRes.json();
                setRenewalInfo({ isFree: renewData.isFree, chargeAmountAed: renewData.chargeAmountAed });
              }
            } catch { /* non-critical, ignore */ }
          }
        }

        if (siteRes.ok) {
          const data = await siteRes.json();
          setSite(data.site ?? null);
        } else {
          setSite(null);
        }
      } catch {
        setSite(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Show success toast if redirected back from renewal payment
  useEffect(() => {
    if (searchParams.get("renewed") === "1") {
      toast.success("Domain renewed successfully!");
      router.replace(`/dashboard/domains/${id}`);
    }
  }, [searchParams, router, id]);

  const currentPlan = user?.plan
    ? plans.find((p) => p.id === user.plan)
    : null;

  const daysUntilExpiry = domain ? getDaysUntilExpiry(domain.expiresAt) : null;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 60;
  const showRenewalBanner = domain?.status === "active" && (isExpired || isExpiringSoon) && renewalInfo !== null;

  async function handleRenew() {
    setRenewing(true);
    try {
      const res = await fetch(`/api/domains/${id}/renew`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Renewal failed");
        return;
      }

      if (data.renewed && data.free) {
        // Renewed for free — update local state
        setDomain((prev) =>
          prev ? { ...prev, expiresAt: data.newExpiresAt, status: "active" } : prev,
        );
        toast.success("Domain renewed for free with your 50 AED credit!");
        return;
      }

      if (data.needsPayment) {
        // Exceeds credit — go through Stripe checkout
        const checkoutRes = await fetch(`/api/domains/${id}/renew-checkout`, {
          method: "POST",
        });
        const checkoutData = await checkoutRes.json();

        if (!checkoutRes.ok) {
          toast.error(checkoutData.error || "Failed to start renewal payment");
          return;
        }

        window.location.href = checkoutData.url;
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setRenewing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Renewal banner */}
      {showRenewalBanner && (
        renewalInfo!.isFree ? (
          // Within the 50 AED credit — cron will auto-renew, just inform the user
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-5 py-4 flex items-center gap-3">
            <RefreshCw className="h-4 w-4 text-green-400 shrink-0" />
            <div>
              <p className="font-semibold text-green-400">
                {isExpired ? "Domain expired — auto-renewal pending" : `Auto-renewing in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}`}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Your 50 AED credit covers this renewal — no action needed.
              </p>
            </div>
          </div>
        ) : (
          // Exceeds the credit — user must pay the difference
          <div
            className={`rounded-lg border px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isExpired
                ? "border-destructive/50 bg-destructive/10"
                : "border-yellow-500/30 bg-yellow-500/10"
            }`}
          >
            <div>
              <p className={`font-semibold ${isExpired ? "text-destructive" : "text-yellow-400"}`}>
                {isExpired
                  ? "Your domain has expired"
                  : `Your domain expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}`}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                This domain exceeds the 50 AED credit. Pay AED {renewalInfo!.chargeAmountAed.toFixed(2)} to renew for another year.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleRenew}
              disabled={renewing}
              variant={isExpired ? "destructive" : "default"}
              className="shrink-0"
            >
              {renewing ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
              )}
              {renewing ? "Redirecting…" : `Pay AED ${renewalInfo!.chargeAmountAed.toFixed(2)}`}
            </Button>
          </div>
        )
      )}

      {/* Pending transfer banner */}
      {domain?.status === "pending" && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-5 py-4 flex items-center gap-3">
          <Clock className="h-4 w-4 text-blue-400 shrink-0" />
          <div>
            <p className="font-semibold text-blue-400">Transfer in progress</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Domain transfers typically take 5–7 days. This page will update automatically once the transfer completes.
            </p>
          </div>
        </div>
      )}

      {domain?.status === "failed" && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-5 py-4 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <div>
            <p className="font-semibold text-destructive">Transfer failed</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              The domain transfer was rejected. This usually means the auth code was wrong, the domain was locked, or the 60-day lock period applied. Please contact support.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Current Subscription Card */}
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-base sm:text-lg font-semibold">Current Subscription</h2>
          </div>

          {currentPlan ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xl sm:text-2xl font-bold">
                    {currentPlan.name}{" "}
                    <span className="text-sm sm:text-base font-normal text-muted-foreground">
                      {user?.billingInterval === "yearly"
                        ? `${currentPlan.yearlyDisplayPrice} /year`
                        : `${currentPlan.price}${currentPlan.period}`}
                    </span>
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    {currentPlan.description}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-400">
                  Active
                </span>
              </div>

              <div className="grid gap-2 pt-2">
                {currentPlan.features.slice(0, 4).map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full sm:w-auto"
                asChild
              >
                <Link href={`/dashboard/domains/${id}/billing`}>
                  Manage Subscription
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">No active subscription</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                asChild
              >
                <Link href={`/dashboard/domains/${id}/billing`}>
                  View Plans
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Domain Information Card */}
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="text-base sm:text-lg font-semibold">Domain Information</h2>
          </div>

          {domain ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Domain Name
                  </p>
                  <p className="mt-1 text-sm sm:text-base font-medium break-all">{domain.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Status
                  </p>
                  <p className="mt-1 text-sm sm:text-base font-medium capitalize">{domain.status}</p>
                </div>
                {domain.registeredAt && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Registered
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {new Date(domain.registeredAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
                {domain.expiresAt && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Expires
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {new Date(domain.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Annual Renewal
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-green-400">
                    <Gift className="h-3.5 w-3.5 shrink-0" />
                    Up to 50 AED covered
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Domain information unavailable.
            </p>
          )}
        </div>

        {/* Live Website Card */}
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <ExternalLink className="h-5 w-5 text-primary" />
            <h2 className="text-base sm:text-lg font-semibold">Live Website</h2>
          </div>

          {site === undefined ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : site ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Template
                  </p>
                  <p className="mt-1 text-sm sm:text-base font-medium capitalize">{site.template}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Last Updated
                  </p>
                  <p className="mt-1 text-xs sm:text-sm">
                    {new Date(site.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  Live
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.open(`/preview/${site.id}`, "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Site
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/dashboard/domains/${id}/website`)
                  }
                >
                  Edit Website
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">No website created yet</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() =>
                  router.push(`/dashboard/domains/${id}/website`)
                }
              >
                Create Website
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

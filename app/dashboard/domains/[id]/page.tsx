"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

export default function DomainDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, fetchUser, fetched } = useUserStore();
  const [domain, setDomain] = useState<DomainDetail | null>(null);
  const [site, setSite] = useState<SiteInfo | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

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

  const currentPlan = user?.plan
    ? plans.find((p) => p.id === user.plan)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
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
  );
}

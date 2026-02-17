import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  Globe,
  Mail,
  Layout,
  Zap,
  Search,
  Rocket,
  ArrowRight,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { PricingSection } from "@/components/pricing-section";

const features = [
  {
    icon: Layout,
    title: "Website Builder",
    description:
      "Drag-and-drop editor with beautiful templates. No coding required — just pick, customize, and publish.",
  },
  {
    icon: Globe,
    title: "Domain Provider",
    description:
      "Search, register, and manage your perfect domain name. Hundreds of extensions available at competitive prices.",
  },
  {
    icon: Mail,
    title: "Professional Email",
    description:
      "Set up custom domain email in seconds. Look professional with you@yourdomain.com powered by ion7.",
  },
];

const steps = [
  {
    icon: Search,
    step: "1",
    title: "Pick a Domain",
    description: "Search and register the perfect domain for your brand.",
  },
  {
    icon: Layout,
    step: "2",
    title: "Build Your Site",
    description: "Use our builder to create a stunning website in minutes.",
  },
  {
    icon: Rocket,
    step: "3",
    title: "Launch with Email",
    description: "Go live with professional email and start growing.",
  },
];

export default async function Home() {
  const session = await auth();

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-xl font-bold tracking-tight">
            ion<span className="text-primary">7</span>
          </span>
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </a>
            <a
              href="#about"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </a>
          </div>
          {session?.user ? (
            <Button size="sm" asChild>
              <Link href="/dashboard">Console</Link>
            </Button>
          ) : (
            <Button size="sm" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 py-28 text-center md:py-40">
          <Badge variant="outline" className="mb-6">
            <Zap className="mr-1 h-3 w-3" />
            All-in-one platform
          </Badge>
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
            Build. Host.{" "}
            <span className="text-primary">Connect.</span>
          </h1>
          <p className="mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Websites, domains, and professional email — all in one place.
            Launch your online presence in minutes, not days.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/register">
                Start Building <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl" />

      {/* Features Section */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to go live
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Stop juggling multiple services. ion7 brings websites, domains, and
            email together under one roof.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Up and running in 3 steps
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              From idea to live website with professional email — it only takes
              a few minutes.
            </p>
          </div>
          <div className="grid gap-12 md:grid-cols-3">
            {steps.map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-xl font-bold text-primary">
                  {item.step}
                </div>
                <item.icon className="mb-3 h-6 w-6 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Banner */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-20 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Ready to build your online presence?
          </h2>
          <p className="mb-8 max-w-xl text-muted-foreground">
            Join thousands of creators and businesses already using ion7 to
            power their websites, domains, and email.
          </p>
          <Button size="lg" className="gap-2" asChild>
            <Link href="/register">
              Get Started for Free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="border-t border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <span className="text-lg font-bold tracking-tight">
                ion<span className="text-primary">7</span>
              </span>
              <p className="mt-3 text-sm text-muted-foreground">
                The all-in-one platform for websites, domains, and email.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Website Builder</a></li>
                <li><a href="#" className="hover:text-foreground">Domains</a></li>
                <li><a href="#" className="hover:text-foreground">Email</a></li>
                <li><a href="#" className="hover:text-foreground">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
                <li><a href="#" className="hover:text-foreground">Cookies</a></li>
              </ul>
            </div>
          </div>
          <Separator className="my-8" />
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ion7. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

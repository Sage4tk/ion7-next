"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const COUNTRY_CODES = [
  { flag: "🇦🇪", code: "+971", name: "UAE" },
  { flag: "🇸🇦", code: "+966", name: "Saudi Arabia" },
  { flag: "🇶🇦", code: "+974", name: "Qatar" },
  { flag: "🇰🇼", code: "+965", name: "Kuwait" },
  { flag: "🇧🇭", code: "+973", name: "Bahrain" },
  { flag: "🇴🇲", code: "+968", name: "Oman" },
  { flag: "🇯🇴", code: "+962", name: "Jordan" },
  { flag: "🇪🇬", code: "+20",  name: "Egypt" },
  { flag: "🇱🇧", code: "+961", name: "Lebanon" },
  { flag: "🇬🇧", code: "+44",  name: "UK" },
  { flag: "🇺🇸", code: "+1",   name: "USA" },
  { flag: "🇨🇦", code: "+1",   name: "Canada" },
  { flag: "🇮🇳", code: "+91",  name: "India" },
  { flag: "🇵🇰", code: "+92",  name: "Pakistan" },
  { flag: "🇧🇩", code: "+880", name: "Bangladesh" },
  { flag: "🇵🇭", code: "+63",  name: "Philippines" },
  { flag: "🇳🇬", code: "+234", name: "Nigeria" },
  { flag: "🇿🇦", code: "+27",  name: "South Africa" },
  { flag: "🇩🇪", code: "+49",  name: "Germany" },
  { flag: "🇫🇷", code: "+33",  name: "France" },
  { flag: "🇮🇹", code: "+39",  name: "Italy" },
  { flag: "🇪🇸", code: "+34",  name: "Spain" },
  { flag: "🇳🇱", code: "+31",  name: "Netherlands" },
  { flag: "🇦🇺", code: "+61",  name: "Australia" },
  { flag: "🇸🇬", code: "+65",  name: "Singapore" },
  { flag: "🇲🇾", code: "+60",  name: "Malaysia" },
  { flag: "🇹🇷", code: "+90",  name: "Turkey" },
  { flag: "🇵🇱", code: "+48",  name: "Poland" },
  { flag: "🇷🇺", code: "+7",   name: "Russia" },
  { flag: "🇧🇷", code: "+55",  name: "Brazil" },
  { flag: "🇲🇽", code: "+52",  name: "Mexico" },
  { flag: "🇨🇳", code: "+86",  name: "China" },
  { flag: "🇯🇵", code: "+81",  name: "Japan" },
  { flag: "🇰🇷", code: "+82",  name: "South Korea" },
  { flag: "🇮🇩", code: "+62",  name: "Indonesia" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dialCode, setDialCode] = useState("+971");
  const [phone, setPhone] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const address = formData.get("address") as string;

    const localNumber = phone.replace(/\D/g, "");
    if (localNumber.length < 5) {
      toast.error("Please enter a valid phone number");
      setLoading(false);
      return;
    }

    const fullPhone = `${dialCode}${localNumber}`;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone: fullPhone, address }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        toast.error("Account created but sign-in failed. Please log in.");
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
      setLoading(false);
    }
  }

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === dialCode) ?? COUNTRY_CODES[0];

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mb-2 text-xl font-bold tracking-tight">
            ion<span className="text-primary">7</span>
          </Link>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Get started with ion7</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <div className="relative">
                  <select
                    value={dialCode}
                    onChange={(e) => setDialCode(e.target.value)}
                    className="h-9 appearance-none rounded-md border border-input bg-background pl-3 pr-7 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                    aria-label="Country dial code"
                  >
                    {COUNTRY_CODES.map((c, i) => (
                      <option key={`${c.code}-${i}`} value={c.code}>
                        {c.flag} {c.code} {c.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    ▾
                  </span>
                </div>
                <div className="flex flex-1 items-center rounded-md border border-input bg-background px-3 text-sm focus-within:ring-1 focus-within:ring-ring">
                  <span className="mr-2 shrink-0 text-sm text-muted-foreground">
                    {selectedCountry.flag} {dialCode}
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="501234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-9 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <textarea
                id="address"
                name="address"
                placeholder="Street, City, Country"
                required
                rows={2}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

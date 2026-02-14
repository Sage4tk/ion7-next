"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail, Plus, Loader2, Trash2 } from "lucide-react";

const MAX_EMAILS = 10;

interface Email {
  id: string;
  address: string;
  zohoAccountId: string | null;
  createdAt: string;
}

export default function EmailsPage() {
  const { id } = useParams<{ id: string }>();
  const [domainName, setDomainName] = useState<string | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefix, setPrefix] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [domainRes, emailsRes] = await Promise.all([
          fetch(`/api/domains/${id}`),
          fetch(`/api/domains/${id}/emails`),
        ]);
        if (domainRes.ok) {
          const data = await domainRes.json();
          setDomainName(data.domain.name);
        }
        if (emailsRes.ok) {
          const data = await emailsRes.json();
          setEmails(data.emails);
        }
      } catch {
        // Errors handled by empty state
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  async function handleCreate() {
    setError(null);
    setCreating(true);
    try {
      const res = await fetch(`/api/domains/${id}/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create email");
        return;
      }
      setEmails((prev) => [...prev, data.email]);
      setPrefix("");
      setPassword("");
      setDialogOpen(false);
    } catch {
      setError("Failed to create email");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(emailId: string) {
    if (!confirm("Are you sure you want to delete this email account?")) return;

    setDeletingId(emailId);
    try {
      const res = await fetch(`/api/domains/${id}/emails`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });
      if (res.ok) {
        setEmails((prev) => prev.filter((e) => e.id !== emailId));
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setDeletingId(null);
    }
  }

  if (loading || !domainName) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Email Addresses</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {emails.length}/{MAX_EMAILS} emails
          </span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="gap-2"
                disabled={emails.length >= MAX_EMAILS}
              >
                <Plus className="h-4 w-4" />
                Create Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Email Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      placeholder="info"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                    />
                    <span className="shrink-0 text-sm text-muted-foreground">
                      @{domainName}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    placeholder="Min 8 characters"
                    className="mt-1"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={creating || !prefix || password.length < 8}
                >
                  {creating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Account
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 py-12 text-muted-foreground">
            <Mail className="mb-2 h-8 w-8" />
            <p className="text-sm">No email accounts yet</p>
          </div>
        ) : (
          emails.map((email) => (
            <div
              key={email.id}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">{email.address}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(email.id)}
                disabled={deletingId === email.id}
              >
                {deletingId === email.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                )}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

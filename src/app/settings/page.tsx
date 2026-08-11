"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [city, setCity] = React.useState("");
  const [apiKeys, setApiKeys] = React.useState<any[]>([]);
  const [newKeyName, setNewKeyName] = React.useState("Default key");
  const [createdSecret, setCreatedSecret] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me");
      const json = await me.json();
      if (!json.ok) {
        router.push("/login?next=/settings");
        return;
      }
      setName(json.data.user.displayName || json.data.user.name || "");
      setBio(json.data.user.bio || "");
      setCity(json.data.user.profile?.city || "");
      const keys = await fetch("/api/keys");
      if (keys.ok) {
        const kJson = await keys.json();
        if (kJson.ok) setApiKeys(kJson.data.keys);
      }
    })();
  }, [router]);

  async function saveProfile() {
    const res = await fetch("/api/auth/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name, bio, city }),
    });
    const json = await res.json();
    setMessage(json.ok ? "Profile saved" : json.error?.message);
  }

  async function createKey() {
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName }),
    });
    const json = await res.json();
    if (json.ok) {
      setCreatedSecret(json.data.secret);
      setApiKeys((prev) => [json.data.key, ...prev]);
    } else {
      setMessage(json.error?.message ?? "Could not create key");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <>
      <PageHero eyebrow="Account" title="Settings" description="Profile, API keys, and session." />
      <div className="container-page grid max-w-3xl gap-8 py-10">
        <section className="space-y-4 rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display text-xl font-semibold">Profile</h2>
          <div>
            <Label>Display name</Label>
            <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>City</Label>
            <Input className="mt-1.5" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea className="mt-1.5" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
          </div>
          <Button onClick={() => void saveProfile()}>Save profile</Button>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display text-xl font-semibold">FairPrice ID</h2>
          <p className="text-sm text-foreground-muted">
            Identity verification, security, and privacy controls.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="lime">
              <a href="/verify">Verify identity</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/settings/verification">Verification</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/settings/security">Security</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/settings/privacy">Privacy</a>
            </Button>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display text-xl font-semibold">API keys</h2>
          <p className="text-sm text-foreground-muted">
            Requires BUSINESS or admin role. Copy secrets immediately — they are shown once.
          </p>
          <div className="flex gap-2">
            <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
            <Button variant="outline" onClick={() => void createKey()}>
              Create
            </Button>
          </div>
          {createdSecret ? (
            <p className="rounded-xl bg-secondary px-4 py-3 text-sm break-all">
              Secret: {createdSecret}
            </p>
          ) : null}
          <ul className="space-y-2 text-sm">
            {apiKeys.map((k) => (
              <li key={k.id} className="flex justify-between rounded-xl border border-border px-4 py-3">
                <span>
                  {k.name} · {k.keyPrefix}…
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await fetch(`/api/keys?id=${k.id}`, { method: "DELETE" });
                    setApiKeys((prev) => prev.filter((x) => x.id !== k.id));
                  }}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        </section>

        {message ? <p className="text-sm text-foreground-muted">{message}</p> : null}

        <Button variant="outline" onClick={() => void logout()}>
          Sign out
        </Button>
      </div>
    </>
  );
}

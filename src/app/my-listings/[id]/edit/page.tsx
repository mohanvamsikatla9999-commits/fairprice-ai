"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priceInr, setPriceInr] = React.useState("");
  const [city, setCity] = React.useState("");
  const [area, setArea] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/listings/${params.id}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Failed to load");
        return;
      }
      const listing = json.data.listing;
      setTitle(listing.title);
      setDescription(listing.description);
      setPriceInr(String(listing.priceInr));
      setCity(listing.city ?? "");
      setArea(listing.area ?? "");
    })();
  }, [params.id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priceInr: Number(priceInr),
          city,
          area: area || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Save failed");
      router.push("/my-listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page max-w-xl py-10">
      <h1 className="font-display text-3xl font-bold">Edit listing</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Update price, title, or description.{" "}
        <Link href="/my-listings" className="text-primary hover:underline">
          Back
        </Link>
      </p>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      <form onSubmit={save} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            className="mt-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            className="mt-2 min-h-32"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="price">Price (INR)</Label>
          <Input
            id="price"
            type="number"
            className="mt-2"
            value={priceInr}
            onChange={(e) => setPriceInr(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            className="mt-2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="area">Area</Label>
          <Input
            id="area"
            className="mt-2"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}

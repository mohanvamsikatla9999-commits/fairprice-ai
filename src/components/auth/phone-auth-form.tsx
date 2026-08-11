"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PhoneAuthForm({
  onSuccess,
}: {
  onSuccess: (data: { requiresFaceVerification?: boolean; isNew?: boolean }) => void;
}) {
  const [phone, setPhone] = React.useState("");
  const [code, setCode] = React.useState("");
  const [step, setStep] = React.useState<"phone" | "otp">("phone");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hint, setHint] = React.useState<string | null>(null);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/phone/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, purpose: "login" }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      setError(json.error?.message ?? "Could not send OTP");
      return;
    }
    setHint(json.data.message);
    setStep("otp");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/phone/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      setError(json.error?.message ?? "Invalid OTP");
      return;
    }
    onSuccess({
      requiresFaceVerification: json.data.requiresFaceVerification,
      isNew: json.data.isNew,
    });
  }

  if (step === "otp") {
    return (
      <form onSubmit={verifyOtp} className="space-y-4">
        <div>
          <Label>OTP sent to {phone}</Label>
          <Input
            className="mt-1.5"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            required
            maxLength={6}
          />
        </div>
        {hint ? <p className="text-xs text-foreground-muted">{hint}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" variant="lime" className="w-full" disabled={busy}>
          {busy ? "Verifying…" : "Verify & continue"}
        </Button>
        <button
          type="button"
          className="w-full text-sm text-primary hover:underline"
          onClick={() => setStep("phone")}
        >
          Change number
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendOtp} className="space-y-4">
      <div>
        <Label>Mobile number</Label>
        <Input
          className="mt-1.5"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="10-digit Indian mobile"
          required
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" variant="lime" className="w-full" disabled={busy}>
        {busy ? "Sending…" : "Continue with phone"}
      </Button>
    </form>
  );
}

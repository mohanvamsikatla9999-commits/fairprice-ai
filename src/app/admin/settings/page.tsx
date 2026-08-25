"use client";

import * as React from "react";
import { Sparkles, MessageSquare, Shield, Database, Zap, Check } from "lucide-react";
import { env } from "@/config/env";

type SettingRow = { label: string; value: string; status: "ok" | "warn" | "missing" };

function StatusDot({ status }: { status: SettingRow["status"] }) {
  return (
    <span className={`inline-flex h-2 w-2 rounded-full ${status === "ok" ? "bg-green-500" : status === "warn" ? "bg-amber-400" : "bg-red-400"}`} />
  );
}

const CONFIG_SECTIONS = [
  {
    title: "AI Provider",
    icon: Sparkles,
    color: "bg-primary/10 text-primary",
    rows: [
      { label: "AI_PROVIDER", key: "AI_PROVIDER" },
      { label: "GEMINI_MODEL", key: "GEMINI_MODEL" },
      { label: "GEMINI_API_KEY", key: "GEMINI_API_KEY", secret: true },
      { label: "AI_TIMEOUT_MS", key: "AI_TIMEOUT_MS" },
    ],
  },
  {
    title: "SMS / OTP",
    icon: MessageSquare,
    color: "bg-green-100 text-green-700",
    rows: [
      { label: "SMS_PROVIDER", key: "SMS_PROVIDER" },
      { label: "SMSGATE_URL", key: "SMSGATE_URL" },
      { label: "SMSGATE_USERNAME", key: "SMSGATE_USERNAME" },
      { label: "SMSGATE_SIM", key: "SMSGATE_SIM" },
    ],
  },
  {
    title: "Auth & Security",
    icon: Shield,
    color: "bg-amber-100 text-amber-700",
    rows: [
      { label: "AUTH_SECRET", key: "AUTH_SECRET", secret: true },
      { label: "AUTH_SESSION_DAYS", key: "AUTH_SESSION_DAYS" },
      { label: "FACE_VERIFICATION_AT_SIGNIN", key: "FACE_VERIFICATION_AT_SIGNIN" },
      { label: "MOCK_IDENTITY_VERIFICATION", key: "MOCK_IDENTITY_VERIFICATION" },
    ],
  },
  {
    title: "Storage & Payment",
    icon: Database,
    color: "bg-blue-100 text-blue-700",
    rows: [
      { label: "STORAGE_PROVIDER", key: "STORAGE_PROVIDER" },
      { label: "STORAGE_LOCAL_PATH", key: "STORAGE_LOCAL_PATH" },
      { label: "PAYMENT_PROVIDER", key: "PAYMENT_PROVIDER" },
      { label: "NODE_ENV", key: "NODE_ENV" },
    ],
  },
];

export default function AdminSettingsPage() {
  const [serverConfig, setServerConfig] = React.useState<Record<string, string> | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((j) => { if (j.ok) setServerConfig(j.data.config); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Admin settings</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Live configuration values from environment. Secrets are masked. Edit via <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">.env</code> and restart the server.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-foreground-muted">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading config…
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {CONFIG_SECTIONS.map((section) => (
            <div key={section.title} className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-border px-5 py-4">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${section.color}`}>
                  <section.icon className="h-4 w-4" />
                </div>
                <h2 className="font-semibold">{section.title}</h2>
              </div>
              <div className="divide-y divide-border">
                {section.rows.map((row) => {
                  const raw = serverConfig?.[row.key] ?? "";
                  const hasValue = Boolean(raw);
                  const display = row.secret && hasValue ? `${raw.slice(0, 6)}${"•".repeat(Math.min(16, raw.length - 6))}` : raw || "—";
                  const status: SettingRow["status"] = !hasValue ? "missing" : row.key === "MOCK_IDENTITY_VERIFICATION" && raw === "true" ? "warn" : row.key === "PAYMENT_PROVIDER" && raw === "mock" ? "warn" : "ok";

                  return (
                    <div key={row.label} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="flex items-center gap-2">
                        <StatusDot status={status} />
                        <span className="font-mono text-xs text-foreground-muted">{row.label}</span>
                      </div>
                      <span className={`max-w-[180px] truncate font-mono text-xs ${hasValue ? "text-foreground" : "text-red-400"}`}>
                        {display}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Production checklist */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
            <Zap className="h-4 w-4 text-green-700" />
          </div>
          <h2 className="font-semibold">Production checklist</h2>
        </div>
        <div className="space-y-2">
          {[
            { label: "FACE_VERIFICATION_AT_SIGNIN=true", done: serverConfig?.FACE_VERIFICATION_AT_SIGNIN === "true" },
            { label: "MOCK_IDENTITY_VERIFICATION=false", done: serverConfig?.MOCK_IDENTITY_VERIFICATION === "false" },
            { label: "NODE_ENV=production", done: serverConfig?.NODE_ENV === "production" },
            { label: "GEMINI_API_KEY set", done: Boolean(serverConfig?.GEMINI_API_KEY) },
            { label: "SMS_PROVIDER=smsgate (or real provider)", done: serverConfig?.SMS_PROVIDER !== "mock" },
            { label: "AUTH_SECRET is long random string", done: (serverConfig?.AUTH_SECRET?.length ?? 0) >= 32 },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              <Check className={`h-4 w-4 shrink-0 ${item.done ? "text-green-500" : "text-border"}`} />
              <span className={item.done ? "text-foreground" : "text-foreground-muted"}>{item.label}</span>
              {!item.done && <span className="text-xs text-amber-600 ml-auto">⚠ check</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AdminMetrics } from "../types";
import {
  Shield,
  Server,
  Activity,
  Users,
  Calendar,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Compass,
  Bell,
  Cpu,
} from "lucide-react";

export const AdminDashboardView: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async () => {
    try {
      setError(null);
      const token = typeof currentUser?.getIdToken === "function" ? await currentUser.getIdToken() : "";
      const res = await fetch("/api/admin/metrics", {
        headers: {
          Authorization: `Bearer ${token || ""}`,
          "x-user-id": currentUser?.uid || "",
        },
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Access restricted to authorized administrators (Firebase custom claim admin==true).");
        }
        throw new Error(`Failed to load metrics (${res.status})`);
      }

      const data = await res.json();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || "Failed to load operational metrics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [currentUser]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${Math.max(m, 1)}m`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-accent,#1C6E41)] mx-auto mb-3" />
        <p className="text-xs text-[var(--color-text-secondary,#405746)]">
          Verifying administrator credentials and loading operational telemetry...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 rounded-2xl bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-700 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-[var(--color-text-primary,#152419)] mb-2">
          Administrator Access Restricted
        </h2>
        <p className="text-xs text-[var(--color-text-secondary,#405746)] leading-relaxed mb-6">
          {error}
        </p>
        <div className="p-3 bg-[var(--color-bg-subtle,#ECF4EC)] rounded-xl border border-[var(--color-border-subtle,#E6EFE8)] text-left text-[11px] font-mono text-[var(--color-text-secondary,#405746)] mb-6">
          <p className="font-sans font-semibold text-[var(--color-text-primary,#152419)] mb-1">
            How to grant admin access securely via CLI:
          </p>
          <code>node scripts/set-admin.js {currentUser?.email || currentUser?.uid}</code>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-accent,#1C6E41)] text-[var(--color-accent-contrast,#FFFFFF)] text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Retry Authorization
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border-subtle,#E6EFE8)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--color-accent-subtle,#E4F2E7)] text-[var(--color-accent,#1C6E41)]">
              <Shield className="w-3 h-3" />
              Administrator RBAC
            </span>
            <span className="text-[11px] text-[var(--color-text-muted,#677D6D)]">
              Verified via Cloud Run & Firebase Claims
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--color-text-primary,#152419)] mt-2">
            System & Operational Telemetry
          </h1>
          <p className="text-xs text-[var(--color-text-secondary,#405746)] mt-0.5">
            Cloud Run Service: <span className="font-mono font-medium">rei-app</span> • Region:{" "}
            <span className="font-mono font-medium">asia-southeast1</span>
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-[var(--color-border,#D4E3D7)] bg-[var(--color-bg-surface,#FFFFFF)] hover:bg-[var(--color-bg-subtle,#ECF4EC)] text-xs font-medium text-[var(--color-text-primary,#152419)] transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[var(--color-accent,#1C6E41)] ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Aggregate Counts (Zero user content access) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] shadow-xs">
          <div className="flex items-center justify-between text-[var(--color-text-muted,#677D6D)] mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Registered Souls</span>
            <Users className="w-4 h-4 text-[var(--color-accent,#1C6E41)]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary,#152419)] font-mono">
            {metrics?.totalUsers ?? "—"}
          </div>
          <p className="text-[11px] text-[var(--color-text-muted,#677D6D)] mt-1">
            Users practicing intentional evolution
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] shadow-xs">
          <div className="flex items-center justify-between text-[var(--color-text-muted,#677D6D)] mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Entries Today</span>
            <Calendar className="w-4 h-4 text-[var(--color-accent,#1C6E41)]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary,#152419)] font-mono">
            {metrics?.totalEntriesToday ?? "—"}
          </div>
          <p className="text-[11px] text-[var(--color-text-muted,#677D6D)] mt-1">
            Reflective pauses captured today
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] shadow-xs">
          <div className="flex items-center justify-between text-[var(--color-text-muted,#677D6D)] mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Lifetime Signals</span>
            <Activity className="w-4 h-4 text-[var(--color-accent,#1C6E41)]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary,#152419)] font-mono">
            {metrics?.totalInteractions ?? "—"}
          </div>
          <p className="text-[11px] text-[var(--color-text-muted,#677D6D)] mt-1">
            Total self-reflections supported
          </p>
        </div>
      </div>

      {/* Zero-Knowledge Privacy Architecture Guarantee */}
      <div className="p-5 rounded-2xl bg-[var(--color-accent-subtle,#E4F2E7)]/60 border border-[var(--color-accent,#1C6E41)]/30">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-accent,#1C6E41)] text-[var(--color-accent-contrast,#FFFFFF)] flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary,#152419)]">
              Strict Zero-Knowledge Isolation Guarantee
            </h3>
            <p className="text-xs text-[var(--color-text-secondary,#405746)] leading-relaxed">
              In accordance with Rei's architectural mandates, this dashboard provides strictly aggregate operational
              telemetry. Admins have <strong>no capability</strong> to read, list, export, or search any user's
              journal text, photos, coordinates, or model signals. Cloud Firestore security rules strictly enforce{" "}
              <code className="bg-[var(--color-bg-surface,#FFFFFF)] px-1.5 py-0.5 rounded font-mono text-[11px]">
                request.auth.uid == userId
              </code>{" "}
              with default-deny for all unauthorized access.
            </p>
          </div>
        </div>
      </div>

      {/* System Health & Secret Manager Integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cloud Run Container & Fallbacks */}
        <div className="p-5 rounded-2xl bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[var(--color-accent,#1C6E41)]" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary,#152419)]">
                Server Runtime Status
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Healthy
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-[var(--color-border-subtle,#E6EFE8)]">
              <span className="text-[var(--color-text-secondary,#405746)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted,#677D6D)]" />
                Process Uptime
              </span>
              <span className="font-mono font-medium text-[var(--color-text-primary,#152419)]">
                {metrics?.systemHealth?.uptimeSeconds ? formatUptime(metrics.systemHealth.uptimeSeconds) : "Active"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-[var(--color-border-subtle,#E6EFE8)]">
              <span className="text-[var(--color-text-secondary,#405746)] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[var(--color-text-muted,#677D6D)]" />
                Gemini API Secret
              </span>
              <span
                className={`font-mono text-[11px] font-medium px-2 py-0.5 rounded-md ${
                  metrics?.systemHealth?.hasGeminiKey
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {metrics?.systemHealth?.hasGeminiKey ? "Configured (Secret Manager)" : "Local Fallback"}
              </span>
            </div>

            <div className="py-2">
              <p className="text-[11px] font-medium text-[var(--color-text-muted,#677D6D)] mb-2 uppercase tracking-wider">
                Gemini Fallback Cascade Models:
              </p>
              <div className="space-y-1.5">
                {metrics?.systemHealth?.modelsStatus?.map((m) => (
                  <div
                    key={m.model}
                    className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-bg-subtle,#ECF4EC)] border border-[var(--color-border-subtle,#E6EFE8)]"
                  >
                    <span className="font-mono text-[11px] text-[var(--color-text-primary,#152419)]">
                      {m.model}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        m.state === "ready"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {m.state === "ready" ? "Ready" : "Cooling down (Quota backoff)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Integration Secrets & Extras */}
        <div className="p-5 rounded-2xl bg-[var(--color-bg-surface,#FFFFFF)] border border-[var(--color-border,#D4E3D7)] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[var(--color-accent,#1C6E41)]" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary,#152419)]">
                Challenge Extensions
              </h3>
            </div>
            <span className="text-[11px] text-[var(--color-text-muted,#677D6D)]">
              Secret Manager State
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-[var(--color-bg-subtle,#ECF4EC)] border border-[var(--color-border-subtle,#E6EFE8)] flex items-start justify-between">
              <div>
                <p className="font-medium text-[var(--color-text-primary,#152419)]">Google Maps & Places</p>
                <p className="text-[11px] text-[var(--color-text-muted,#677D6D)] mt-0.5">
                  Reverse geocoding & location pinning on entries
                </p>
              </div>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  metrics?.systemHealth?.hasMapsKey
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {metrics?.systemHealth?.hasMapsKey ? "Active (Maps API)" : "Coordinates Fallback"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-bg-subtle,#ECF4EC)] border border-[var(--color-border-subtle,#E6EFE8)] flex items-start justify-between">
              <div>
                <p className="font-medium text-[var(--color-text-primary,#152419)]">Slack Webhook</p>
                <p className="text-[11px] text-[var(--color-text-muted,#677D6D)] mt-0.5">
                  External check-in ping: "Take a moment to check in with yourself."
                </p>
              </div>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  metrics?.systemHealth?.hasSlackWebhook
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {metrics?.systemHealth?.hasSlackWebhook ? "Configured" : "Dormant (Opt-in)"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-bg-subtle,#ECF4EC)] border border-[var(--color-border-subtle,#E6EFE8)] flex items-start justify-between">
              <div>
                <p className="font-medium text-[var(--color-text-primary,#152419)]">Discord Webhook</p>
                <p className="text-[11px] text-[var(--color-text-muted,#677D6D)] mt-0.5">
                  Server-side ping with SSRF hostname guard
                </p>
              </div>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  metrics?.systemHealth?.hasDiscordWebhook
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {metrics?.systemHealth?.hasDiscordWebhook ? "Configured" : "Dormant (Opt-in)"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-bg-subtle,#ECF4EC)] border border-[var(--color-border-subtle,#E6EFE8)] flex items-start justify-between">
              <div>
                <p className="font-medium text-[var(--color-text-primary,#152419)]">Transactional Email</p>
                <p className="text-[11px] text-[var(--color-text-muted,#677D6D)] mt-0.5">
                  SendGrid / SMTP outgoing reminders (no sensitive data)
                </p>
              </div>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  metrics?.systemHealth?.hasEmailConfig
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {metrics?.systemHealth?.hasEmailConfig ? "Configured" : "Dry-run Mode"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

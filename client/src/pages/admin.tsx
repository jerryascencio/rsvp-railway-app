import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  PieChart,
  Upload,
  Download,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Loader2,
  Mail,
  KeyRound,
  Search,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import type { AdditionalName, GuestWithResponse, Totals } from "@shared/schema";
import { api, apiUrl, setAuthToken, getAuthToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type Status = {
  needsSetup: boolean;
  authenticated: boolean;
  adminEmail?: string;
  defaults: { adminEmail: string; smtpUser: string; notifyEmail: string };
};

const APP_PASSWORDS_URL = "https://myaccount.google.com/apppasswords";

/* ------------------------------------------------------------- utilities */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-neutral-700">{label}</Label>
      {children}
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-12 font-sans">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-neutral-900">{title}</h1>
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          {children}
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-neutral-500 hover:text-neutral-900" data-testid="link-public">
            ← Back to the invitation
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- setup */

function SetupForm({ status, onDone }: { status: Status; onDone: () => void }) {
  const { toast } = useToast();
  const [adminEmail, setAdminEmail] = useState(status.defaults.adminEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [smtpUser, setSmtpUser] = useState(status.defaults.smtpUser);
  const [smtpPass, setSmtpPass] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(status.defaults.notifyEmail);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ token: string }>("POST", "/api/auth/setup", {
        adminEmail,
        password,
        smtpUser,
        smtpPass,
        notifyEmail,
      });
      setAuthToken(res.token);
      toast({ title: "Setup complete", description: "You're signed in." });
      onDone();
    } catch (err: any) {
      toast({ title: "Setup failed", description: err?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Set up the RSVP dashboard"
      subtitle="One-time setup for Leah's Quinceañera"
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Admin email" hint="You'll use this to sign in.">
          <Input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            required
            data-testid="input-setup-admin-email"
          />
        </Field>
        <Field label="Admin password">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            data-testid="input-setup-password"
          />
        </Field>
        <Field label="Confirm password">
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            data-testid="input-setup-confirm"
          />
        </Field>
        <div className="h-px bg-neutral-200" />
        <Field label="Gmail sender address" hint="RSVP emails are sent from this address.">
          <Input
            type="email"
            value={smtpUser}
            onChange={(e) => setSmtpUser(e.target.value)}
            data-testid="input-setup-smtp-user"
          />
        </Field>
        <Field
          label="Gmail app password"
          hint={
            <>
              Get one at{" "}
              <a
                className="underline"
                href={APP_PASSWORDS_URL}
                target="_blank"
                rel="noreferrer"
              >
                myaccount.google.com/apppasswords
              </a>{" "}
              (16 characters, spaces are fine). Leave blank to skip email sending
              for now.
            </>
          }
        >
          <Input
            type="password"
            value={smtpPass}
            onChange={(e) => setSmtpPass(e.target.value)}
            data-testid="input-setup-smtp-pass"
          />
        </Field>
        <Field label="Send RSVP reports to" hint="Every RSVP triggers a running-total email here.">
          <Input
            type="email"
            value={notifyEmail}
            onChange={(e) => setNotifyEmail(e.target.value)}
            data-testid="input-setup-notify-email"
          />
        </Field>
        <Button type="submit" className="w-full" disabled={busy} data-testid="button-setup-submit">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create admin & save settings
        </Button>
      </form>
    </AuthShell>
  );
}

/* ----------------------------------------------------------------- login */

function LoginForm({ status, onDone }: { status: Status; onDone: () => void }) {
  const { toast } = useToast();
  const [email, setEmail] = useState(status.defaults.adminEmail);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ token: string }>("POST", "/api/auth/login", {
        email,
        password,
      });
      setAuthToken(res.token);
      onDone();
    } catch (err: any) {
      toast({ title: "Sign-in failed", description: err?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Host sign-in" subtitle="Leah's Quinceañera RSVP dashboard">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            data-testid="input-login-email"
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            data-testid="input-login-password"
          />
        </Field>
        <Button type="submit" className="w-full" disabled={busy} data-testid="button-login-submit">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

/* ------------------------------------------------------------- dashboard */

type GuestDraft = {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  invites: number;
  additionalNames: AdditionalName[];
  attendees: string;
  declinedCount: string;
  note: string;
  hasResponse: boolean;
};

const emptyDraft: GuestDraft = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  invites: 1,
  additionalNames: [],
  attendees: "",
  declinedCount: "",
  note: "",
  hasResponse: false,
};

const MAX_ADDITIONAL = 9;

/**
 * Resize the additional-names rows to (partySize - 1), keeping whatever the
 * user already typed. Growing appends blanks; shrinking drops trailing rows.
 */
function resizeAdditional(list: AdditionalName[], partySize: number): AdditionalName[] {
  const want = Math.max(0, Math.min(MAX_ADDITIONAL, (Number(partySize) || 1) - 1));
  const next = list.slice(0, want);
  while (next.length < want) next.push({ firstName: "", lastName: "" });
  return next;
}

/** "Stefanie Ascencio, Marco Ascencio" */
function alsoInParty(list: AdditionalName[] | null | undefined): string {
  return (list || [])
    .map((n) => `${n.firstName} ${n.lastName}`.trim())
    .filter(Boolean)
    .join(", ");
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  testId,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  testId: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center gap-2 text-neutral-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-3 text-3xl font-semibold text-neutral-900" data-testid={testId}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-neutral-500">{sub}</div>}
    </div>
  );
}

function Dashboard({ status, onLogout }: { status: Status; onLogout: () => void }) {
  const { toast } = useToast();
  const [guests, setGuests] = useState<GuestWithResponse[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "attending" | "declined" | "pending">(
    "all",
  );
  const [draft, setDraft] = useState<GuestDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GuestWithResponse | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // settings tab
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpPassSet, setSmtpPassSet] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api<{ guests: GuestWithResponse[]; totals: Totals }>(
        "GET",
        "/api/admin/guests",
      );
      setGuests(data.guests);
      setTotals(data.totals);
    } catch (err: any) {
      if (err?.status === 401) onLogout();
      else toast({ title: "Could not load guests", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function loadSettings() {
    try {
      const data = await api<{
        settings: { smtpUser: string; smtpPassSet: boolean; notifyEmail: string };
      }>("GET", "/api/admin/settings");
      setSmtpUser(data.settings.smtpUser);
      setSmtpPassSet(data.settings.smtpPassSet);
      setNotifyEmail(data.settings.notifyEmail);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return guests.filter((g) => {
      const r = g.response;
      if (statusFilter === "attending" && !(r && r.attendees > 0)) return false;
      if (statusFilter === "declined" && !(r && r.attendees === 0)) return false;
      if (statusFilter === "pending" && r) return false;
      if (!needle) return true;
      const hay = [
        g.firstName,
        g.lastName,
        alsoInParty(g.additionalNames),
        g.phone,
        g.email || "",
        r ? (r.attendees > 0 ? "attending yes" : "not attending no declined") : "pending",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [guests, filter, statusFilter]);

  async function saveGuest() {
    if (!draft) return;
    if (!draft.firstName.trim()) {
      toast({ title: "First name is required.", variant: "destructive" });
      return;
    }
    const invites = Math.max(1, Number(draft.invites) || 1);
    const hasCounts = draft.attendees !== "";
    if (hasCounts) {
      const a = Number(draft.attendees) || 0;
      const d = draft.declinedCount === "" ? invites - a : Number(draft.declinedCount) || 0;
      if (a + d !== invites) {
        toast({
          title: `Attending + not attending must add up to ${invites}.`,
          variant: "destructive",
        });
        return;
      }
    }
    const additionalNames = resizeAdditional(draft.additionalNames, invites)
      .map((n) => ({ firstName: n.firstName.trim(), lastName: n.lastName.trim() }))
      .filter((n) => n.firstName || n.lastName);
    setSaving(true);
    try {
      if (draft.id) {
        await api("PATCH", `/api/admin/guests/${draft.id}`, {
          firstName: draft.firstName,
          lastName: draft.lastName,
          phone: draft.phone,
          email: draft.email || null,
          invites,
          additionalNames,
          attendees: hasCounts ? Number(draft.attendees) : undefined,
          declinedCount:
            draft.declinedCount === "" ? undefined : Number(draft.declinedCount),
          note: draft.note || null,
          clearResponse: !hasCounts && draft.hasResponse,
        });
      } else {
        await api("POST", "/api/admin/guests", {
          firstName: draft.firstName,
          lastName: draft.lastName,
          phone: draft.phone,
          email: draft.email || null,
          invites,
          additionalNames,
        });
      }
      setDraft(null);
      await load();
      toast({ title: "Saved" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function removeGuest() {
    if (!deleteTarget) return;
    try {
      await api("DELETE", `/api/admin/guests/${deleteTarget.id}`);
      setDeleteTarget(null);
      await load();
      toast({ title: "Guest removed" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.message, variant: "destructive" });
    }
  }

  async function handleUpload(file: File) {
    const text = await file.text();
    try {
      const res = await api<{ added: number; updated: number; skipped: number }>(
        "POST",
        "/api/admin/guests/import",
        { csv: text },
      );
      setImportResult(`Added ${res.added}, updated ${res.updated}, skipped ${res.skipped}.`);
      await load();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message, variant: "destructive" });
    }
  }

  async function downloadCsv() {
    try {
      const token = getAuthToken();
      const res = await fetch(apiUrl("/api/admin/guests/export"), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leah-quinceanera-rsvps.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ title: "Export failed", description: err?.message, variant: "destructive" });
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await api<{ settings: { smtpPassSet: boolean } }>(
        "PATCH",
        "/api/admin/settings",
        {
          smtpUser,
          smtpPass: smtpPass || undefined,
          notifyEmail,
          newPassword: newPassword || undefined,
        },
      );
      setSmtpPass("");
      setNewPassword("");
      setSmtpPassSet(res.settings.smtpPassSet);
      toast({ title: "Settings saved" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err?.message, variant: "destructive" });
    } finally {
      setSavingSettings(false);
    }
  }

  async function sendTest() {
    try {
      const res = await api<{ to: string }>("POST", "/api/admin/settings/test-email", {});
      toast({ title: "Test email sent", description: `Sent to ${res.to}` });
    } catch (err: any) {
      toast({ title: "Test email failed", description: err?.message, variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-base font-semibold text-neutral-900">
              Leah&rsquo;s Quinceañera — RSVP Dashboard
            </h1>
            <p className="text-xs text-neutral-500">
              Friday, September 18, 2026 · RSVP deadline August 18, 2026
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="button-view-public">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Invitation
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={onLogout} data-testid="button-logout">
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Tabs defaultValue="overview" onValueChange={() => load()}>
          <TabsList data-testid="tabs-admin">
            <TabsTrigger value="overview" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="guests" data-testid="tab-guests">
              Guests
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              Settings
            </TabsTrigger>
          </TabsList>

          {/* ---------------- overview ---------------- */}
          <TabsContent value="overview" className="mt-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard
                icon={Users}
                label="Total invited"
                value={totals?.totalInvited ?? "—"}
                sub={`${totals?.totalHouseholds ?? 0} households`}
                testId="stat-total-invited"
              />
              <StatCard
                icon={UserCheck}
                label="Confirmed attending"
                value={totals?.totalHeadcount ?? "—"}
                sub="people coming"
                testId="stat-attending"
              />
              <StatCard
                icon={UserX}
                label="Not attending"
                value={totals?.totalDeclined ?? "—"}
                sub="declined seats"
                testId="stat-declined"
              />
              <StatCard
                icon={Clock}
                label="Pending"
                value={totals?.totalPending ?? "—"}
                sub={`${totals?.totalPendingHouseholds ?? 0} households`}
                testId="stat-pending"
              />
              <StatCard
                icon={PieChart}
                label="Response rate"
                value={`${totals?.responseRate ?? 0}%`}
                sub={`${totals?.respondedHouseholds ?? 0} of ${totals?.totalHouseholds ?? 0} responded`}
                testId="stat-response-rate"
              />
            </div>
            <div className="mt-5 rounded-xl border border-neutral-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-neutral-900">How the math works</h2>
              <ul className="mt-2 space-y-1 text-sm text-neutral-600">
                <li>Confirmed attending = the seats guests said yes to.</li>
                <li>
                  Not attending = invited seats minus attending seats, for every household
                  that has responded.
                </li>
                <li>Pending = all seats belonging to households that haven&rsquo;t responded.</li>
              </ul>
            </div>

            {/* ---------------- status lists ---------------- */}
            {(() => {
              const attendingList = guests.filter(
                (g) => (g.response?.attendees ?? 0) > 0,
              );
              const declinedList = guests.filter(
                (g) =>
                  g.response != null &&
                  (g.response.attendees ?? 0) === 0 &&
                  (g.response.declinedCount ?? 0) > 0,
              );
              const pendingList = guests.filter((g) => g.response == null);

              type G = (typeof guests)[number];
              const GuestCard = ({ g, kind }: { g: G; kind: "yes" | "no" | "pending" }) => {
                const name = g.fullName || `${g.firstName ?? ""} ${g.lastName ?? ""}`.trim();
                const extras = alsoInParty(g.additionalNames);
                const attendees = g.response?.attendees ?? 0;
                const declined = g.response?.declinedCount ?? 0;
                const badge =
                  kind === "yes"
                    ? `${attendees} of ${g.invites} coming`
                    : kind === "no"
                      ? `${declined} of ${g.invites} declined`
                      : `${g.invites} invited`;
                const badgeClass =
                  kind === "yes"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : kind === "no"
                      ? "bg-neutral-100 text-neutral-700 border-neutral-200"
                      : "bg-amber-50 text-amber-700 border-amber-200";
                return (
                  <li
                    key={g.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2"
                    data-testid={`status-row-${kind}-${g.id}`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-neutral-900">{name}</div>
                      {extras && (
                        <div className="mt-0.5 truncate text-xs text-neutral-500">{extras}</div>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${badgeClass}`}
                    >
                      {badge}
                    </span>
                  </li>
                );
              };

              const Column = ({
                title,
                accent,
                items,
                kind,
                empty,
              }: {
                title: string;
                accent: string;
                items: G[];
                kind: "yes" | "no" | "pending";
                empty: string;
              }) => (
                <div className="rounded-xl border border-neutral-200 bg-white">
                  <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
                    <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${accent}`}
                    >
                      {items.length}
                    </span>
                  </div>
                  {items.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-neutral-500">{empty}</p>
                  ) : (
                    <ul className="max-h-[420px] space-y-2 overflow-auto p-3">
                      {items.map((g) => (
                        <GuestCard key={g.id} g={g} kind={kind} />
                      ))}
                    </ul>
                  )}
                </div>
              );

              return (
                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <Column
                    title="Attending"
                    accent="bg-emerald-50 text-emerald-700"
                    items={attendingList}
                    kind="yes"
                    empty="No confirmed yeses yet."
                  />
                  <Column
                    title="Not attending"
                    accent="bg-neutral-100 text-neutral-700"
                    items={declinedList}
                    kind="no"
                    empty="No declines yet."
                  />
                  <Column
                    title="Pending"
                    accent="bg-amber-50 text-amber-700"
                    items={pendingList}
                    kind="pending"
                    empty="Everyone has responded."
                  />
                </div>
              );
            })()}
          </TabsContent>

          {/* ---------------- guests ---------------- */}
          <TabsContent value="guests" className="mt-5">
            <div className="rounded-xl border border-neutral-200 bg-white">
              <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 p-4">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filter by name, phone, email, or status"
                    className="pl-9"
                    data-testid="input-guest-filter"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-9 rounded-md border border-neutral-300 bg-white px-2 text-sm"
                  data-testid="select-status-filter"
                >
                  <option value="all">All statuses</option>
                  <option value="attending">Attending</option>
                  <option value="declined">Not attending</option>
                  <option value="pending">Pending</option>
                </select>
                <Button
                  size="sm"
                  onClick={() => setDraft({ ...emptyDraft })}
                  data-testid="button-add-guest"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add guest
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  data-testid="button-upload-csv"
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload CSV
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  data-testid="input-csv-file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = "";
                  }}
                />
                <Button size="sm" variant="outline" onClick={() => load()} data-testid="button-refresh">
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Refresh
                </Button>
                <Button size="sm" variant="outline" onClick={downloadCsv} data-testid="button-download-csv">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download CSV
                </Button>
              </div>

              <div
                className="border-b border-neutral-200 px-4 py-2 text-xs text-neutral-500"
                data-testid="text-csv-columns-note"
              >
                CSV columns: <code>firstName, lastName, phone, email, invites</code>. Optional
                columns: <code>additional1_first</code>, <code>additional1_last</code>,{" "}
                <code>additional2_first</code>, <code>additional2_last</code>, … up to{" "}
                <code>additional9</code>.
              </div>

              {importResult && (
                <div
                  className="border-b border-neutral-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800"
                  data-testid="text-import-result"
                >
                  {importResult}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Contact</th>
                      <th className="px-4 py-3 font-medium">Party size</th>
                      <th className="px-4 py-3 font-medium">Attending</th>
                      <th className="px-4 py-3 font-medium">Declined</th>
                      <th className="px-4 py-3 font-medium">Pending seats</th>
                      <th className="px-4 py-3 font-medium">Note</th>
                      <th className="px-4 py-3 font-medium">Updated</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {loading && (
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-neutral-500">
                          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                        </td>
                      </tr>
                    )}
                    {!loading && rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-12 text-center text-neutral-500"
                          data-testid="text-empty-guests"
                        >
                          No guests yet. Add one or upload a CSV
                          (firstName,lastName,phone,email,invites).
                        </td>
                      </tr>
                    )}
                    {rows.map((g) => {
                      const r = g.response;
                      return (
                        <tr key={g.id} className="hover:bg-neutral-50" data-testid={`row-guest-${g.id}`}>
                          <td className="px-4 py-3 font-medium text-neutral-900">
                            <div>{g.fullName || `${g.firstName} ${g.lastName}`}</div>
                            {g.additionalNames.length > 0 && (
                              <div
                                className="mt-0.5 max-w-[240px] truncate text-xs font-normal text-neutral-400"
                                title={`Also in party: ${alsoInParty(g.additionalNames)}`}
                                data-testid={`text-also-in-party-${g.id}`}
                              >
                                Also in party: {alsoInParty(g.additionalNames)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-neutral-600">
                            <div>{g.phone || "—"}</div>
                            <div className="text-xs text-neutral-400">{g.email || ""}</div>
                          </td>
                          <td className="px-4 py-3 text-neutral-700">{g.invites}</td>
                          <td className="px-4 py-3">
                            {r ? (
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                  r.attendees > 0
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-neutral-100 text-neutral-500"
                                }`}
                              >
                                {r.attendees}
                              </span>
                            ) : (
                              <span className="text-neutral-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-neutral-700">
                            {r ? r.declinedCount : <span className="text-neutral-400">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {r ? (
                              <span className="text-neutral-400">0</span>
                            ) : (
                              <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                {g.invites}
                              </span>
                            )}
                          </td>
                          <td className="max-w-[220px] px-4 py-3 text-neutral-600">
                            {r?.note ? (
                              <span title={r.note} className="line-clamp-2">
                                {r.note}
                              </span>
                            ) : (
                              <span className="text-neutral-400">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
                            {r ? new Date(r.updatedAt).toLocaleString() : "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                setDraft({
                                  id: g.id,
                                  firstName: g.firstName,
                                  lastName: g.lastName,
                                  phone: g.phone,
                                  email: g.email || "",
                                  invites: g.invites,
                                  additionalNames: resizeAdditional(
                                    g.additionalNames.map((n) => ({ ...n })),
                                    g.invites,
                                  ),
                                  attendees: r ? String(r.attendees) : "",
                                  declinedCount: r ? String(r.declinedCount) : "",
                                  note: r?.note || "",
                                  hasResponse: !!r,
                                })
                              }
                              data-testid={`button-edit-${g.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteTarget(g)}
                              data-testid={`button-delete-${g.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ---------------- settings ---------------- */}
          <TabsContent value="settings" className="mt-5">
            <form
              onSubmit={saveSettings}
              className="max-w-xl space-y-5 rounded-xl border border-neutral-200 bg-white p-6"
            >
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                  <Mail className="h-4 w-4" /> Email sending
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Signed in as {status.adminEmail || status.defaults.adminEmail}
                </p>
              </div>
              <Field label="Gmail sender address">
                <Input
                  type="email"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  data-testid="input-settings-smtp-user"
                />
              </Field>
              <Field
                label="Gmail app password"
                hint={
                  <>
                    {smtpPassSet ? "A password is saved. " : "No password saved yet. "}
                    Get one at{" "}
                    <a className="underline" href={APP_PASSWORDS_URL} target="_blank" rel="noreferrer">
                      myaccount.google.com/apppasswords
                    </a>
                    . Leave blank to keep the current one.
                  </>
                }
              >
                <Input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder={smtpPassSet ? "••••••••••••••••" : ""}
                  data-testid="input-settings-smtp-pass"
                />
              </Field>
              <Field label="Send RSVP reports to">
                <Input
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  data-testid="input-settings-notify-email"
                />
              </Field>
              <div className="h-px bg-neutral-200" />
              <Field
                label="Change admin password"
                hint="Leave blank to keep your current password."
              >
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  data-testid="input-settings-new-password"
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={savingSettings} data-testid="button-save-settings">
                  {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                  Save settings
                </Button>
                <Button type="button" variant="outline" onClick={sendTest} data-testid="button-test-email">
                  Send test email
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </main>

      {/* guest dialog */}
      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit guest" : "Add guest"}</DialogTitle>
            <DialogDescription>
              Party size is how many seats this household may fill. Attending + declined must
              add up to the party size.
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name">
                  <Input
                    value={draft.firstName}
                    onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
                    data-testid="input-guest-first-name"
                  />
                </Field>
                <Field label="Last name">
                  <Input
                    value={draft.lastName}
                    onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
                    data-testid="input-guest-last-name"
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone">
                  <Input
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                    data-testid="input-guest-phone"
                  />
                </Field>
                <Field label="Email">
                  <Input
                    value={draft.email}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                    data-testid="input-guest-email"
                  />
                </Field>
              </div>
              <Field label="Party size (invites)">
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={draft.invites}
                  onChange={(e) => {
                    const invites = Number(e.target.value);
                    setDraft({
                      ...draft,
                      invites,
                      additionalNames: resizeAdditional(draft.additionalNames, invites),
                    });
                  }}
                  data-testid="input-guest-invites"
                />
              </Field>

              {Number(draft.invites) >= 2 && (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4" data-testid="section-additional-names">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    Additional household members (optional)
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    Add other people invited in this household. Guests can find the invitation
                    by any of these names.
                  </p>
                  <div className="mt-4 space-y-3">
                    {resizeAdditional(draft.additionalNames, draft.invites).map((row, i) => (
                      <div key={i} className="space-y-1.5">
                        <Label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                          Additional guest {i + 1}
                        </Label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            value={row.firstName}
                            placeholder="First name"
                            onChange={(e) => {
                              const next = resizeAdditional(draft.additionalNames, draft.invites);
                              next[i] = { ...next[i], firstName: e.target.value };
                              setDraft({ ...draft, additionalNames: next });
                            }}
                            data-testid={`input-additional-${i + 1}-first`}
                          />
                          <Input
                            value={row.lastName}
                            placeholder="Last name"
                            onChange={(e) => {
                              const next = resizeAdditional(draft.additionalNames, draft.invites);
                              next[i] = { ...next[i], lastName: e.target.value };
                              setDraft({ ...draft, additionalNames: next });
                            }}
                            data-testid={`input-additional-${i + 1}-last`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {draft.id && (
                <>
                  <div className="h-px bg-neutral-200" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Attending" hint="Blank = still pending">
                      <Input
                        type="number"
                        min={0}
                        value={draft.attendees}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDraft({
                            ...draft,
                            attendees: v,
                            declinedCount:
                              v === ""
                                ? ""
                                : String(Math.max(0, (Number(draft.invites) || 0) - Number(v))),
                          });
                        }}
                        data-testid="input-guest-attendees"
                      />
                    </Field>
                    <Field label="Not attending">
                      <Input
                        type="number"
                        min={0}
                        value={draft.declinedCount}
                        onChange={(e) => setDraft({ ...draft, declinedCount: e.target.value })}
                        data-testid="input-guest-declined"
                      />
                    </Field>
                  </div>
                  <Field label="Note">
                    <Textarea
                      value={draft.note}
                      onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                      data-testid="input-guest-note"
                    />
                  </Field>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)} data-testid="button-cancel-guest">
              Cancel
            </Button>
            <Button onClick={saveGuest} disabled={saving} data-testid="button-save-guest">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove guest?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.fullName} and their RSVP will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={removeGuest} data-testid="button-confirm-delete">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ page */

export default function Admin() {
  const [status, setStatus] = useState<Status | null>(null);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const s = await api<Status>("GET", "/api/auth/status");
      setStatus(s);
      setAuthed(s.authenticated);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  if (loading || !status) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (status.needsSetup)
    return <SetupForm status={status} onDone={() => { setAuthed(true); refresh(); }} />;

  if (!authed)
    return <LoginForm status={status} onDone={() => { setAuthed(true); refresh(); }} />;

  return (
    <Dashboard
      status={status}
      onLogout={async () => {
        try {
          await api("POST", "/api/auth/logout");
        } catch {
          /* ignore */
        }
        setAuthToken(null);
        setAuthed(false);
      }}
    />
  );
}

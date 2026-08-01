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
  MessageSquare,
  Send,
  SkipForward,
  Check,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
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
  partyName: string;
  nameForText: string;
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
  partyName: "",
  nameForText: "",
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

// ============================================================================
// Hit em up dialog
// ----------------------------------------------------------------------------
// Compose a custom SMS body with {field} placeholders, then walk through the
// current filter's recipients one-by-one. Each Send opens iMessage via the
// `sms:` URL scheme (works on iPhone: opens Messages with To + Body prefilled).
// After Jerry sends and comes back to Safari, the dialog is waiting with the
// next recipient queued and the Next button auto-focused.
// ============================================================================

/** Extract a 10+ digit phone from a free-form string. Returns "" if the value
 *  doesn't look like a real US phone number (e.g. "WhatsApp", "None", empty). */
function normalizeSmsPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return "";
  // Prefix + and country code (assume US if 10 digits).
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

/** Substitute {Field Name} placeholders in the template using guest fields. */
function renderTemplate(template: string, guest: GuestWithResponse): string {
  const values: Record<string, string> = {
    "name for text": guest.nameForText || guest.partyName || guest.firstName,
    "name of party": guest.partyName || `${guest.firstName} ${guest.lastName}`.trim(),
    "first name": guest.firstName,
    "last name": guest.lastName,
    "full names": [
      `${guest.firstName} ${guest.lastName}`.trim(),
      ...(guest.additionalNames || []).map(
        (a) => `${a.firstName} ${a.lastName}`.trim(),
      ),
    ]
      .filter(Boolean)
      .join(" and "),
    "total invites": String(guest.invites),
    "invites": String(guest.invites),
    "adults": String((guest as any).adults ?? ""),
    "kids": String((guest as any).kids ?? ""),
    "phone": guest.phone,
    "language": (guest as any).language || "",
    "invitation sent": (guest as any).invitationSent || "",
    "rsvp link": "www.LeahAEspinoza.com",
    "link": "www.LeahAEspinoza.com",
    "response status": guest.response
      ? guest.response.attendees > 0
        ? "attending"
        : "not attending"
      : "pending",
    "attending count": String(guest.response?.attendees ?? 0),
    "declined count": String(guest.response?.declinedCount ?? 0),
  };
  return template.replace(/\{([^}]+)\}/g, (_m, key) => {
    const norm = String(key).trim().toLowerCase();
    return values[norm] ?? `{${key}}`;
  });
}

const FIELD_CHIPS = [
  "Name For Text",
  "First Name",
  "Name of Party",
  "Total Invites",
  "RSVP Link",
  "Adults",
  "Kids",
  "Language",
];

const DEFAULT_TEMPLATES: Record<string, string> = {
  pending:
    "Hi {Name For Text}, this is Leah's mom. Here's the RSVP link for your party of {Total Invites}: {RSVP Link}. Please log in with your phone number to let us know if you can make it. Thanks!",
  attending:
    "Hi {Name For Text}, thanks so much for confirming your party of {Total Invites}! Event details and updates at {RSVP Link}.",
  declined:
    "Hi {Name For Text}, sorry you can't make it. If plans change, update your RSVP at {RSVP Link}.",
  all:
    "Hi {Name For Text}, here's the RSVP link for your party of {Total Invites}: {RSVP Link}.",
};

function HitEmUpDialog({
  open,
  onOpenChange,
  recipients,
  filterLabel,
  onLogged,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  recipients: GuestWithResponse[];
  filterLabel: "pending" | "attending" | "declined" | "all";
  onLogged: () => void;
}) {
  const [template, setTemplate] = useState<string>(
    DEFAULT_TEMPLATES[filterLabel] || DEFAULT_TEMPLATES.all,
  );
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);

  // Reset draft when the filter changes (opening the dialog with a different
  // slice should show a sensible default).
  useEffect(() => {
    if (open) {
      setTemplate(DEFAULT_TEMPLATES[filterLabel] || DEFAULT_TEMPLATES.all);
      setIndex(0);
      setStarted(false);
      setSentIds(new Set());
    }
  }, [open, filterLabel]);

  // Split recipients into sendable (real phone) vs. skipped (no SMS phone).
  const sendable = useMemo(
    () => recipients.filter((r) => normalizeSmsPhone(r.phone)),
    [recipients],
  );
  const skippedNoPhone = recipients.length - sendable.length;
  const current = sendable[index];
  const done = started && index >= sendable.length;

  // After tapping Send + returning to Safari, auto-focus the Next button so
  // Jerry can tap-tap-tap through the list without hunting for it.
  useEffect(() => {
    if (started && !done && nextButtonRef.current) {
      nextButtonRef.current.focus();
    }
  }, [index, started, done]);

  function insertChip(field: string) {
    const ta = textareaRef.current;
    if (!ta) {
      setTemplate((t) => t + `{${field}}`);
      return;
    }
    const start = ta.selectionStart ?? template.length;
    const end = ta.selectionEnd ?? template.length;
    const next = template.slice(0, start) + `{${field}}` + template.slice(end);
    setTemplate(next);
    // Restore focus + caret after the inserted token.
    requestAnimationFrame(() => {
      ta.focus();
      const caret = start + field.length + 2;
      ta.setSelectionRange(caret, caret);
    });
  }

  async function sendCurrent() {
    if (!current) return;
    const phone = normalizeSmsPhone(current.phone);
    if (!phone) return; // Should never happen — sendable filter already excluded these
    const body = renderTemplate(template, current);
    // iOS Safari uses `?body=` as the separator for the first param, then `&`
    // for subsequent ones. Since we only have one param, `?` is correct.
    // (Non-iOS phones also accept both, but `?` is the standard URL-scheme form.)
    const url = `sms:${phone}?&body=${encodeURIComponent(body)}`;
    // Fire-and-forget log. Don't await — iMessage should open instantly.
    api("POST", "/api/admin/messages/log", {
      guestId: current.id,
      phone,
      body,
    }).catch(() => {
      /* logging failure shouldn't block Jerry from sending */
    });
    setSentIds((s) => new Set(s).add(current.id));
    // Open Messages. Safari on iOS handles sms: as a URL scheme.
    window.location.href = url;
  }

  function advance() {
    setIndex((i) => i + 1);
  }

  function startBatch() {
    setStarted(true);
    setIndex(0);
    // Send the first one immediately.
    setTimeout(() => sendCurrent(), 0);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Hit em up — {filterLabel}
          </DialogTitle>
          <DialogDescription>
            {recipients.length} household{recipients.length === 1 ? "" : "s"} in this filter ·{" "}
            {sendable.length} with a phone{skippedNoPhone > 0 && ` · ${skippedNoPhone} skipped (no SMS number)`}
          </DialogDescription>
        </DialogHeader>

        {!started ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="template" className="text-xs font-medium text-neutral-700">
                Your message
              </Label>
              <Textarea
                id="template"
                ref={textareaRef as any}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={5}
                className="mt-1 text-sm"
                data-testid="input-message-template"
              />
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-neutral-700">Insert field</div>
              <div className="flex flex-wrap gap-1.5">
                {FIELD_CHIPS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => insertChip(f)}
                    className="rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-xs text-neutral-700 hover:bg-neutral-100"
                    data-testid={`button-chip-${f.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    {`{${f}}`}
                  </button>
                ))}
              </div>
            </div>
            {sendable[0] && (
              <div className="rounded border border-neutral-200 bg-neutral-50 p-2.5">
                <div className="mb-1 text-[10px] uppercase tracking-wide text-neutral-500">
                  Preview for {sendable[0].nameForText || sendable[0].partyName || sendable[0].firstName}
                </div>
                <div className="whitespace-pre-wrap text-xs text-neutral-800">
                  {renderTemplate(template, sendable[0])}
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={startBatch}
                disabled={sendable.length === 0}
                data-testid="button-start-messaging"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Start messaging ({sendable.length})
              </Button>
            </DialogFooter>
          </div>
        ) : done ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-900">
              <Check className="h-4 w-4" />
              Done. Sent {sentIds.size} of {sendable.length}.
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onLogged();
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-600">
              <span>
                {index + 1} of {sendable.length} · {sentIds.size} messaged
              </span>
              <span className="font-mono">{current?.phone}</span>
            </div>
            <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
              <div className="mb-1 text-xs font-medium text-neutral-700">
                {current?.nameForText || current?.partyName || current?.firstName}
                {current && ((current as any).messageCount || sentIds.has(current.id)) && (
                  <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800">
                    already messaged
                  </span>
                )}
              </div>
              <div className="whitespace-pre-wrap text-xs text-neutral-800">
                {current ? renderTemplate(template, current) : ""}
              </div>
            </div>
            <DialogFooter className="gap-2 sm:flex-col sm:items-stretch">
              <div className="flex gap-2">
                <Button
                  ref={nextButtonRef}
                  className="flex-1"
                  onClick={() => {
                    sendCurrent();
                  }}
                  data-testid="button-send-current"
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Send to {current?.nameForText || current?.partyName || "this person"}
                </Button>
                <Button variant="outline" onClick={advance} data-testid="button-skip-current">
                  <SkipForward className="mr-1.5 h-3.5 w-3.5" />
                  Skip
                </Button>
              </div>
              <div className="flex justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onLogged();
                  }}
                >
                  Stop
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={advance}
                  disabled={!sentIds.has(current?.id || "")}
                  data-testid="button-next-recipient"
                >
                  Next →
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Format a Unix ms timestamp as a friendly relative label ("2h ago", "yesterday",
 *  "Jul 28"). Returns "—" when there's no timestamp yet. */
function formatRelative(ts: number | null | undefined): string {
  if (!ts) return "—";
  const now = Date.now();
  const diffSec = Math.round((now - ts) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86_400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172_800) return "yesterday";
  if (diffSec < 604_800) return `${Math.floor(diffSec / 86_400)}d ago`;
  const d = new Date(ts);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** Extract the comparable value for a given sort column. Numbers stay numeric
 *  so 10 sorts after 2. Text uses locale-aware comparison in the caller. */
function valueForSort(
  g: GuestWithResponse,
  key:
    | "name"
    | "contact"
    | "partySize"
    | "attending"
    | "declined"
    | "pending"
    | "note"
    | "lastActivity",
): string | number | null {
  const r = g.response;
  switch (key) {
    case "name":
      return `${g.lastName || ""} ${g.firstName || ""} ${g.partyName || ""}`
        .trim()
        .toLowerCase();
    case "contact":
      // Sort by digits so (818) 336-8828 and 8183368828 sort together.
      return (g.phone || "").replace(/\D/g, "") || (g.email || "").toLowerCase() || null;
    case "partySize":
      return g.invites;
    case "attending":
      return r ? r.attendees : null;
    case "declined":
      return r ? r.declinedCount : null;
    case "pending":
      // Unresponded households have `invites` pending seats; responded = 0.
      return r ? 0 : g.invites;
    case "note":
      return (r?.note || "").toLowerCase() || null;
    case "lastActivity":
      return g.lastActivityAt ?? null;
  }
}

function Dashboard({ status, onLogout }: { status: Status; onLogout: () => void }) {
  const { toast } = useToast();
  const [guests, setGuests] = useState<GuestWithResponse[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [hitEmUpOpen, setHitEmUpOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "attending" | "declined" | "pending">(
    "all",
  );
  // Column sort. `sortBy=null` means the default sort (name).
  // Clicking a header cycles: null → asc → desc → null.
  type SortKey =
    | "name"
    | "contact"
    | "partySize"
    | "attending"
    | "declined"
    | "pending"
    | "note"
    | "lastActivity";
  const [sortBy, setSortBy] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const toggleSort = (key: SortKey) => {
    if (sortBy !== key) {
      setSortBy(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortBy(null);
      setSortDir("asc");
    }
  };
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

  // Household-level rows (status filter applied). Used for CSV and the
  // non-filtered view.
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
        g.partyName || "",
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

  // Apply the active column sort. When sortBy is null, fall back to the
  // storage-layer default (roughly last name, then first name).
  const sortedRows = useMemo(() => {
    if (!sortBy) return rows;
    const dir = sortDir === "asc" ? 1 : -1;
    const compare = (a: GuestWithResponse, b: GuestWithResponse): number => {
      const va = valueForSort(a, sortBy);
      const vb = valueForSort(b, sortBy);
      // Nullish values always sort to the bottom regardless of direction
      // — "no activity yet" or "no note" shouldn't jump to the top.
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * dir;
      }
      return String(va).localeCompare(String(vb), undefined, { sensitivity: "base" }) * dir;
    };
    return [...rows].sort(compare);
  }, [rows, sortBy, sortDir]);

  // When the admin is filtering by a name, expand household rows into one row
  // per matched person. Each display row keeps a reference back to its
  // household guest so Party Size / Attending / Declined / Note / Actions all
  // still work.
  type DisplayRow = {
    key: string;
    guest: (typeof guests)[number];
    // The person shown in this row's Name cell. Null = primary contact.
    matchedExtra: { firstName: string; lastName: string } | null;
  };
  const displayRows: DisplayRow[] = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    // No name filter → one row per household, unchanged behavior.
    if (!needle) {
      return sortedRows.map((g) => ({ key: g.id, guest: g, matchedExtra: null }));
    }

    // Numeric / phone / email searches: don't split into per-person rows.
    const digits = needle.replace(/\D/g, "");
    const isPhoneSearch = digits.length >= 3;
    const isEmailSearch = needle.includes("@");
    if (isPhoneSearch || isEmailSearch) {
      return sortedRows.map((g) => ({ key: g.id, guest: g, matchedExtra: null }));
    }

    // Name filter → emit one row per matched person in the household.
    const out: DisplayRow[] = [];
    for (const g of sortedRows) {
      const primaryLast = (g.lastName || "").trim();
      const primaryFullLower = `${g.firstName ?? ""} ${g.lastName ?? ""}`
        .trim()
        .toLowerCase();
      const partyHit = (g.partyName || "").toLowerCase().includes(needle);
      const primaryHit =
        partyHit ||
        (g.firstName || "").toLowerCase().includes(needle) ||
        (g.lastName || "").toLowerCase().includes(needle) ||
        primaryFullLower.includes(needle);
      // Match extras (empty last name inherits the primary's).
      const extraMatches = (g.additionalNames || [])
        .map((n, i) => {
          const first = (n.firstName || "").trim();
          const last = (n.lastName && n.lastName.trim()) || primaryLast;
          const full = `${first} ${last}`.trim().toLowerCase();
          const hit =
            first.toLowerCase().includes(needle) ||
            (last && last.toLowerCase().includes(needle)) ||
            full.includes(needle);
          return hit ? { i, n: { firstName: first, lastName: last } } : null;
        })
        .filter((x): x is { i: number; n: { firstName: string; lastName: string } } => !!x);

      if (primaryHit) {
        out.push({ key: `${g.id}:primary`, guest: g, matchedExtra: null });
      }
      for (const m of extraMatches) {
        out.push({ key: `${g.id}:extra-${m.i}`, guest: g, matchedExtra: m.n });
      }
      // If neither primary nor any extra matched by name, the household must
      // have qualified via note/phone/email/status text. Show it as a single row.
      if (!primaryHit && extraMatches.length === 0) {
        out.push({ key: `${g.id}:household`, guest: g, matchedExtra: null });
      }
    }
    return out;
  }, [sortedRows, filter]);

  async function saveGuest() {
    if (!draft) return;
    // Require either a first name OR a party label. Jerry often imports rows
    // where only the party name is known (e.g. "Marty & Jerry & Mama Luz") —
    // he'll fill individual names later.
    if (!draft.firstName.trim() && !draft.partyName.trim()) {
      toast({
        title: "Enter a first name or a party name.",
        variant: "destructive",
      });
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
      // Default the SMS greeting to First name when Jerry didn't customize it.
      // The Hit em up flow will fall back to partyName/firstName at render
      // time too — storing the value makes the CSV export round-trip cleanly.
      const nameForText = (draft.nameForText || "").trim() || draft.firstName.trim();
      if (draft.id) {
        await api("PATCH", `/api/admin/guests/${draft.id}`, {
          firstName: draft.firstName,
          lastName: draft.lastName,
          partyName: draft.partyName,
          nameForText,
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
          partyName: draft.partyName,
          nameForText,
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
      const res = await api<{
        added: number;
        updated: number;
        skipped: number;
        totals: { totalHouseholds: number; totalInvited: number };
      }>("POST", "/api/admin/guests/import", { csv: text });
      await load();
      // Include the resulting head count so Jerry can eyeball whether the
      // import matches the source spreadsheet without switching tabs.
      const totalsAfter = res.totals;
      const summary =
        `Added ${res.added}, updated ${res.updated}, skipped ${res.skipped}. · ` +
        `Now ${totalsAfter?.totalHouseholds ?? "?"} households, ${
          totalsAfter?.totalInvited ?? "?"
        } total invited.`;
      setImportResult(summary);
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
                <Button
                  size="sm"
                  className="bg-[hsl(346_37%_56%)] text-white hover:bg-[hsl(346_45%_45%)]"
                  onClick={() => setHitEmUpOpen(true)}
                  disabled={rows.length === 0}
                  data-testid="button-hit-em-up"
                >
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                  Hit em up ({rows.length})
                </Button>
                <Button size="sm" variant="outline" onClick={downloadCsv} data-testid="button-download-csv">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={async () => {
                    const confirm1 = window.prompt(
                      "This will delete ALL guests and RSVPs. Type DELETE to confirm.",
                    );
                    if (confirm1 !== "DELETE") return;
                    try {
                      const r = await api<{ deleted: number }>(
                        "POST",
                        "/api/admin/guests/reset",
                        { confirm: "DELETE_ALL_GUESTS" },
                      );
                      toast({ title: `Deleted ${r.deleted} guests.` });
                      await load();
                    } catch (err: any) {
                      toast({ title: err.message || "Reset failed", variant: "destructive" });
                    }
                  }}
                  data-testid="button-reset-guests"
                >
                  Delete all
                </Button>
              </div>

              <div
                className="border-b border-neutral-200 px-4 py-2 text-xs text-neutral-500"
                data-testid="text-csv-columns-note"
              >
                CSV columns (any subset):{" "}
                <code>Name of Party</code>, <code>Full names</code>,{" "}
                <code># of Adults</code>, <code># of Kids</code>,{" "}
                <code>Total Invites</code>, <code>Phone Numbers</code>,{" "}
                <code>firstName</code>, <code>lastName</code>, <code>email</code>. The importer
                splits “Full names” on commas, <code>&</code>, and <code>y</code>, and
                the party label is always searchable. Structured extras{" "}
                (<code>additional1_first</code>, <code>additional1_last</code>, … up to{" "}
                <code>additional9</code>) still take precedence when present.
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
                      {(
                        [
                          ["name", "Name"],
                          ["contact", "Contact"],
                          ["partySize", "Party size"],
                          ["attending", "Attending"],
                          ["declined", "Declined"],
                          ["pending", "Pending seats"],
                          ["note", "Note"],
                          ["lastActivity", "Last activity"],
                        ] as const
                      ).map(([key, label]) => {
                        const active = sortBy === key;
                        const Icon = active
                          ? sortDir === "asc"
                            ? ArrowUp
                            : ArrowDown
                          : ArrowUpDown;
                        return (
                          <th key={key} className="px-4 py-3 font-medium">
                            <button
                              type="button"
                              onClick={() => toggleSort(key)}
                              className={`inline-flex items-center gap-1 rounded transition hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(346_45%_55%)] ${
                                active ? "text-neutral-900" : ""
                              }`}
                              title={
                                active
                                  ? sortDir === "asc"
                                    ? `Sorted ${label.toLowerCase()} A→Z — click for Z→A`
                                    : `Sorted ${label.toLowerCase()} Z→A — click to clear`
                                  : `Sort by ${label.toLowerCase()}`
                              }
                              data-testid={`sort-${key}`}
                            >
                              <span>{label}</span>
                              <Icon
                                className={`h-3 w-3 ${
                                  active ? "text-[hsl(346_45%_45%)]" : "text-neutral-400"
                                }`}
                              />
                            </button>
                          </th>
                        );
                      })}
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
                    {!loading && displayRows.length === 0 && (
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
                    {displayRows.map((dr) => {
                      const g = dr.guest;
                      const r = g.response;
                      // primaryName is what we call this household. Prefer the
                      // "party name" label when it's set (matches Jerry's
                      // spreadsheet mental model), then fullName, then
                      // firstName+lastName. If none is set the row still needs a
                      // legible label — fall back to "(unnamed party)".
                      const primaryName =
                        (g.partyName && g.partyName.trim()) ||
                        g.fullName ||
                        `${g.firstName} ${g.lastName}`.trim() ||
                        "(unnamed party)";
                      // Row headline: the matched person (if any), else the primary contact.
                      const rowName = dr.matchedExtra
                        ? `${dr.matchedExtra.firstName}${
                            dr.matchedExtra.lastName ? " " + dr.matchedExtra.lastName : ""
                          }`.trim()
                        : primaryName;
                      // When party name and personal name differ, show the personal
                      // name (if any) underneath the party label on primary rows.
                      const showPersonalSubline =
                        !dr.matchedExtra &&
                        !!(g.partyName && g.partyName.trim()) &&
                        !!(g.firstName || g.lastName) &&
                        `${g.firstName} ${g.lastName}`.trim().toLowerCase() !==
                          g.partyName.trim().toLowerCase();
                      // Highlight the matched substring inside the row's headline name.
                      // Split into [before, match, after]; wrap match in a subtle pill.
                      const needle = filter.trim();
                      let namePrefix = rowName;
                      let nameMatch = "";
                      let nameSuffix = "";
                      if (needle) {
                        const idx = rowName.toLowerCase().indexOf(needle.toLowerCase());
                        if (idx >= 0) {
                          namePrefix = rowName.slice(0, idx);
                          nameMatch = rowName.slice(idx, idx + needle.length);
                          nameSuffix = rowName.slice(idx + needle.length);
                        }
                      }
                      // Shared "open household edit modal" handler used by the pencil
                      // button and the match badge.
                      const openEdit = () =>
                        setDraft({
                          id: g.id,
                          partyName: g.partyName || "",
                          nameForText: g.nameForText || "",
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
                        });
                      // Subline: for an extra-matched row, note the household party.
                      // For a primary row (when the household has extras), keep the
                      // classic "Also in party" listing.
                      return (
                        <tr
                          key={dr.key}
                          className="hover:bg-neutral-50"
                          data-testid={`row-guest-${dr.key}`}
                        >
                          <td className="px-4 py-3 font-medium text-neutral-900">
                            <div className="flex items-center gap-2">
                              <span>
                                {nameMatch ? (
                                  <>
                                    {namePrefix}
                                    <mark
                                      className="rounded bg-[hsl(48_92%_82%)] px-0.5 text-neutral-900"
                                      data-testid={`mark-name-${dr.key}`}
                                    >
                                      {nameMatch}
                                    </mark>
                                    {nameSuffix}
                                  </>
                                ) : (
                                  rowName
                                )}
                              </span>
                              {filter.trim() && dr.key.endsWith(":primary") && (
                                <button
                                  type="button"
                                  onClick={openEdit}
                                  title={`Edit ${primaryName}'s household`}
                                  className="inline-flex cursor-pointer items-center rounded-full bg-[hsl(346_60%_96%)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[hsl(346_45%_45%)] ring-1 ring-inset ring-[hsl(346_45%_85%)] transition hover:bg-[hsl(346_60%_92%)] hover:text-[hsl(346_45%_35%)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(346_45%_55%)]"
                                  data-testid={`badge-match-${dr.key}`}
                                >
                                  Match · primary
                                </button>
                              )}
                              {filter.trim() && dr.key.includes(":extra-") && (
                                <button
                                  type="button"
                                  onClick={openEdit}
                                  title={`Edit ${primaryName}'s household`}
                                  className="inline-flex cursor-pointer items-center rounded-full bg-[hsl(28_60%_95%)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[hsl(19_35%_35%)] ring-1 ring-inset ring-[hsl(28_31%_75%)] transition hover:bg-[hsl(28_60%_90%)] hover:text-[hsl(19_35%_25%)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(28_45%_55%)]"
                                  data-testid={`badge-match-${dr.key}`}
                                >
                                  Match · party member
                                </button>
                              )}
                            </div>
                            {dr.matchedExtra ? (
                              <button
                                type="button"
                                onClick={openEdit}
                                title={`Open ${primaryName}'s household`}
                                className="mt-0.5 block max-w-[240px] truncate text-left text-xs font-normal text-neutral-500 underline decoration-neutral-300 decoration-dotted underline-offset-2 transition hover:text-[hsl(346_45%_45%)] hover:decoration-[hsl(346_45%_55%)] focus:outline-none focus-visible:text-[hsl(346_45%_45%)]"
                                data-testid={`link-part-of-${dr.key}`}
                              >
                                Part of {primaryName}'s party
                              </button>
                            ) : (
                              <>
                                {showPersonalSubline && (
                                  <div
                                    className="mt-0.5 max-w-[240px] truncate text-xs font-normal text-neutral-500"
                                    data-testid={`text-personal-${g.id}`}
                                  >
                                    {`${g.firstName} ${g.lastName}`.trim()}
                                  </div>
                                )}
                                {g.additionalNames.length > 0 && (
                                  <div
                                    className="mt-0.5 max-w-[240px] truncate text-xs font-normal text-neutral-400"
                                    title={`Also in party: ${alsoInParty(g.additionalNames)}`}
                                    data-testid={`text-also-in-party-${g.id}`}
                                  >
                                    Also in party: {alsoInParty(g.additionalNames)}
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                          <td className="px-4 py-3 text-neutral-600">
                            <div>{g.phone || "—"}</div>
                            <div className="text-xs text-neutral-400">{g.email || ""}</div>
                            {(g.messageCount ?? 0) > 0 && (
                              <div
                                className="mt-1 inline-flex items-center gap-1 rounded-full bg-[hsl(346_37%_56%)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[hsl(346_45%_45%)]"
                                title={
                                  g.lastMessagedAt
                                    ? `Last messaged ${new Date(g.lastMessagedAt).toLocaleString()}`
                                    : undefined
                                }
                              >
                                <MessageSquare className="h-2.5 w-2.5" />
                                {g.messageCount} sent
                              </div>
                            )}
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
                          <td
                            className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500"
                            title={
                              g.lastActivityAt
                                ? new Date(g.lastActivityAt).toLocaleString()
                                : "No activity yet"
                            }
                          >
                            {formatRelative(g.lastActivityAt ?? null)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={openEdit}
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
              <Field label="Party name (searchable, e.g. “Concho & Maria”)">
                <Input
                  value={draft.partyName}
                  onChange={(e) => setDraft({ ...draft, partyName: e.target.value })}
                  placeholder="How you refer to this household"
                  data-testid="input-guest-party-name"
                />
              </Field>
              <Field
                label="Name for text (used in Hit em up messages)"
                hint={
                  draft.nameForText.trim()
                    ? undefined
                    : `Blank → defaults to First name (“${draft.firstName || "—"}”)`
                }
              >
                <Input
                  value={draft.nameForText}
                  onChange={(e) => setDraft({ ...draft, nameForText: e.target.value })}
                  placeholder={draft.firstName || "e.g. Concho & Maria, or just Alfredo"}
                  data-testid="input-guest-name-for-text"
                />
              </Field>
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

      <HitEmUpDialog
        open={hitEmUpOpen}
        onOpenChange={setHitEmUpOpen}
        recipients={rows}
        filterLabel={statusFilter}
        onLogged={() => load()}
      />
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

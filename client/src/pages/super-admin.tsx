import { useEffect, useState } from "react";
import { api, setAuthToken } from "@/lib/api";

type Row = {
  id: string;
  slug: string;
  honoree: string;
  title: string;
  template: string;
  package: string;
  paid: boolean;
  status: string;
  amountCents: number;
  customDomain: boolean;
  desiredDomain: string;
  hostnames: string;
  customNotes: string;
  createdAt: number;
  isLegacyRoot: boolean;
  isDemo?: boolean;
  hostEmail: string;
  households: number;
  invited: number;
};

export default function SuperAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [totals, setTotals] = useState({ events: 0, revenueCents: 0, invited: 0 });
  const [error, setError] = useState<string | null>(null);
  const [hostEdit, setHostEdit] = useState<Record<string, string>>({});

  function applyList(data: { events: Row[]; totals?: { events: number; revenueCents: number; invited: number } }) {
    setRows(data.events);
    if (data.totals) setTotals(data.totals);
    const edits: Record<string, string> = {};
    for (const row of data.events) edits[row.id] = row.hostnames;
    setHostEdit(edits);
  }

  async function load() {
    applyList(await api("GET", "/api/super/events"));
  }

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("rsvp_super_token");
      if (saved) setAuthToken(saved);
    } catch {
      /* ignore */
    }
    api("GET", "/api/super/events")
      .then((data: { events: Row[]; totals?: { events: number; revenueCents: number; invited: number } }) => {
        applyList(data);
        setAuthed(true);
      })
      .catch(() => {
        /* login form */
      });
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api<{ token: string }>("POST", "/api/super/login", { email, password });
      setAuthToken(res.token);
      try {
        sessionStorage.setItem("rsvp_super_token", res.token);
      } catch {
        /* ignore */
      }
      setAuthed(true);
      await load();
    } catch (err: any) {
      setError(err?.message || "Sign-in failed.");
    }
  }

  async function saveHost(id: string) {
    await api("PATCH", `/api/super/events/${id}`, { hostnames: hostEdit[id] || "" });
    await load();
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4" data-testid="page-super-login">
        <form onSubmit={login} className="w-full max-w-sm rounded-xl border bg-white p-6">
          <h1 className="text-lg font-semibold">Studio</h1>
          <p className="mt-1 text-sm text-neutral-500">Events, payments, and domain requests.</p>
          <label className="mt-4 block text-sm">
            Email
            <input className="mt-1 w-full rounded-md border px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-super-email" />
          </label>
          <label className="mt-3 block text-sm">
            Password
            <input className="mt-1 w-full rounded-md border px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="input-super-password" />
          </label>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button className="mt-4 w-full rounded-md bg-neutral-900 py-2 text-sm text-white" type="submit" data-testid="button-super-login">
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-6" data-testid="page-super">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-xl font-semibold">Events</h1>
        <p className="text-sm text-neutral-500" data-testid="text-super-totals">
          {totals.events} events · ${(totals.revenueCents / 100).toFixed(0)} collected · {totals.invited} invited.
          Sample sites are excluded from these totals.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-[880px] w-full text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-3">Event</th>
                <th className="px-3 py-3">Host</th>
                <th className="px-3 py-3">Package</th>
                <th className="px-3 py-3">Paid</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Domain</th>
                <th className="px-3 py-3">Guests</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b align-top" data-testid={`row-event-${row.slug}`}>
                  <td className="px-3 py-3">
                    <div className="font-medium">{row.honoree || row.slug}</div>
                    <a className="text-xs text-neutral-500 underline" href={`/e/${row.slug}`}>
                      /e/{row.slug}
                    </a>
                    {row.isLegacyRoot && <div className="text-xs text-neutral-400">Original site</div>}
                    {row.isDemo && <div className="text-xs text-neutral-400">Sample</div>}
                  </td>
                  <td className="px-3 py-3 text-xs">{row.hostEmail || "—"}</td>
                  <td className="px-3 py-3">
                    <div>{row.package === "full_custom" ? "Full custom" : "Basic"}</div>
                    <div className="text-xs text-neutral-500">{row.isDemo ? "Sample" : `$${(row.amountCents / 100).toFixed(0)}`} · {row.template}</div>
                  </td>
                  <td className="px-3 py-3">{row.isDemo ? "Sample" : row.paid ? "Paid" : "Unpaid"}</td>
                  <td className="px-3 py-3">{row.status}</td>
                  <td className="px-3 py-3">
                    {row.customDomain && (
                      <div className="text-xs font-medium text-amber-800">Requested: {row.desiredDomain || "—"}</div>
                    )}
                    {row.customNotes && <p className="mt-1 max-w-[220px] text-xs text-neutral-600">{row.customNotes}</p>}
                    <div className="mt-2 flex gap-1">
                      <input
                        className="w-40 rounded border px-2 py-1 text-xs"
                        value={hostEdit[row.id] ?? ""}
                        onChange={(e) => setHostEdit((h) => ({ ...h, [row.id]: e.target.value }))}
                        placeholder="live hostname"
                        data-testid={`input-hostname-${row.slug}`}
                      />
                      <button type="button" className="rounded border px-2 text-xs" onClick={() => saveHost(row.id)}>
                        Save
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {row.households} households
                    <div>{row.invited} invited</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

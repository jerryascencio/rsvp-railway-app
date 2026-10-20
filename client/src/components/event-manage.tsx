import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PublicEvent } from "@shared/platform";

/** Extra controls for a self-serve event: publish, details, photos. */
export default function EventManage({
  paid,
  status,
  onChanged,
}: {
  paid: boolean;
  status: string;
  onChanged: () => void;
}) {
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [publicUrl, setPublicUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await api<{ event: PublicEvent; publicUrl: string }>("GET", "/api/admin/event");
    setEvent(data.event);
    setPublicUrl(data.publicUrl);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function publish() {
    setBusy(true);
    setMessage(null);
    try {
      if (!paid) {
        const checkout = await api<{ checkoutUrl?: string; paid?: boolean }>("POST", "/api/billing/checkout", {});
        if (checkout.checkoutUrl) {
          window.location.href = checkout.checkoutUrl;
          return;
        }
      }
      await api("POST", status === "active" ? "/api/admin/unpublish" : "/api/admin/publish");
      setMessage(status === "active" ? "Unpublished. Guests see a holding page." : "Published.");
      onChanged();
      await load();
    } catch (err: any) {
      setMessage(err?.message || "Could not update publishing.");
    } finally {
      setBusy(false);
    }
  }

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;
    setBusy(true);
    try {
      await api("PATCH", "/api/admin/event", {
        honoree: event.honoree,
        partnerName: event.partnerName,
        familyLine: event.familyLine,
        dateIso: event.dateIso,
        ceremonyTime: event.ceremonyTime,
        ceremonyVenue: event.ceremonyVenue,
        ceremonyAddress: event.ceremonyAddress,
        receptionTime: event.receptionTime,
        receptionVenue: event.receptionVenue,
        receptionAddress: event.receptionAddress,
        dressCode: event.dressCode,
        dressCodeEs: event.dressCodeEs,
        giftText: event.giftText,
        aboutText: event.aboutText,
        photoUploadUrl: event.photoUploadUrl,
        template: event.template,
      });
      setMessage("Invitation details saved.");
    } catch (err: any) {
      setMessage(err?.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onPhoto(file: File) {
    const dataBase64 = await fileToBase64(file);
    const data = await api<{ event: PublicEvent }>("POST", "/api/admin/photos", {
      filename: file.name,
      dataBase64,
    });
    setEvent(data.event);
  }

  if (!event) return null;

  return (
    <div className="mt-6 max-w-xl space-y-5 rounded-xl border border-neutral-200 bg-white p-6" data-testid="panel-event-manage">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">Invitation</h2>
        <p className="mt-1 text-xs text-neutral-500">
          {paid ? "Paid" : "Not paid yet"} · {status === "active" ? "Published" : "Draft"} · {publicUrl}
        </p>
      </div>
      <Button type="button" onClick={publish} disabled={busy} data-testid="button-publish">
        {!paid ? "Continue to payment" : status === "active" ? "Unpublish" : "Publish"}
      </Button>
      {message && <p className="text-sm text-neutral-600">{message}</p>}
      <form onSubmit={saveDetails} className="space-y-3">
        <Field label="Honoree" value={event.honoree} onChange={(v) => setEvent({ ...event, honoree: v })} />
        <Field label="Partner" value={event.partnerName} onChange={(v) => setEvent({ ...event, partnerName: v })} />
        <Field label="Family line" value={event.familyLine} onChange={(v) => setEvent({ ...event, familyLine: v })} />
        <label className="block text-sm">
          Template
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={event.template}
            onChange={(e) => setEvent({ ...event, template: e.target.value as PublicEvent["template"] })}
          >
            <option value="quince">Quinceañera / floral</option>
            <option value="wedding">Wedding / elegant</option>
          </select>
        </label>
        <Field label="Date" type="date" value={event.dateIso} onChange={(v) => setEvent({ ...event, dateIso: v })} />
        <Field label="Ceremony time" value={event.ceremonyTime} onChange={(v) => setEvent({ ...event, ceremonyTime: v })} />
        <Field label="Ceremony venue" value={event.ceremonyVenue} onChange={(v) => setEvent({ ...event, ceremonyVenue: v })} />
        <Field label="Ceremony address" value={event.ceremonyAddress} onChange={(v) => setEvent({ ...event, ceremonyAddress: v })} />
        <Field label="Reception time" value={event.receptionTime} onChange={(v) => setEvent({ ...event, receptionTime: v })} />
        <Field label="Reception venue" value={event.receptionVenue} onChange={(v) => setEvent({ ...event, receptionVenue: v })} />
        <Field label="Reception address" value={event.receptionAddress} onChange={(v) => setEvent({ ...event, receptionAddress: v })} />
        <Field label="Dress code" value={event.dressCode} onChange={(v) => setEvent({ ...event, dressCode: v })} />
        <Field label="Dress code (Spanish)" value={event.dressCodeEs} onChange={(v) => setEvent({ ...event, dressCodeEs: v })} />
        <Field label="About" value={event.aboutText} onChange={(v) => setEvent({ ...event, aboutText: v })} />
        <Field label="Gifts" value={event.giftText} onChange={(v) => setEvent({ ...event, giftText: v })} />
        <Field label="Photo upload link" value={event.photoUploadUrl} onChange={(v) => setEvent({ ...event, photoUploadUrl: v })} />
        <Button type="submit" variant="outline" disabled={busy} data-testid="button-save-event">
          Save invitation details
        </Button>
      </form>
      <div>
        <h3 className="text-sm font-semibold">Photos</h3>
        <p className="mt-1 text-xs text-neutral-500">Up to 12, 2MB each.</p>
        <input
          className="mt-2 block text-sm"
          type="file"
          accept="image/*"
          data-testid="input-photo"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPhoto(file).catch((err) => setMessage(err?.message || "Upload failed."));
          }}
        />
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {event.photos.map((p) => (
            <li key={p.id}>
              <img src={p.url} alt="" className="aspect-square w-full rounded object-cover" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      <Input className="mt-1" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

import React, { useState } from "react";
import ZimbabweMap from "./zimbabwe-map";

export default function VerificationForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [farmName, setFarmName] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [idImageUrl, setIdImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        fullName,
        idNumber,
        phone,
        address,
        farmName,
        coordinates: coords ? `${coords.lat},${coords.lng}` : undefined,
        idImageUrl: idImageUrl || undefined,
      };

      const res = await fetch("/api/profile/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Failed to submit verification");
      }

      onSubmitted?.();
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <label className="text-sm font-medium">Full name</label>
        <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>

      <div>
        <label className="text-sm font-medium">ID number (optional)</label>
        <input className="input" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
      </div>

      <div>
        <label className="text-sm font-medium">Phone (optional)</label>
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <div>
        <label className="text-sm font-medium">Farm / Business name (optional)</label>
        <input className="input" value={farmName} onChange={(e) => setFarmName(e.target.value)} />
      </div>

      <div>
        <label className="text-sm font-medium">Address (optional)</label>
        <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>

      <div>
        <label className="text-sm font-medium">Pick location (click on the map)</label>
        <ZimbabweMap value={coords ?? null} onChange={setCoords} height="240px" />
        {coords && <div className="text-xs text-muted-foreground mt-2">Selected: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</div>}
      </div>

      <div>
        <label className="text-sm font-medium">ID Image URL (optional)</label>
        <input className="input" value={idImageUrl} onChange={(e) => setIdImageUrl(e.target.value)} placeholder="Upload elsewhere and paste URL" />
        <p className="text-xs text-muted-foreground">Tip: upload to an image host and paste the URL. In a later pass I can add in-app uploads.</p>
      </div>

      {error && <div className="text-destructive text-sm">{error}</div>}

      <div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Submitting…" : "Submit verification request"}
        </button>
      </div>
    </form>
  );
}
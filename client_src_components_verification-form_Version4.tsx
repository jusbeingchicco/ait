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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("idImage", file);
      const res = await fetch("/api/uploads/id-image", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Upload failed");
      }
      const json = await res.json();
      if (json?.url) {
        setIdImageUrl(json.url);
      } else {
        throw new Error("Upload did not return a URL");
      }
    } catch (err: any) {
      setUploadError(err.message || String(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    // Basic client-side checks
    if (f.size > 5 * 1024 * 1024) {
      setUploadError("File is too large (max 5MB)");
      return;
    }
    await uploadFile(f);
  }

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
        <label className="text-sm font-medium">ID Image (upload)</label>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {uploading && <div className="text-xs text-muted-foreground">Uploading…</div>}
        {uploadError && <div className="text-destructive text-xs">{uploadError}</div>}
        {idImageUrl && (
          <div className="mt-2">
            <img src={idImageUrl} alt="ID preview" className="w-40 h-auto rounded-md border" />
            <div className="text-xs text-muted-foreground mt-1">Uploaded file will be used for verification.</div>
          </div>
        )}
      </div>

      {error && <div className="text-destructive text-sm">{error}</div>}

      <div>
        <button type="submit" className="btn btn-primary" disabled={loading || uploading}>
          {loading ? "Submitting…" : "Submit verification request"}
        </button>
      </div>
    </form>
  );
}
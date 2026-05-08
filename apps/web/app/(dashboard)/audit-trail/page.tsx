"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { createApiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuditTrail } from "@/hooks/useAuditTrail";

export default function AuditTrailPage() {
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient({ getToken }), [getToken]);
  const { entries, fetchLedger } = useAuditTrail();
  const [businessId, setBusinessId] = useState("11111111-1111-1111-1111-111111111001");
  const [verify, setVerify] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchLedger({ page: 1, pageSize: 50 });
  }, [fetchLedger]);

  const exportPacket = async () => {
    const data = await api.get<any>(`/audit/export/${businessId}`);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-packet-${businessId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sha256Hex = async (input: string) => {
    const enc = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const runVerify = async (entry: any) => {
    if (!entry?.agent_did || !entry?.timestamp || !entry?.action_payload || !entry?.action_hash) {
      setVerify((v) => ({ ...v, [entry.id]: "insufficient data to verify" }));
      return;
    }
    const payload = JSON.stringify(entry.action_payload ?? {}, Object.keys(entry.action_payload ?? {}).sort(), 0);
    const raw = `${entry.agent_did}${entry.timestamp}${payload}`;
    const computed = await sha256Hex(raw);
    setVerify((v) => ({
      ...v,
      [entry.id]: computed === entry.action_hash ? "✓ hash verified" : "✗ hash mismatch",
    }));
  };

  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-white/5 p-4">
        <div className="text-lg font-semibold">Cryptographic Agent Action Ledger (CAAL)</div>
        <div className="mt-1 text-sm text-white/60">Immutable audit trail of autonomous + HITL decisions.</div>
      </Card>

      <Card className="border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2">
          <Input className="max-w-md bg-black/40 border-white/10" value={businessId} onChange={(e) => setBusinessId(e.target.value)} />
          <Button className="bg-[#3b82f6] hover:bg-[#3b82f6]/90" onClick={exportPacket}>
            Export Audit Packet
          </Button>
        </div>
      </Card>

      <Card className="border-white/10 bg-white/5 p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-mono text-white/60">
              <tr>
                <th className="py-2">Timestamp</th>
                <th>Agent DID</th>
                <th>Action Type</th>
                <th>Business</th>
                <th>Confidence</th>
                <th>Rail</th>
                <th>Hash</th>
                <th>Verify</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e: any) => (
                <tr key={e.id} className="border-t border-white/10">
                  <td className="py-2 font-mono text-xs">{e.timestamp}</td>
                  <td className="font-mono text-xs">{e.agent_did}</td>
                  <td>{e.action_type}</td>
                  <td className="font-mono text-xs">{e.business_id}</td>
                  <td>{e.confidence_score}</td>
                  <td>{String(e.rail_agreement)}</td>
                  <td className="font-mono text-xs">{e.action_hash?.slice(0, 16)}…</td>
                  <td>
                    <Button size="sm" variant="secondary" onClick={() => runVerify(e)}>
                      Verify
                    </Button>
                    <span className="ml-2 text-xs text-white/60">{verify[e.id]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}


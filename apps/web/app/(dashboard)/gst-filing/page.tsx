"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { createApiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfidenceScore } from "@/components/compliance/ConfidenceScore";
import { DualRailBadge } from "@/components/compliance/DualRailBadge";

type Business = { id: string; name: string; gst_registered?: boolean };

export default function GSTFilingPage() {
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient({ getToken }), [getToken]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [status, setStatus] = useState<any>(null);
  const [exportJson, setExportJson] = useState<string>("");

  useEffect(() => {
    api.get<Business[]>("/admin/users").then((rows) => {
      const gst = rows.filter((b: any) => b.gst_registered);
      setBusinesses(gst);
      if (gst[0]) setSelected(gst[0].id);
    });
  }, [api]);

  useEffect(() => {
    if (!selected) return;
    api.post(`/gst/filing-status/${selected}/compute`).then(setStatus);
  }, [api, selected]);

  const doExport = async () => {
    if (!selected) return;
    const data = await api.get<any>(`/gst/export/${selected}`);
    setExportJson(JSON.stringify(data, null, 2));
  };

  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-white/5 p-4 flex items-center gap-3">
        <label className="text-sm text-white/70">Business</label>
        <select
          className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold">Filing Readiness Score</div>
          <div className="mt-4">
            <ConfidenceScore score={Number(status?.readiness_score ?? 0) / 100} size="lg" />
          </div>
        </Card>
        <Card className="border-white/10 bg-white/5 p-4 lg:col-span-2">
          <div className="text-sm font-semibold">Filing Summary</div>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-sm">
            <div>Liability: ₹{status?.total_gst_liability ?? "—"}</div>
            <div>ITC: ₹{status?.input_tax_credit ?? "—"}</div>
            <div>Net: ₹{status?.net_payable ?? "—"}</div>
            <div>Period: {status?.period ?? "—"}</div>
          </div>
          <div className="mt-4">
            <DualRailBadge railAgreement={true} confidence={0.96} hitlRequired={false} />
          </div>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Export</div>
          <Button className="bg-[#3b82f6] hover:bg-[#3b82f6]/90" onClick={doExport}>
            Generate Filing-Ready JSON
          </Button>
        </div>
        {exportJson && <pre className="mt-3 text-xs font-mono overflow-auto bg-black/30 p-3 rounded">{exportJson}</pre>}
      </Card>
    </div>
  );
}


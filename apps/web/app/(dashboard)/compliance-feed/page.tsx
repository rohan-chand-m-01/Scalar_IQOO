"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { createApiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/useWebSocket";
import { RetriggerBanner } from "@/components/compliance/RetriggerBanner";

type DeltaRow = {
  id: string;
  portal_name: string;
  detected_at: string;
  changed_regulation_ids: string[];
  affected_business_count: number;
  processed: boolean;
  delta_summary?: any;
};

export default function ComplianceFeedPage() {
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient({ getToken }), [getToken]);
  const ws = useWebSocket({ url: "ws://localhost:8000/ws/retrigger" });

  const [deltas, setDeltas] = useState<DeltaRow[]>([]);
  const [open, setOpen] = useState(false);
  const [portal, setPortal] = useState("gstn");
  const [regulationId, setRegulationId] = useState("GST_LATE_FEE_001");
  const [field, setField] = useState("value");
  const [newValue, setNewValue] = useState("250");

  const load = async () => {
    // fallback: use /admin/stats only if deltas not available yet in API
    try {
      const rows = await api.get<DeltaRow[]>("/admin/deltas");
      setDeltas(rows ?? []);
    } catch {
      setDeltas([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ws.lastEvent?.event === "regulation_change") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.lastEvent]);

  const triggerChange = async () => {
    const payload: any = {
      portal,
      regulation_id: regulationId,
      field,
      new_value: field === "value" ? Number(newValue) : newValue,
    };
    await api.post("/admin/demo/trigger-change", payload);
    setOpen(false);
  };

  const bannerEvent =
    ws.lastEvent?.event === "regulation_change"
      ? ({
          portal: ws.lastEvent.portal as any,
          affected_count: ws.lastEvent.affected_count as any,
          message: ws.lastEvent.message as any,
          delta_id: ws.lastEvent.delta_id as any,
        } as any)
      : null;

  return (
    <div className="space-y-4">
      <RetriggerBanner event={bannerEvent} />

      <Card className="border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Regulation Watcher Status</div>
            <div className="mt-1 text-xs font-mono text-white/60">IRDA live monitoring demo</div>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#3b82f6] hover:bg-[#3b82f6]/90">Trigger Manual Check</Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0f1117] text-white border-white/10">
              <DialogHeader>
                <DialogTitle>Trigger Regulation Change (Demo)</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input value={portal} onChange={(e) => setPortal(e.target.value)} placeholder="portal (gstn/epfo/fssai/pt_states)" />
                <Input value={regulationId} onChange={(e) => setRegulationId(e.target.value)} placeholder="regulation id" />
                <Input value={field} onChange={(e) => setField(e.target.value)} placeholder="field (value/title/...)" />
                <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="new value" />
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={triggerChange} className="bg-[#3b82f6] hover:bg-[#3b82f6]/90">
                  Push Change
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      <Card className="border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold">Delta History</div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-mono text-white/60">
              <tr>
                <th className="py-2">Portal</th>
                <th>Detected</th>
                <th>Changed regs</th>
                <th>Affected</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {deltas.map((d) => (
                <tr key={d.id} className="border-t border-white/10">
                  <td className="py-3 font-mono">{d.portal_name}</td>
                  <td className="font-mono text-xs text-white/60">{d.detected_at}</td>
                  <td className="font-mono text-xs">{(d.changed_regulation_ids ?? []).join(", ")}</td>
                  <td className="font-mono">{d.affected_business_count}</td>
                  <td>
                    <Badge className={d.processed ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-200" : "bg-amber-500/20 border-amber-500/30 text-amber-200"}>
                      {d.processed ? "processed" : "pending"}
                    </Badge>
                  </td>
                </tr>
              ))}
              {deltas.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-sm text-white/60">
                    No deltas yet (run IRDA or use the demo trigger).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}


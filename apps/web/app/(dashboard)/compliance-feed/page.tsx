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
  affected_businesses?: Array<{ id: string; name: string | null }>;
  skipped_businesses?: Array<{ id: string; name: string | null }>;
};

export default function ComplianceFeedPage() {
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient({ getToken }), [getToken]);
  const ws = useWebSocket({ url: "ws://localhost:8000/ws/retrigger" });

  const [deltas, setDeltas] = useState<DeltaRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [portal, setPortal] = useState<"gstn" | "epfo" | "fssai" | "pt-states">("gstn");
  const [regulationId, setRegulationId] = useState<string>("GST_LATE_FEE_001");
  const [field, setField] = useState<"value" | "title" | "description">("value");
  const [newValue, setNewValue] = useState<string>("250");
  const [portalStatuses, setPortalStatuses] = useState<any[]>([]);
  const [portalRegs, setPortalRegs] = useState<any[]>([]);

  const load = async () => {
    // fallback: use /admin/stats only if deltas not available yet in API
    try {
      const rows = await api.get<any>("/admin/deltas");
      setDeltas(rows ?? []);
    } catch {
      setDeltas([]);
    }
  };

  const loadStatuses = async () => {
    try {
      const rows = await api.get<any[]>("/admin/portal-status");
      setPortalStatuses(rows ?? []);
    } catch {
      setPortalStatuses([]);
    }
  };

  const loadPortalRegs = async (p: string) => {
    try {
      const data = await api.get<any>(`/admin/portal/${p}`);
      const regs = data?.regulations ?? [];
      setPortalRegs(regs);
      if (regs[0]?.id) setRegulationId(regs[0].id);
    } catch {
      setPortalRegs([]);
    }
  };

  useEffect(() => {
    load();
    loadStatuses();
    loadPortalRegs(portal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadPortalRegs(portal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portal]);

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {(portalStatuses ?? []).map((p) => (
          <Card key={p.portal} className="border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold">{p.portal}</div>
            <div className="mt-2 text-xs font-mono text-white/60">last checked: {p.last_checked ?? "—"}</div>
            <div className="mt-1 text-xs font-mono text-white/60">
              last hash: {p.last_hash ? String(p.last_hash).slice(0, 14) + "…" : "—"}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className={p.change_detected ? "h-2 w-2 rounded-full bg-emerald-400" : "h-2 w-2 rounded-full bg-white/20"} />
              <span className="text-xs font-mono text-white/70">
                {p.change_detected ? "change detected" : "no change"}
              </span>
            </div>
            <div className="mt-2 text-xs font-mono text-white/70">monitoring: {p.regulations_monitored ?? 0}</div>
          </Card>
        ))}
      </div>

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
                <label className="block text-xs font-mono text-white/60">Portal</label>
                <select
                  className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                  value={portal}
                  onChange={(e) => setPortal(e.target.value as any)}
                >
                  <option value="gstn">gstn</option>
                  <option value="epfo">epfo</option>
                  <option value="fssai">fssai</option>
                  <option value="pt-states">pt-states</option>
                </select>

                <label className="block text-xs font-mono text-white/60">Regulation</label>
                <select
                  className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                  value={regulationId}
                  onChange={(e) => setRegulationId(e.target.value)}
                >
                  {(portalRegs ?? []).map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.id} — {r.title}
                    </option>
                  ))}
                </select>

                <label className="block text-xs font-mono text-white/60">Field</label>
                <select
                  className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                  value={field}
                  onChange={(e) => setField(e.target.value as any)}
                >
                  <option value="value">value</option>
                  <option value="title">title</option>
                  <option value="description">description</option>
                </select>

                <label className="block text-xs font-mono text-white/60">New Value</label>
                <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="e.g. 250 or updated title..." />
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
                <>
                  <tr key={d.id} className="border-t border-white/10">
                    <td className="py-3 font-mono">{d.portal_name}</td>
                    <td className="font-mono text-xs text-white/60">{d.detected_at}</td>
                    <td className="font-mono text-xs">{(d.changed_regulation_ids ?? []).join(", ")}</td>
                    <td className="font-mono">{d.affected_business_count}</td>
                    <td className="min-w-[160px]">
                      <div className="flex items-center gap-3">
                        <Badge
                          className={
                            d.processed
                              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-200"
                              : "bg-amber-500/20 border-amber-500/30 text-amber-200"
                          }
                        >
                          {d.processed ? "processed" : "pending"}
                        </Badge>
                        <button
                          className="text-xs text-[#3b82f6] hover:underline font-mono"
                          onClick={() => setExpandedId((prev) => (prev === d.id ? null : d.id))}
                        >
                          {expandedId === d.id ? "Hide" : "Details"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === d.id && (
                    <tr>
                      <td colSpan={5} className="py-3">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="rounded-md border border-white/10 bg-black/20 p-3">
                            <div className="text-sm font-semibold">Before / After</div>
                            <div className="mt-2 space-y-2">
                              {(d.delta_summary?.changes ?? []).length === 0 ? (
                                <div className="text-sm text-white/60">No field-level changes stored for this delta.</div>
                              ) : (
                                (d.delta_summary?.changes ?? []).map((c: any, idx: number) => (
                                  <div key={idx} className="text-xs font-mono text-white/70">
                                    {c.field_changed}: {String(c.old_value)} →{" "}
                                    <span className="text-white/90">{String(c.new_value)}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="rounded-md border border-white/10 bg-black/20 p-3">
                            <div className="text-sm font-semibold">Affected Business Retrigger Log</div>
                            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                              <div>
                                <div className="text-xs font-mono text-emerald-200">Re-triggered (affected)</div>
                                <div className="mt-2 space-y-1">
                                  {(d.affected_businesses ?? []).length === 0 ? (
                                    <div className="text-xs text-white/60">—</div>
                                  ) : (
                                    (d.affected_businesses ?? []).map((b) => (
                                      <div key={b.id} className="text-xs font-mono text-white/80">
                                        {b.name ?? b.id}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-mono text-amber-200">Skipped (not affected)</div>
                                <div className="mt-2 space-y-1">
                                  {(d.skipped_businesses ?? []).length === 0 ? (
                                    <div className="text-xs text-white/60">—</div>
                                  ) : (
                                    (d.skipped_businesses ?? []).slice(0, 20).map((b) => (
                                      <div key={b.id} className="text-xs font-mono text-white/80">
                                        {b.name ?? b.id}
                                      </div>
                                    ))
                                  )}
                                  {(d.skipped_businesses ?? []).length > 20 && (
                                    <div className="text-xs text-white/60">+ {(d.skipped_businesses ?? []).length - 20} more</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
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


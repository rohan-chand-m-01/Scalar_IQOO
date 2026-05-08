"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { createApiClient } from "@/lib/api-client";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuditTrail } from "@/hooks/useAuditTrail";
import { useComplianceAlerts } from "@/hooks/useComplianceAlerts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ConfidenceScore } from "@/components/compliance/ConfidenceScore";

type BusinessRow = {
  id: string;
  name: string;
  business_type?: string;
  state?: string;
  gst_registered?: boolean;
  pf_registered?: boolean;
  fssai_registered?: boolean;
  pt_state?: string | null;
  total?: number;
  pending?: number;
  overdue?: number;
  compliant?: number;
  health_score?: number;
  last_updated?: string;
};

function kpiCard(title: string, value: React.ReactNode, sub?: React.ReactNode) {
  return (
    <Card className="border-white/10 bg-white/5 p-4">
      <div className="text-xs font-mono text-white/60">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {sub ? <div className="mt-2 text-sm text-white/60">{sub}</div> : null}
    </Card>
  );
}

export default function DashboardPage() {
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient({ getToken }), [getToken]);
  const ws = useWebSocket({ url: "ws://localhost:8000/ws/retrigger" });

  const [businesses, setBusinesses] = useState<BusinessRow[] | null>(null);
  const [stats, setStats] = useState<{ hitl_pending?: number; regulation_changes_24h?: number } | null>(null);

  const { entries, fetchLedger } = useAuditTrail();
  // demo: alerts bound to first business when available
  const firstBusinessId = businesses?.[0]?.id;
  const { alerts, unreadCount, refresh: refreshAlerts } = useComplianceAlerts(firstBusinessId, ws.lastEvent);

  const refresh = async () => {
    const [biz, st] = await Promise.all([api.get<BusinessRow[]>("/compliance/businesses"), api.get("/admin/stats")]);
    setBusinesses(biz);
    setStats(st);
    await fetchLedger({ page: 1, pageSize: 20 });
    await refreshAlerts();
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ws.lastEvent) return;
    if (ws.lastEvent.event === "regulation_change" || ws.lastEvent.event === "hitl_escalation") {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.lastEvent]);

  const overdueCount = (businesses ?? []).reduce((acc, b) => acc + (b.overdue ?? 0), 0);
  const pendingCount = (businesses ?? []).reduce((acc, b) => acc + (b.pending ?? 0), 0);
  const healthAvg =
    businesses && businesses.length > 0
      ? businesses.reduce((acc, b) => acc + (b.health_score ?? 100), 0) / businesses.length
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-mono text-white/60">REALTIME TICKER</div>
          <div className="mt-1 font-mono text-sm text-white/80">
            {ws.lastEvent ? JSON.stringify(ws.lastEvent) : "Waiting for WebSocket events…"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono text-white/60">UNREAD ALERTS</div>
          <div className="mt-1 text-2xl font-semibold">{unreadCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Card className="border-white/10 bg-white/5 p-4">
          <div className="text-xs font-mono text-white/60">Compliance Health Score</div>
          <div className="mt-3">
            <ConfidenceScore score={(healthAvg ?? 0) / 100} size="lg" />
          </div>
          <div className="mt-2 text-xs font-mono text-white/60">
            avg across {businesses?.length ?? 0} businesses
          </div>
        </Card>
        {kpiCard(
          "ACTIVE OBLIGATIONS",
          <span className="font-mono">{pendingCount + overdueCount}</span>,
          <span className="font-mono text-white/70">
            pending {pendingCount} • overdue {overdueCount}
          </span>
        )}
        {kpiCard(
          "HITL QUEUE",
          <span className="font-mono">{stats?.hitl_pending ?? 0}</span>,
          stats?.hitl_pending && stats.hitl_pending > 0 ? (
            <span className="text-amber-300">Requires Attention</span>
          ) : (
            "All clear"
          )
        )}
        {kpiCard(
          "REGULATION CHANGES (24H)",
          <span className="font-mono">{stats?.regulation_changes_24h ?? 0}</span>,
          "Detected via regulation_deltas"
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="border-white/10 bg-white/5 p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Live Compliance Feed</div>
            <div className="text-xs font-mono text-white/50">latest alerts</div>
          </div>
          <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto pr-2">
            {!businesses ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full bg-white/10" />
                <Skeleton className="h-10 w-full bg-white/10" />
                <Skeleton className="h-10 w-full bg-white/10" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-sm text-white/60">No alerts yet.</div>
            ) : (
              alerts.map((a) => (
                <div key={a.id} className="rounded-md border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{a.title ?? "Alert"}</div>
                    <Badge variant={a.is_read ? "secondary" : "default"}>
                      {a.is_read ? "read" : "unread"}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-white/70">{a.message}</div>
                  <div className="mt-2 text-xs font-mono text-white/50">{a.created_at}</div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Agent Activity Log (CAAL)</div>
            <div className="text-xs font-mono text-white/50">latest 20</div>
          </div>
          <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto pr-2 font-mono text-xs">
            {entries.length === 0 ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full bg-white/10" />
                <Skeleton className="h-8 w-full bg-white/10" />
                <Skeleton className="h-8 w-full bg-white/10" />
              </div>
            ) : (
              entries.map((e) => (
                <div key={e.id} className="rounded-md border border-white/10 bg-black/20 p-2">
                  <div className="text-white/60">{e.timestamp}</div>
                  <div className="text-white/80">
                    [{e.agent_name}] {e.action_type}{" "}
                    <span className="text-[#3b82f6]">{e.business_id ?? ""}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Business Compliance Table</div>
          <div className="text-xs font-mono text-white/50">18 demo businesses</div>
        </div>
        <div className="mt-3 overflow-x-auto">
          {!businesses ? (
            <Skeleton className="h-24 w-full bg-white/10" />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-white/60 font-mono text-xs">
                <tr>
                  <th className="py-2">Business</th>
                  <th>Type</th>
                  <th>State</th>
                  <th>GST</th>
                  <th>PF</th>
                  <th>FSSAI</th>
                  <th>PT</th>
                  <th>Obligations</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => {
                  const health = Math.round(b.health_score ?? 0);
                  return (
                    <tr key={b.id} className="border-t border-white/10">
                      <td className="py-3 font-semibold">{b.name}</td>
                      <td className="text-white/70">{b.business_type}</td>
                      <td className="text-white/70">{b.state}</td>
                      <td>{b.gst_registered ? "✓" : "—"}</td>
                      <td>{b.pf_registered ? "✓" : "—"}</td>
                      <td>{b.fssai_registered ? "✓" : "—"}</td>
                      <td>{b.pt_state ? "✓" : "—"}</td>
                      <td className="text-white/70 font-mono">
                        c:{b.compliant ?? 0} p:{b.pending ?? 0} o:{b.overdue ?? 0}
                      </td>
                      <td className="min-w-[180px]">
                        <div className="flex items-center gap-3">
                          <Progress value={health} />
                          <span className="font-mono text-xs text-white/70">{health}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {kpiCard("GST READINESS AVG", <span className="font-mono">—</span>)}
          {kpiCard("PF DUE DATES (MONTH)", <span className="font-mono">—</span>)}
          {kpiCard("HITL RESOLUTION RATE", <span className="font-mono">—</span>)}
        </div>
      </Card>
    </div>
  );
}


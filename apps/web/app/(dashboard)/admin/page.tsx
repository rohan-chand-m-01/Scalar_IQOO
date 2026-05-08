"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { createApiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminPage() {
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient({ getToken }), [getToken]);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [portalStatus, setPortalStatus] = useState<any[]>([]);
  const [portal, setPortal] = useState("gstn");
  const [regId, setRegId] = useState("GST_LATE_FEE_001");
  const [field, setField] = useState("value");
  const [value, setValue] = useState("350");
  const [statusText, setStatusText] = useState("");

  const load = async () => {
    const [st, us, ps] = await Promise.all([
      api.get("/admin/stats"),
      api.get<any[]>("/admin/users"),
      api.get<any[]>("/admin/portal-status"),
    ]);
    setStats(st);
    setUsers(us);
    setPortalStatus(ps);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const push = async () => {
    setStatusText("Pushing change...");
    await api.post("/admin/demo/trigger-change", {
      portal,
      regulation_id: regId,
      field,
      new_value: field === "value" ? Number(value) : value,
    });
    setStatusText("Change pushed. IRDA will detect and retrigger.");
    await load();
  };

  const reseed = async () => {
    await api.post("/admin/seed");
    await load();
  };

  return (
    <div className="space-y-4">
      <Card className="border-red-500/30 bg-red-500/10 p-4">
        <div className="text-lg font-semibold">⚠ Demo Control Panel</div>
      </Card>

      <Card className="border-white/10 bg-white/5 p-4 space-y-3">
        <div className="text-sm font-semibold">Trigger Regulation Change (Demo)</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Input value={portal} onChange={(e) => setPortal(e.target.value)} />
          <Input value={regId} onChange={(e) => setRegId(e.target.value)} />
          <Input value={field} onChange={(e) => setField(e.target.value)} />
          <Input value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-[#3b82f6] hover:bg-[#3b82f6]/90" onClick={push}>
            Push Change
          </Button>
          <span className="text-sm text-white/70">{statusText}</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Card className="border-white/10 bg-white/5 p-4">Businesses: {stats?.total_businesses ?? "—"}</Card>
        <Card className="border-white/10 bg-white/5 p-4">Obligations: {stats?.total_obligations ?? "—"}</Card>
        <Card className="border-white/10 bg-white/5 p-4">HITL Pending: {stats?.hitl_pending ?? "—"}</Card>
        <Card className="border-white/10 bg-white/5 p-4">Alerts: {stats?.total_alerts ?? "—"}</Card>
        <Card className="border-white/10 bg-white/5 p-4">Graph Nodes: —</Card>
      </div>

      <Card className="border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">User Management</div>
          <Button variant="secondary" onClick={reseed}>
            Re-seed all data
          </Button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-mono text-white/60">
              <tr><th className="py-2">Name</th><th>Type</th><th>State</th><th>GST</th><th>PF</th><th>FSSAI</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-white/10">
                  <td className="py-2">{u.name}</td>
                  <td>{u.business_type}</td>
                  <td>{u.state}</td>
                  <td>{u.gst_registered ? "✓" : "—"}</td>
                  <td>{u.pf_registered ? "✓" : "—"}</td>
                  <td>{u.fssai_registered ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold">Portal Status</div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
          {portalStatus.map((p) => (
            <Card key={p.portal} className="border-white/10 bg-black/20 p-3">
              <div className="font-mono text-sm">{p.portal}</div>
              <div className="text-xs text-white/60 mt-1">last: {p.last_checked ?? "—"}</div>
              <div className="text-xs text-white/60">hash: {String(p.last_hash ?? "—").slice(0, 16)}…</div>
              <div className="text-xs text-white/60">regs: {p.regulations_monitored}</div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}


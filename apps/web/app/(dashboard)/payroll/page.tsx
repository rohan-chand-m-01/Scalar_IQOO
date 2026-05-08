"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { createApiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Business = { id: string; name: string };

export default function PayrollPage() {
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient({ getToken }), [getToken]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selected, setSelected] = useState("");
  const [current, setCurrent] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    api.get<Business[]>("/admin/users").then((rows) => {
      setBusinesses(rows);
      if (rows[0]) setSelected(rows[0].id);
    });
  }, [api]);

  useEffect(() => {
    if (!selected) return;
    api.get(`/payroll/${selected}/current-month`).then(setCurrent);
    api.get<any[]>(`/payroll/${selected}/history`).then(setHistory);
  }, [api, selected]);

  const compute = async () => {
    if (!selected) return;
    const res = await api.post(`/payroll/${selected}/compute`);
    setCurrent(res);
    const h = await api.get<any[]>(`/payroll/${selected}/history`);
    setHistory(h);
  };

  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-white/5 p-4 flex items-center gap-3">
        <label className="text-sm text-white/70">Business</label>
        <select className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm" value={selected} onChange={(e) => setSelected(e.target.value)}>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <Button className="ml-auto bg-[#3b82f6] hover:bg-[#3b82f6]/90" onClick={compute}>
          Compute Payroll
        </Button>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          ["PF", current?.pf_amount, current?.pf_due_date, current?.pf_status],
          ["ESI", current?.esi_amount, current?.esi_due_date, current?.esi_status],
          ["PT", current?.pt_amount, current?.pt_due_date, current?.pt_status],
          ["TDS", current?.tds_amount, current?.tds_due_date, current?.tds_status],
        ].map(([name, amount, due, status]) => (
          <Card key={String(name)} className="border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold">{name}</div>
            <div className="mt-2 font-mono text-lg">₹{(amount as any) ?? "—"}</div>
            <div className="mt-1 text-xs text-white/60">due: {(due as any) ?? "—"}</div>
            <div className="mt-1 text-xs text-white/60">status: {(status as any) ?? "pending"}</div>
          </Card>
        ))}
      </div>

      <Card className="border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold">6-Month History</div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-mono text-white/60">
              <tr>
                <th className="py-2">Period</th><th>PF</th><th>ESI</th><th>PT</th><th>TDS</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r, idx) => (
                <tr key={idx} className="border-t border-white/10">
                  <td className="py-2 font-mono">{r.period}</td>
                  <td>{r.pf_amount}</td>
                  <td>{r.esi_amount}</td>
                  <td>{r.pt_amount}</td>
                  <td>{r.tds_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}


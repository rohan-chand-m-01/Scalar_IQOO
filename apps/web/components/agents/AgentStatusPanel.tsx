"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { createApiClient } from "@/lib/api-client";

type AgentRow = { agent_did: string; agent_name: string; action_count: number };

const AGENTS = ["IRDA", "DRCA", "COCE", "CAAL", "HITL", "GST Agent", "Payroll Agent"] as const;

export function AgentStatusPanel() {
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient({ getToken }), [getToken]);
  const [rows, setRows] = useState<AgentRow[]>([]);

  useEffect(() => {
    api.get<AgentRow[]>("/audit/agents").then(setRows).catch(() => setRows([]));
  }, [api]);

  const didByName = useMemo(() => {
    const map = new Map<string, AgentRow>();
    for (const r of rows) map.set(r.agent_name.toLowerCase(), r);
    return map;
  }, [rows]);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
      {AGENTS.map((name) => {
        const key = name.toLowerCase().split(" ")[0];
        const r = didByName.get(key);
        const didAbbrev = r?.agent_did ? `${r.agent_did.slice(0, 16)}…` : "—";
        return (
          <Card key={name} className="border-white/10 bg-white/5 p-3">
            <div className="text-xs font-mono text-white/60">{name}</div>
            <div className="mt-2 text-xs font-mono text-white/80">{didAbbrev}</div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-white/60">actions</span>
              <span className="font-mono text-sm">{r?.action_count ?? 0}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}


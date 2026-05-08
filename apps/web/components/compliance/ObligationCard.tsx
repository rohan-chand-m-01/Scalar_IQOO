"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ObligationCard({
  obligation,
}: {
  obligation: {
    domain?: string;
    title?: string;
    status?: string;
    due_date?: string;
    amount?: number;
    confidence_score?: number;
    source_portal?: string;
  };
}) {
  return (
    <Card className="border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <Badge className="bg-white/10 text-white/80 border border-white/10">{obligation.domain ?? "—"}</Badge>
        <Badge className="bg-black/20 text-white/80 border border-white/10">{obligation.status ?? "pending"}</Badge>
      </div>
      <div className="mt-3 text-sm font-semibold">{obligation.title ?? "Obligation"}</div>
      <div className="mt-2 text-xs font-mono text-white/60">
        due: {obligation.due_date ?? "—"} • amount: {obligation.amount ?? "—"} • conf:{" "}
        {obligation.confidence_score ?? "—"}
      </div>
      <div className="mt-2 text-xs text-white/60">source: {obligation.source_portal ?? "—"}</div>
    </Card>
  );
}


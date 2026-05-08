"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { createApiClient } from "@/lib/api-client";
import { KGVisualization } from "@/components/graph/KGVisualization";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type GraphNode = {
  node_id: string;
  domain: string;
  title: string;
  description: string;
  regulation_id: string;
  threshold_type: string;
  threshold_value: unknown;
  due_date_rule: string;
  version: number;
  source_portal: string;
};

type GraphEdge = { source: string; target: string; edge_type?: string };

export default function ObligationGraphPage() {
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient({ getToken }), [getToken]);
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [domains, setDomains] = useState<Record<string, boolean>>({
    GST: true,
    PF: true,
    ESI: true,
    FSSAI: true,
    PT: true,
    TDS: true,
  });

  useEffect(() => {
    api.get<{ nodes: GraphNode[]; edges: GraphEdge[] }>("/knowledge/graph").then(setGraph);
  }, [api]);

  const filteredNodes = (graph?.nodes ?? []).filter((n) => domains[n.domain] !== false);
  const filteredSet = new Set(filteredNodes.map((n) => n.node_id));
  const filteredEdges = (graph?.edges ?? []).filter((e) => filteredSet.has(e.source) && filteredSet.has(e.target));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
      <Card className="border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold">Filters</div>
        <div className="mt-3 space-y-2">
          {Object.keys(domains).map((d) => (
            <label key={d} className="flex items-center justify-between text-sm text-white/80">
              <span>{d}</span>
              <input
                type="checkbox"
                checked={domains[d]}
                onChange={(e) => setDomains((prev) => ({ ...prev, [d]: e.target.checked }))}
              />
            </label>
          ))}
        </div>

        <Separator className="my-4 bg-white/10" />
        <div className="text-sm font-semibold">Graph stats</div>
        <div className="mt-2 text-xs font-mono text-white/60">
          nodes: {filteredNodes.length} • edges: {filteredEdges.length}
        </div>

        <Separator className="my-4 bg-white/10" />
        <div className="text-sm font-semibold">Node detail</div>
        {!selected ? (
          <div className="mt-2 text-sm text-white/60">Click a node to inspect details.</div>
        ) : (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <Badge className="bg-white/10 border border-white/10 text-white/80">{selected.domain}</Badge>
              <span className="font-mono text-xs text-white/60">v{selected.version}</span>
            </div>
            <div className="text-sm font-semibold">{selected.title}</div>
            <div className="text-sm text-white/70">{selected.description}</div>
            <div className="text-xs font-mono text-white/60">
              regulation: {selected.regulation_id} • portal: {selected.source_portal}
            </div>
            <div className="text-xs font-mono text-white/60">
              threshold: {selected.threshold_type} • due: {selected.due_date_rule}
            </div>
          </div>
        )}
      </Card>

      <div>
        <KGVisualization
          nodes={filteredNodes as any}
          edges={filteredEdges}
          onNodeClick={(n) => setSelected(n as any)}
        />
      </div>
    </div>
  );
}


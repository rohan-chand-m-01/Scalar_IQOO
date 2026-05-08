"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";

type Node = {
  node_id: string;
  domain: string;
  title: string;
  threshold_type: string;
  threshold_value: unknown;
  due_date_rule: string;
};

type Edge = { source: string; target: string; edge_type?: string };

const DOMAIN_COLOR: Record<string, string> = {
  GST: "#3b82f6",
  PF: "#22c55e",
  ESI: "#14b8a6",
  FSSAI: "#f97316",
  PT: "#a855f7",
  TDS: "#ef4444",
};

export function KGVisualization({
  nodes,
  edges,
  onNodeClick,
}: {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (node: Node) => void;
}) {
  const ref = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const data = useMemo(() => ({ nodes: [...nodes], edges: [...edges] }), [nodes, edges]);

  useEffect(() => {
    const svgEl = ref.current;
    if (!svgEl) return;

    const width = svgEl.clientWidth || 900;
    const height = 560;

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
      g.attr("transform", event.transform);
    });
    svg.call(zoom as any);

    const link = g
      .append("g")
      .attr("stroke", "rgba(255,255,255,0.15)")
      .selectAll("line")
      .data(data.edges)
      .join("line")
      .attr("stroke-dasharray", (d) => (d.edge_type === "updates" ? "4 4" : d.edge_type === "invalidates" ? "2 6" : "0"));

    const node = g
      .append("g")
      .selectAll("circle")
      .data(data.nodes as any)
      .join("circle")
      .attr("r", 10)
      .attr("fill", (d: Node) => DOMAIN_COLOR[d.domain] ?? "#94a3b8")
      .attr("stroke", "rgba(0,0,0,0.4)")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("click", (_, d: Node) => onNodeClick?.(d))
      .on("mousemove", (event, d: Node) => {
        if (!tooltipRef.current) return;
        tooltipRef.current.style.opacity = "1";
        tooltipRef.current.style.left = `${event.clientX + 12}px`;
        tooltipRef.current.style.top = `${event.clientY + 12}px`;
        tooltipRef.current.innerHTML = `<div style="font-weight:600">${d.title}</div>
          <div style="opacity:.8;font-size:12px">${d.domain} • ${d.threshold_type} • ${d.due_date_rule}</div>`;
      })
      .on("mouseleave", () => {
        if (!tooltipRef.current) return;
        tooltipRef.current.style.opacity = "0";
      });

    const simulation = d3
      .forceSimulation(data.nodes as any)
      .force("link", d3.forceLink(data.edges as any).id((d: any) => d.node_id).distance(120))
      .force("charge", d3.forceManyBody().strength(-360))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(22));

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
    });

    return () => {
      simulation.stop();
    };
  }, [data, onNodeClick]);

  return (
    <div className="relative">
      <svg ref={ref} className="w-full h-[560px] rounded-lg border border-white/10 bg-black/30" />
      <div
        ref={tooltipRef}
        className="pointer-events-none fixed z-50 rounded-md border border-white/10 bg-black/80 px-3 py-2 text-xs text-white/90 opacity-0 transition-opacity"
      />
    </div>
  );
}


"use client";

import { Badge } from "@/components/ui/badge";

export function DualRailBadge({
  railAgreement,
  confidence,
  hitlRequired,
}: {
  railAgreement: boolean;
  confidence: number;
  hitlRequired: boolean;
}) {
  if (hitlRequired) {
    return <Badge className="bg-red-500/20 text-red-200 border border-red-500/30">⚠ HITL Escalated</Badge>;
  }
  if (!railAgreement) {
    return <Badge className="bg-amber-500/20 text-amber-200 border border-amber-500/30">LLM-Only Response</Badge>;
  }
  return (
    <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
      Dual-Rail Verified ✓ ({Math.round(confidence * 100)}%)
    </Badge>
  );
}


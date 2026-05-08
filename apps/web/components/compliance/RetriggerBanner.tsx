"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function RetriggerBanner({
  event,
}: {
  event: null | {
    portal?: string;
    affected_count?: number;
    message?: string;
    delta_id?: string;
  };
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!event) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 10000);
    return () => window.clearTimeout(t);
  }, [event]);

  if (!event || !visible) return null;

  return (
    <div className={cn("fixed left-0 right-0 top-0 z-50 px-6 py-3 bg-[#3b82f6]/15 border-b border-[#3b82f6]/30 backdrop-blur")}>
      <div className="flex items-center justify-between gap-4">
        <div className="font-mono text-sm text-white/90">
          ⚡ Regulation Change Detected: {event.portal} | {event.affected_count ?? "—"} businesses affected |{" "}
          {event.message ?? ""}
        </div>
        <Link href="/compliance-feed" className="text-sm text-[#3b82f6] hover:underline">
          View Details
        </Link>
      </div>
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { ClerkProvider } from "@clerk/nextjs";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-white/50 font-mono text-xs animate-pulse">Loading HEAPIFY...</div>
      </div>
    );
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}

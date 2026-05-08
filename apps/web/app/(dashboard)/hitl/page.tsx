"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { createApiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function HITLPage() {
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient({ getToken }), [getToken]);
  const [queue, setQueue] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    const q = await api.get<any[]>("/hitl/queue");
    setQueue(q ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolve = async (id: string, decision: "approved" | "rejected") => {
    await api.post(`/hitl/queue/${id}/resolve`, {
      decision,
      notes: notes[id] ?? "",
      approver_id: "demo_reviewer",
    });
    await load();
  };

  const createTest = async () => {
    await api.post("/hitl/queue/test-create?business_id=11111111-1111-1111-1111-111111111001");
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="border-white/10 bg-white/5 p-4">Pending: {queue.length}</Card>
        <Card className="border-white/10 bg-white/5 p-4">Resolved Today: —</Card>
        <Card className="border-white/10 bg-white/5 p-4">Avg Resolution Time: —</Card>
        <Card className="border-white/10 bg-white/5 p-4">Approval Rate: —</Card>
      </div>

      <Card className="border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Pending Queue</div>
          <Button className="bg-[#3b82f6] hover:bg-[#3b82f6]/90" onClick={createTest}>
            Create Test HITL Item
          </Button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-mono text-white/60">
              <tr>
                <th className="py-2">Business</th>
                <th>Action</th>
                <th>Divergence</th>
                <th>Confidence</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((q) => (
                <tr key={q.id} className="border-t border-white/10">
                  <td className="py-2 font-mono text-xs">{q.business_id}</td>
                  <td>{q.action_type}</td>
                  <td className="text-white/70">{q.divergence_reason}</td>
                  <td>{q.confidence_score}</td>
                  <td>
                    <Input
                      className="h-8 bg-black/40 border-white/10"
                      value={notes[q.id] ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [q.id]: e.target.value }))}
                    />
                  </td>
                  <td className="space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="secondary">
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#0f1117] text-white border-white/10 max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>HITL Review</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="rounded-md border border-white/10 bg-black/20 p-3">
                            <div className="text-sm font-semibold">Rail A</div>
                            <pre className="mt-2 text-xs font-mono overflow-auto max-h-[320px]">
                              {JSON.stringify(q.rail_a_response ?? {}, null, 2)}
                            </pre>
                          </div>
                          <div className="rounded-md border border-white/10 bg-black/20 p-3">
                            <div className="text-sm font-semibold">Rail B</div>
                            <pre className="mt-2 text-xs font-mono overflow-auto max-h-[320px]">
                              {JSON.stringify(q.rail_b_response ?? {}, null, 2)}
                            </pre>
                          </div>
                        </div>
                        <div className="rounded-md border border-white/10 bg-black/20 p-3">
                          <div className="text-sm font-semibold">Divergence analysis</div>
                          <div className="mt-2 text-sm text-white/70">{q.divergence_reason}</div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500" onClick={() => resolve(q.id, "approved")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => resolve(q.id, "rejected")}>
                      Reject
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}


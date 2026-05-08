"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useAuth } from "@clerk/nextjs";
import { useMemo, useState } from "react";
import { createApiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DualRailBadge } from "@/components/compliance/DualRailBadge";

type Msg = { role: "user" | "assistant"; text: string; meta?: any };

export default function AssistantPage() {
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient({ getToken }), [getToken]);
  const [businessId, setBusinessId] = useState("11111111-1111-1111-1111-111111111001");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);

  const send = async () => {
    if (!text.trim()) return;
    const userMsg: Msg = { role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setText("");
    const res = await api.post<any>("/assistant/chat", {
      message: userMsg.text,
      business_id: businessId,
      conversation_history: messages.map((m) => ({ role: m.role, content: m.text })),
    });
    setMessages((m) => [...m, { role: "assistant", text: res.response, meta: res }]);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
      <Card className="border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold">Context</div>
        <Input className="mt-3 bg-black/40 border-white/10" value={businessId} onChange={(e) => setBusinessId(e.target.value)} />
        <div className="mt-4 space-y-2">
          {[
            "What is the GST filing due date for this month?",
            "How much PF do I owe for 25 employees?",
            "When does my FSSAI license need renewal?",
            "What changed in GST regulations this week?",
          ].map((q) => (
            <button key={q} className="w-full text-left text-xs rounded border border-white/10 bg-black/20 p-2 hover:bg-black/30" onClick={() => setText(q)}>
              {q}
            </button>
          ))}
        </div>
      </Card>

      <Card className="border-white/10 bg-white/5 p-4">
        <div className="space-y-3 max-h-[560px] overflow-y-auto pr-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg p-3 text-sm ${m.role === "user" ? "bg-[#3b82f6]/30" : "bg-black/30 border border-white/10"}`}>
                <div>{m.text}</div>
                {m.role === "assistant" && m.meta && (
                  <div className="mt-3 space-y-2">
                    <DualRailBadge
                      railAgreement={Boolean(m.meta.rail_agreement)}
                      confidence={Number(m.meta.confidence_score ?? 0)}
                      hitlRequired={Boolean(m.meta.hitl_escalated)}
                    />
                    <div className="text-xs font-mono text-white/60">
                      confidence: {Math.round(Number(m.meta.confidence_score ?? 0) * 100)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Input
            className="bg-black/40 border-white/10"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask compliance question..."
          />
          <Button className="bg-[#3b82f6] hover:bg-[#3b82f6]/90" onClick={send}>
            Send
          </Button>
          <Button variant="secondary" onClick={() => setMessages([])}>
            Clear
          </Button>
        </div>
      </Card>
    </div>
  );
}


"use client";

import dynamic from "next/dynamic";

const AIChatPanel = dynamic(() => import("@/app/components/ai-chat-panel"), {
  ssr: false,
  loading: () => null,
});

export function AIMonitorWrapper() {
  return <AIChatPanel />;
}

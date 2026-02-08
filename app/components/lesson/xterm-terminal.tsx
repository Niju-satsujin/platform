"use client";

import { useEffect, useRef } from "react";

interface XtermTerminalProps {
  /** WebSocket URL for the terminal server */
  wsUrl?: string;
  /** Initial working directory for the shell */
  cwd?: string;
}

/**
 * Real terminal emulator powered by xterm.js + node-pty.
 * Connects to the WebSocket terminal server for full interactive shell access.
 *
 * Must be dynamically imported with ssr:false.
 */
export default function XtermTerminal({
  wsUrl = "ws://localhost:3061",
  cwd,
}: XtermTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let disposed = false;

    async function init() {
      // Dynamic import to avoid SSR
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");

      if (disposed || !containerRef.current) return;

      const terminal = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        lineHeight: 1.2,
        scrollback: 5000,
        theme: {
          background: "#0a0a0f",
          foreground: "#e4e4e7",
          cursor: "#eab308",
          cursorAccent: "#0a0a0f",
          selectionBackground: "#3f3f4680",
          selectionForeground: "#ffffff",
          black: "#18181b",
          red: "#ef4444",
          green: "#22c55e",
          yellow: "#eab308",
          blue: "#3b82f6",
          magenta: "#a855f7",
          cyan: "#06b6d4",
          white: "#e4e4e7",
          brightBlack: "#52525b",
          brightRed: "#f87171",
          brightGreen: "#4ade80",
          brightYellow: "#facc15",
          brightBlue: "#60a5fa",
          brightMagenta: "#c084fc",
          brightCyan: "#22d3ee",
          brightWhite: "#fafafa",
        },
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      terminal.open(containerRef.current);

      // Initial fit
      requestAnimationFrame(() => {
        try {
          fitAddon.fit();
        } catch {
          /* container not ready */
        }
      });

      // Connect WebSocket — pass cwd as query param
      const url = cwd ? `${wsUrl}?cwd=${encodeURIComponent(cwd)}` : wsUrl;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        // Send initial terminal size
        ws.send(
          JSON.stringify({ type: "resize", cols: terminal.cols, rows: terminal.rows })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "output") {
            terminal.write(msg.data);
          }
        } catch {
          // Raw data
          terminal.write(event.data);
        }
      };

      ws.onerror = () => {
        terminal.writeln(
          "\r\n\x1b[31m✗ Cannot connect to terminal server\x1b[0m"
        );
        terminal.writeln(
          "\x1b[33m  Run: npm run dev:terminal\x1b[0m"
        );
        terminal.writeln(
          "\x1b[33m  Or:  npx tsx server/terminal-server.ts\x1b[0m\r\n"
        );
      };

      ws.onclose = () => {
        terminal.writeln("\r\n\x1b[90m[Terminal disconnected]\x1b[0m");
      };

      // Terminal input → WebSocket
      terminal.onData((data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "input", data }));
        }
      });

      // Terminal resize → WebSocket
      terminal.onResize(({ cols, rows }: { cols: number; rows: number }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "resize", cols, rows }));
        }
      });

      // Auto-fit on container resize
      const observer = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          try {
            fitAddon.fit();
          } catch {
            /* not ready */
          }
        });
      });
      observer.observe(containerRef.current);

      // Store cleanup
      cleanupRef.current = () => {
        observer.disconnect();
        ws.close();
        terminal.dispose();
      };
    }

    init();

    return () => {
      disposed = true;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [wsUrl, cwd]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] overflow-hidden">
      {/* Thin terminal header */}
      <div className="flex items-center justify-between px-3 py-1 bg-gray-900 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-semibold text-gray-400">Terminal</span>
        </div>
        <span className="text-[10px] text-gray-600 font-mono">bash</span>
      </div>
      {/* xterm container */}
      <div ref={containerRef} className="flex-1 min-h-0 p-1" />
    </div>
  );
}

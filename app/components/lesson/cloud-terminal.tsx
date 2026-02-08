"use client";

import { useEffect, useRef, useCallback } from "react";

interface CloudTerminalProps {
  /** Function to get current editor code */
  getCode: () => string;
  /** Function to get all open files */
  getFiles?: () => { name: string; content: string }[];
  /** Language for compilation (default: cpp) */
  language?: string;
  /** Lesson ID for context */
  lessonId?: string;
}

/**
 * Cloud Terminal — runs entirely in the browser.
 *
 * Provides a shell-like experience with:
 * - Basic commands: ls, cat, pwd, cd, echo, clear, help
 * - C++ compilation: g++ / compile / run (routed through /api/execute)
 * - File management: virtual filesystem from editor
 * - Full xterm.js rendering with colors and formatting
 */
export default function CloudTerminal({
  getCode,
  getFiles,
  language = "cpp",
}: CloudTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const getCodeRef = useRef(getCode);
  const getFilesRef = useRef(getFiles);
  getCodeRef.current = getCode;
  getFilesRef.current = getFiles;
  const langRef = useRef(language);
  langRef.current = language;

  const boot = useCallback(async () => {
    if (!containerRef.current) return;

    const { Terminal } = await import("@xterm/xterm");
    const { FitAddon } = await import("@xterm/addon-fit");

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      lineHeight: 1.2,
      scrollback: 5000,
      convertEol: true,
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

    requestAnimationFrame(() => {
      try { fitAddon.fit(); } catch { /* not ready */ }
    });

    // ── Virtual Shell State ──
    let inputBuffer = "";
    let historyList: string[] = [];
    let historyIdx = -1;
    let currentLine = "";
    let running = false;

    const CWD = "/workspace";
    const USER = "user";
    const HOST = "cloud";

    // ── Helpers ──
    function prompt() {
      terminal.write(`\r\n\x1b[32m${USER}@${HOST}\x1b[0m:\x1b[34m${CWD}\x1b[0m$ `);
      inputBuffer = "";
    }

    function writeLn(text: string) {
      terminal.write(`\r\n${text}`);
    }

    function writeColor(text: string, color: string) {
      const codes: Record<string, string> = {
        red: "31", green: "32", yellow: "33",
        blue: "34", magenta: "35", cyan: "36",
        gray: "90", white: "37",
        boldGreen: "1;32", boldRed: "1;31",
        boldYellow: "1;33", boldCyan: "1;36",
      };
      terminal.write(`\x1b[${codes[color] || "0"}m${text}\x1b[0m`);
    }

    // ── Welcome message ──
    terminal.write("\x1b[1;33m  ⚡ Cloud Terminal\x1b[0m\r\n");
    terminal.write("\x1b[90m  C++ compilation powered by Piston API\x1b[0m\r\n");
    terminal.write("\x1b[90m  Type \x1b[36mhelp\x1b[90m for available commands\x1b[0m\r\n");
    prompt();

    // ── Command execution ──
    async function executeCommand(cmd: string) {
      const trimmed = cmd.trim();
      if (!trimmed) { prompt(); return; }

      historyList.push(trimmed);
      historyIdx = historyList.length;

      const parts = trimmed.split(/\s+/);
      const command = parts[0];
      const args = parts.slice(1);

      switch (command) {
        case "help":
          writeLn("\x1b[1;33m  Available Commands:\x1b[0m");
          writeLn("  \x1b[36mrun\x1b[0m              Compile and run your code");
          writeLn("  \x1b[36mrun <stdin>\x1b[0m      Run with input (e.g., run < \"hello\")");
          writeLn("  \x1b[36mg++\x1b[0m              Alias for run (compiles C++)");
          writeLn("  \x1b[36mcompile\x1b[0m          Alias for run");
          writeLn("  \x1b[36mtest\x1b[0m             Run tests against your code");
          writeLn("  \x1b[36mls\x1b[0m               List files in editor");
          writeLn("  \x1b[36mcat <file>\x1b[0m       Show file contents");
          writeLn("  \x1b[36mpwd\x1b[0m              Print working directory");
          writeLn("  \x1b[36mecho <text>\x1b[0m      Echo text");
          writeLn("  \x1b[36mclear\x1b[0m            Clear terminal");
          writeLn("  \x1b[36mhistory\x1b[0m          Show command history");
          writeLn("  \x1b[36mhelp\x1b[0m             Show this help");
          writeLn("");
          writeLn("  \x1b[90mTip: Write code in the editor above, then type 'run'\x1b[0m");
          prompt();
          break;

        case "clear":
          terminal.clear();
          terminal.write("\x1b[H\x1b[2J");
          prompt();
          break;

        case "pwd":
          writeLn(CWD);
          prompt();
          break;

        case "ls": {
          const files = getFilesRef.current?.() || [];
          if (files.length === 0) {
            writeLn("\x1b[90m  (no files open)\x1b[0m");
          } else {
            for (const f of files) {
              const ext = f.name.split(".").pop() || "";
              const color = ["cpp", "cc", "cxx", "c", "h"].includes(ext)
                ? "\x1b[36m" : ["py"].includes(ext)
                ? "\x1b[33m" : ["js", "ts"].includes(ext)
                ? "\x1b[32m" : "\x1b[37m";
              writeLn(`  ${color}${f.name}\x1b[0m`);
            }
          }
          prompt();
          break;
        }

        case "cat": {
          if (args.length === 0) {
            writeLn("\x1b[31m  Usage: cat <filename>\x1b[0m");
            prompt();
            break;
          }
          const files = getFilesRef.current?.() || [];
          const target = args[0];
          const file = files.find(
            (f) => f.name === target || f.name.endsWith(`/${target}`)
          );
          if (!file) {
            writeLn(`\x1b[31m  cat: ${target}: No such file\x1b[0m`);
          } else {
            const lines = file.content.split("\n");
            for (const line of lines) {
              writeLn(`  ${line}`);
            }
          }
          prompt();
          break;
        }

        case "echo":
          writeLn("  " + args.join(" "));
          prompt();
          break;

        case "history":
          for (let i = 0; i < historyList.length; i++) {
            writeLn(`  \x1b[90m${String(i + 1).padStart(4)}\x1b[0m  ${historyList[i]}`);
          }
          prompt();
          break;

        case "g++":
        case "gcc":
        case "compile":
        case "run":
        case "make": {
          const code = getCodeRef.current();
          if (!code.trim()) {
            writeLn("\x1b[31m  ✗ No code to compile. Write some code in the editor first.\x1b[0m");
            prompt();
            break;
          }

          // Parse stdin from args: run < "some input"  or  run <<< "input"
          let stdin = "";
          const ltIdx = args.indexOf("<");
          const tripleIdx = args.indexOf("<<<");
          if (tripleIdx >= 0) {
            stdin = args.slice(tripleIdx + 1).join(" ").replace(/^["']|["']$/g, "");
          } else if (ltIdx >= 0) {
            stdin = args.slice(ltIdx + 1).join(" ").replace(/^["']|["']$/g, "");
          }

          running = true;
          writeLn("");
          writeColor("  ⏳ Compiling…\r\n", "yellow");

          try {
            const res = await fetch("/api/execute", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code,
                language: langRef.current,
                stdin,
                files: [],
              }),
            });

            const data = await res.json();

            if (data.success) {
              writeColor("  ✓ Compiled successfully\r\n", "green");

              if (data.warnings) {
                writeColor("  ⚠ Warnings:\r\n", "yellow");
                for (const line of data.warnings.split("\n")) {
                  writeLn(`    \x1b[33m${line}\x1b[0m`);
                }
              }

              writeLn("\x1b[90m  ─── Output ───────────────────────\x1b[0m");
              if (data.stdout) {
                for (const line of data.stdout.split("\n")) {
                  writeLn(`  ${line}`);
                }
              } else {
                writeLn("  \x1b[90m(no output)\x1b[0m");
              }
              writeLn("\x1b[90m  ──────────────────────────────────\x1b[0m");

              if (data.stderr) {
                writeColor("\r\n  stderr:\r\n", "gray");
                for (const line of data.stderr.split("\n")) {
                  writeLn(`    \x1b[90m${line}\x1b[0m`);
                }
              }

              writeLn(`\r\n  \x1b[32m✓ Program exited (code ${data.exitCode ?? 0})\x1b[0m`);
            } else {
              if (data.phase === "compile") {
                writeColor("  ✗ Compilation failed\r\n\r\n", "red");
                if (data.stderr || data.error) {
                  for (const line of (data.stderr || data.error).split("\n")) {
                    writeLn(`    \x1b[31m${line}\x1b[0m`);
                  }
                }
              } else {
                writeColor(`  ✗ Runtime error`, "red");
                if (data.signal) writeColor(` (signal: ${data.signal})`, "red");
                writeLn("");
                if (data.stdout) {
                  writeLn("\x1b[90m  ─── Output before error ──────────\x1b[0m");
                  for (const line of data.stdout.split("\n")) {
                    writeLn(`  ${line}`);
                  }
                }
                if (data.stderr || data.error) {
                  writeLn("");
                  for (const line of (data.stderr || data.error).split("\n")) {
                    writeLn(`    \x1b[31m${line}\x1b[0m`);
                  }
                }
              }
            }
          } catch (err) {
            writeColor(`  ✗ Network error: ${err instanceof Error ? err.message : "Failed to connect"}\r\n`, "red");
            writeLn("  \x1b[90mCheck your internet connection and try again.\x1b[0m");
          }

          running = false;
          prompt();
          break;
        }

        default:
          writeLn(`\x1b[31m  ${command}: command not found\x1b[0m`);
          writeLn(`\x1b[90m  Type 'help' for available commands\x1b[0m`);
          prompt();
          break;
      }
    }

    // ── Handle keyboard input ──
    terminal.onData((data: string) => {
      if (running) return; // Ignore input while running

      const code = data.charCodeAt(0);

      if (data === "\r" || data === "\n") {
        // Enter
        const cmd = inputBuffer;
        inputBuffer = "";
        executeCommand(cmd);
      } else if (data === "\x7f" || data === "\b") {
        // Backspace
        if (inputBuffer.length > 0) {
          inputBuffer = inputBuffer.slice(0, -1);
          terminal.write("\b \b");
        }
      } else if (data === "\x1b[A") {
        // Up arrow — history
        if (historyIdx > 0) {
          historyIdx--;
          // Clear current line
          terminal.write(`\r\x1b[K\x1b[32m${USER}@${HOST}\x1b[0m:\x1b[34m${CWD}\x1b[0m$ `);
          inputBuffer = historyList[historyIdx] || "";
          terminal.write(inputBuffer);
        }
      } else if (data === "\x1b[B") {
        // Down arrow — history
        if (historyIdx < historyList.length - 1) {
          historyIdx++;
          terminal.write(`\r\x1b[K\x1b[32m${USER}@${HOST}\x1b[0m:\x1b[34m${CWD}\x1b[0m$ `);
          inputBuffer = historyList[historyIdx] || "";
          terminal.write(inputBuffer);
        } else {
          historyIdx = historyList.length;
          terminal.write(`\r\x1b[K\x1b[32m${USER}@${HOST}\x1b[0m:\x1b[34m${CWD}\x1b[0m$ `);
          inputBuffer = "";
        }
      } else if (data === "\x03") {
        // Ctrl+C
        writeColor("^C", "red");
        prompt();
      } else if (data === "\x0c") {
        // Ctrl+L (clear)
        terminal.clear();
        terminal.write("\x1b[H\x1b[2J");
        prompt();
      } else if (data === "\t") {
        // Tab — autocomplete commands
        const commands = ["run", "compile", "g++", "ls", "cat", "pwd", "echo", "clear", "help", "history", "test"];
        const matches = commands.filter((c) => c.startsWith(inputBuffer));
        if (matches.length === 1) {
          const rest = matches[0].slice(inputBuffer.length);
          inputBuffer += rest;
          terminal.write(rest);
        } else if (matches.length > 1) {
          writeLn(`  ${matches.join("  ")}`);
          terminal.write(`\x1b[32m${USER}@${HOST}\x1b[0m:\x1b[34m${CWD}\x1b[0m$ ${inputBuffer}`);
        }
      } else if (code >= 32) {
        // Printable character
        inputBuffer += data;
        terminal.write(data);
      }
    });

    // ── Auto-fit on resize ──
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        try { fitAddon.fit(); } catch { /* not ready */ }
      });
    });
    observer.observe(containerRef.current);

    cleanupRef.current = () => {
      observer.disconnect();
      terminal.dispose();
    };
  }, []);

  useEffect(() => {
    let disposed = false;

    (async () => {
      if (disposed) return;
      await boot();
    })();

    return () => {
      disposed = true;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [boot]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1 bg-gray-900 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-semibold text-gray-400">Cloud Terminal</span>
        </div>
        <span className="text-[10px] text-gray-600 font-mono">piston • c++</span>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0 p-1" />
    </div>
  );
}

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
  /** Absolute workspace directory for running make commands */
  workspaceDir?: string;
  /** External command to run in terminal (e.g. make test) */
  externalCommand?: string;
  /** Tick that triggers running externalCommand */
  externalCommandNonce?: number;
}

/**
 * Cloud Terminal — browser-based terminal UI.
 *
 * - Build/run snippets via /api/execute (Piston)
 * - Run workspace commands like `make test` via /api/fs/exec
 * - Supports programmatic command injection (Testing button)
 */
export default function CloudTerminal({
  getCode,
  getFiles,
  language = "cpp",
  workspaceDir,
  externalCommand,
  externalCommandNonce,
}: CloudTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const commandRunnerRef = useRef<((cmd: string) => void) | null>(null);
  const pendingExternalCommandRef = useRef<string | null>(null);

  const getCodeRef = useRef(getCode);
  const getFilesRef = useRef(getFiles);
  const langRef = useRef(language);
  const workspaceDirRef = useRef(workspaceDir);

  getCodeRef.current = getCode;
  getFilesRef.current = getFiles;
  langRef.current = language;
  workspaceDirRef.current = workspaceDir;

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
      try {
        fitAddon.fit();
      } catch {
        /* not ready */
      }
    });

    // ── Virtual shell state ──
    let inputBuffer = "";
    const historyList: string[] = [];
    let historyIdx = -1;
    let running = false;

    const USER = "user";
    const HOST = "cloud";

    function getPromptCwd() {
      return workspaceDirRef.current || "/workspace";
    }

    function prompt() {
      terminal.write(
        `\r\n\x1b[32m${USER}@${HOST}\x1b[0m:\x1b[34m${getPromptCwd()}\x1b[0m$ `
      );
      inputBuffer = "";
    }

    function writeLn(text: string) {
      terminal.write(`\r\n${text}`);
    }

    function writeColor(text: string, color: string) {
      const codes: Record<string, string> = {
        red: "31",
        green: "32",
        yellow: "33",
        blue: "34",
        magenta: "35",
        cyan: "36",
        gray: "90",
        white: "37",
        boldGreen: "1;32",
        boldRed: "1;31",
        boldYellow: "1;33",
        boldCyan: "1;36",
      };
      terminal.write(`\x1b[${codes[color] || "0"}m${text}\x1b[0m`);
    }

    function printStyledOutput(text: string) {
      if (!text) return;
      for (const rawLine of text.split("\n")) {
        const line = rawLine.replace(/\r/g, "");
        if (!line.trim()) continue;
        const normalized = line.trimStart();
        if (normalized.startsWith("PASS")) {
          writeLn(`  \x1b[32m${line}\x1b[0m`);
        } else if (normalized.startsWith("FAIL")) {
          writeLn(`  \x1b[31m${line}\x1b[0m`);
        } else if (normalized.startsWith("Summary:")) {
          writeLn(`  \x1b[1;33m${line}\x1b[0m`);
        } else if (normalized.includes("ALL PASS")) {
          writeLn(`  \x1b[1;32m${line}\x1b[0m`);
        } else {
          writeLn(`  ${line}`);
        }
      }
    }

    async function runLegacyHarnessFromEditorCode() {
      const code = getCodeRef.current();
      if (!code.trim()) {
        writeLn(
          "\x1b[31m  ✗ No code to compile. Write some code in the editor first.\x1b[0m"
        );
        prompt();
        return;
      }

      running = true;
      writeLn("");
      writeColor("  ⏳ Running 12-test regression harness…\r\n", "yellow");
      writeLn("\x1b[90m  ─── Test Output ──────────────────\x1b[0m");

      try {
        const res = await fetch("/api/test-harness", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();

        if (data.phase === "compile") {
          writeColor("  ✗ Compilation failed — fix build errors first\r\n", "red");
          printStyledOutput(data.stdout || data.stderr || "");
        } else {
          printStyledOutput(data.stdout || "");
          printStyledOutput(data.stderr || "");
        }

        writeLn("\x1b[90m  ──────────────────────────────────\x1b[0m");
        const passedNum = data.passed ?? 0;
        const totalNum = data.total ?? 12;
        if (passedNum === totalNum) {
          writeLn(`\r\n  \x1b[1;32m✓ ${passedNum}/${totalNum} tests passed\x1b[0m`);
        } else {
          writeLn(`\r\n  \x1b[1;31m✗ ${passedNum}/${totalNum} tests passed\x1b[0m`);
        }
      } catch (err) {
        writeColor(
          `  ✗ Network error: ${err instanceof Error ? err.message : "Failed"}\r\n`,
          "red"
        );
      }

      running = false;
      prompt();
    }

    async function runWorkspaceCommand(commandLine: string) {
      const cwd = workspaceDirRef.current;
      if (!cwd) {
        writeLn(
          "\x1b[31m  ✗ No workspace selected. Open a folder first.\x1b[0m"
        );
        prompt();
        return;
      }

      running = true;
      writeLn("");
      writeColor(`  ⏳ ${commandLine} — running in workspace…\r\n`, "yellow");
      writeLn(`  \x1b[90mcwd: ${cwd}\x1b[0m`);
      writeLn("\x1b[90m  ─── Command Output ───────────────\x1b[0m");

      try {
        const res = await fetch("/api/fs/exec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cwd,
            command: commandLine,
            timeoutMs: commandLine === "make test" ? 60000 : 30000,
          }),
        });
        const data = await res.json();
        const resolvedCwd =
          typeof data?.cwd === "string" && data.cwd.trim() ? data.cwd : cwd;
        if (resolvedCwd !== cwd) {
          writeLn(`  \x1b[90mresolved cwd: ${resolvedCwd}\x1b[0m`);
        }

        if (!res.ok) {
          writeColor(`  ✗ ${data.error || "Command failed"}\r\n`, "red");
          if (data.stdout) printStyledOutput(data.stdout);
          if (data.stderr) printStyledOutput(data.stderr);
        } else {
          if (data.stdout) printStyledOutput(data.stdout);
          if (data.stderr) printStyledOutput(data.stderr);
          if (data.timedOut) {
            writeColor("  ✗ Command timed out\r\n", "red");
          }
        }

        writeLn("\x1b[90m  ──────────────────────────────────\x1b[0m");
        const exitCode = typeof data.exitCode === "number" ? data.exitCode : 1;
        if (exitCode === 0 && !data.timedOut) {
          writeLn(`\r\n  \x1b[1;32m✓ ${commandLine} completed (exit 0)\x1b[0m`);
        } else {
          writeLn(`\r\n  \x1b[1;31m✗ ${commandLine} failed (exit ${exitCode})\x1b[0m`);
        }
      } catch (err) {
        writeColor(
          `  ✗ Network error: ${err instanceof Error ? err.message : "Failed"}\r\n`,
          "red"
        );
      }

      running = false;
      prompt();
    }

    terminal.write("\x1b[1;33m  ⚡ Cloud Terminal\x1b[0m\r\n");
    terminal.write("\x1b[90m  Build and test from your lesson workspace\x1b[0m\r\n");
    terminal.write(
      "\x1b[90m  Type \x1b[36mhelp\x1b[90m for available commands\x1b[0m\r\n"
    );
    prompt();

    async function executeCommand(cmd: string) {
      const trimmed = cmd.trim();
      if (!trimmed) {
        prompt();
        return;
      }

      historyList.push(trimmed);
      historyIdx = historyList.length;

      const parts = trimmed.split(/\s+/);
      const command = parts[0];
      const args = parts.slice(1);

      switch (command) {
        case "help":
          writeLn("\x1b[1;33m  Available Commands:\x1b[0m");
          writeLn("");
          writeLn("  \x1b[1;36m── Build & Run ──\x1b[0m");
          writeLn("  \x1b[36mrun\x1b[0m              Compile and run current code buffer");
          writeLn("  \x1b[36mcompile\x1b[0m          Alias for run");
          writeLn("  \x1b[36mg++\x1b[0m              Alias for run");
          writeLn("");
          writeLn("  \x1b[1;36m── Testing ──\x1b[0m");
          writeLn("  \x1b[36mmake test\x1b[0m        Run project regression tests");
          writeLn("  \x1b[36mtest\x1b[0m             Alias for make test");
          writeLn("");
          writeLn("  \x1b[1;36m── Files & Util ──\x1b[0m");
          writeLn("  \x1b[36mls\x1b[0m               List open editor files");
          writeLn("  \x1b[36mcat <file>\x1b[0m       Show open file contents");
          writeLn("  \x1b[36mpwd\x1b[0m              Print terminal workspace path");
          writeLn("  \x1b[36mecho <text>\x1b[0m      Echo text");
          writeLn("  \x1b[36mclear\x1b[0m            Clear terminal");
          writeLn("  \x1b[36mhistory\x1b[0m          Show command history");
          writeLn("");
          writeLn("  \x1b[90mTip: Use the 🧪 Testing button to run make test.\x1b[0m");
          prompt();
          break;

        case "clear":
          terminal.clear();
          terminal.write("\x1b[H\x1b[2J");
          prompt();
          break;

        case "pwd":
          writeLn(getPromptCwd());
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
                ? "\x1b[36m"
                : ["py"].includes(ext)
                  ? "\x1b[33m"
                  : ["js", "ts"].includes(ext)
                    ? "\x1b[32m"
                    : "\x1b[37m";
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
            for (const line of file.content.split("\n")) {
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
            writeLn(
              `  \x1b[90m${String(i + 1).padStart(4)}\x1b[0m  ${historyList[i]}`
            );
          }
          prompt();
          break;

        case "test":
          if (workspaceDirRef.current) {
            await runWorkspaceCommand("make test");
          } else {
            await runLegacyHarnessFromEditorCode();
          }
          break;

        case "make": {
          if (workspaceDirRef.current) {
            const makeCommand = args.length > 0 ? `make ${args.join(" ")}` : "make build";
            await runWorkspaceCommand(makeCommand);
            break;
          }
          if (args[0] === "test") {
            await runLegacyHarnessFromEditorCode();
            break;
          }
          // No workspace: keep historical behavior and compile current buffer.
        }
        // eslint-disable-next-line no-fallthrough
        case "g++":
        case "gcc":
        case "compile":
        case "run": {
          const code = getCodeRef.current();
          if (!code.trim()) {
            writeLn(
              "\x1b[31m  ✗ No code to compile. Write some code in the editor first.\x1b[0m"
            );
            prompt();
            break;
          }

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
                  if (line.trim()) writeLn(`    \x1b[33m${line}\x1b[0m`);
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
                  if (line.trim()) writeLn(`    \x1b[90m${line}\x1b[0m`);
                }
              }

              writeLn(
                `\r\n  \x1b[32m✓ Program exited (code ${data.exitCode ?? 0})\x1b[0m`
              );
            } else if (data.phase === "compile") {
              writeColor("  ✗ Compilation failed\r\n", "red");
              for (const line of (data.stderr || data.error || "").split("\n")) {
                if (line.trim()) writeLn(`    \x1b[31m${line}\x1b[0m`);
              }
            } else {
              writeColor("  ✗ Runtime error\r\n", "red");
              for (const line of (data.stderr || data.error || "").split("\n")) {
                if (line.trim()) writeLn(`    \x1b[31m${line}\x1b[0m`);
              }
            }
          } catch (err) {
            writeColor(
              `  ✗ Network error: ${err instanceof Error ? err.message : "Failed to connect"}\r\n`,
              "red"
            );
          }

          running = false;
          prompt();
          break;
        }

        default:
          writeLn(`\x1b[31m  ${command}: command not found\x1b[0m`);
          writeLn("\x1b[90m  Type 'help' for available commands\x1b[0m");
          prompt();
          break;
      }
    }

    commandRunnerRef.current = (cmd: string) => {
      void executeCommand(cmd);
    };

    if (pendingExternalCommandRef.current) {
      const queued = pendingExternalCommandRef.current;
      pendingExternalCommandRef.current = null;
      commandRunnerRef.current(queued);
    }

    terminal.onData((data: string) => {
      if (running) return;

      const code = data.charCodeAt(0);

      if (data === "\r" || data === "\n") {
        const cmd = inputBuffer;
        inputBuffer = "";
        void executeCommand(cmd);
      } else if (data === "\x7f" || data === "\b") {
        if (inputBuffer.length > 0) {
          inputBuffer = inputBuffer.slice(0, -1);
          terminal.write("\b \b");
        }
      } else if (data === "\x1b[A") {
        if (historyIdx > 0) {
          historyIdx--;
          terminal.write(
            `\r\x1b[K\x1b[32m${USER}@${HOST}\x1b[0m:\x1b[34m${getPromptCwd()}\x1b[0m$ `
          );
          inputBuffer = historyList[historyIdx] || "";
          terminal.write(inputBuffer);
        }
      } else if (data === "\x1b[B") {
        if (historyIdx < historyList.length - 1) {
          historyIdx++;
          terminal.write(
            `\r\x1b[K\x1b[32m${USER}@${HOST}\x1b[0m:\x1b[34m${getPromptCwd()}\x1b[0m$ `
          );
          inputBuffer = historyList[historyIdx] || "";
          terminal.write(inputBuffer);
        } else {
          historyIdx = historyList.length;
          terminal.write(
            `\r\x1b[K\x1b[32m${USER}@${HOST}\x1b[0m:\x1b[34m${getPromptCwd()}\x1b[0m$ `
          );
          inputBuffer = "";
        }
      } else if (data === "\x03") {
        writeColor("^C", "red");
        prompt();
      } else if (data === "\x0c") {
        terminal.clear();
        terminal.write("\x1b[H\x1b[2J");
        prompt();
      } else if (data === "\t") {
        const commands = [
          "run",
          "compile",
          "g++",
          "make",
          "test",
          "ls",
          "cat",
          "pwd",
          "echo",
          "clear",
          "help",
          "history",
        ];
        const matches = commands.filter((c) => c.startsWith(inputBuffer));
        if (matches.length === 1) {
          const rest = matches[0].slice(inputBuffer.length);
          inputBuffer += rest;
          terminal.write(rest);
        } else if (matches.length > 1) {
          writeLn(`  ${matches.join("  ")}`);
          terminal.write(
            `\x1b[32m${USER}@${HOST}\x1b[0m:\x1b[34m${getPromptCwd()}\x1b[0m$ ${inputBuffer}`
          );
        }
      } else if (code >= 32) {
        inputBuffer += data;
        terminal.write(data);
      }
    });

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

    cleanupRef.current = () => {
      observer.disconnect();
      commandRunnerRef.current = null;
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

  useEffect(() => {
    if (externalCommandNonce === undefined) return;
    const cmd = (externalCommand || "").trim();
    if (!cmd) return;

    if (commandRunnerRef.current) {
      commandRunnerRef.current(cmd);
      return;
    }
    pendingExternalCommandRef.current = cmd;
  }, [externalCommand, externalCommandNonce]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1 bg-gray-900 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-semibold text-gray-400">Cloud Terminal</span>
        </div>
        <span className="text-[10px] text-gray-600 font-mono">workspace mode</span>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0 p-1" />
    </div>
  );
}

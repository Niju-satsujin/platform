"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { CodeEditor } from "@/app/components/code-editor";

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

interface ConsoleOutput {
  type: "stdout" | "stderr" | "info" | "success" | "error";
  text: string;
  timestamp: number;
}

interface CodeRunnerProps {
  lessonId: string;
  partSlug: string;
  lessonSlug: string;
  passed: boolean;
  starterCode: string;
  testCode: string;
  expectedOutput: string;
  solutionCode: string;
  onPass: () => void;
}

export function CodeRunner({
  lessonId,
  partSlug,
  lessonSlug,
  passed: initialPassed,
  starterCode,
  testCode,
  expectedOutput,
  solutionCode,
  onPass,
}: CodeRunnerProps) {
  const [code, setCode] = useState(starterCode);
  const [consoleOutput, setConsoleOutput] = useState<ConsoleOutput[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [passed, setPassed] = useState(initialPassed);
  const [activeTab, setActiveTab] = useState<"console" | "tests">("console");
  const [consoleHeight, setConsoleHeight] = useState(200);
  const [showSolution, setShowSolution] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  const addOutput = useCallback(
    (type: ConsoleOutput["type"], text: string) => {
      setConsoleOutput((prev) => [
        ...prev,
        { type, text, timestamp: Date.now() },
      ]);
    },
    []
  );

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput, testResults]);

  // Resize handler
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      dragStartY.current = e.clientY;
      dragStartHeight.current = consoleHeight;
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    },
    [consoleHeight]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const diff = dragStartY.current - e.clientY;
      setConsoleHeight(Math.max(100, Math.min(500, dragStartHeight.current + diff)));
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Run code (no tests)
  async function handleRun() {
    setIsRunning(true);
    setConsoleOutput([]);
    setActiveTab("console");
    addOutput("info", "⏳ Compiling...");

    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      setConsoleOutput([]); // Clear the "Compiling..." message

      if (!data.success && data.phase === "compile") {
        addOutput("error", "❌ Compilation Error:\n" + data.error);
      } else if (!data.success && data.phase === "runtime") {
        if (data.stdout) addOutput("stdout", data.stdout);
        addOutput("error", "❌ Runtime Error: " + data.error);
        if (data.stderr) addOutput("stderr", data.stderr);
      } else if (data.success) {
        if (data.warnings) addOutput("stderr", "⚠️ Warnings:\n" + data.warnings);
        if (data.stdout) {
          addOutput("stdout", data.stdout);
        } else {
          addOutput("info", "(no output)");
        }
        addOutput("success", "✅ Program exited successfully");
      }
    } catch {
      addOutput("error", "❌ Network error — could not reach server");
    } finally {
      setIsRunning(false);
    }
  }

  // Submit (run tests)
  async function handleSubmit() {
    setIsTesting(true);
    setTestResults([]);
    setConsoleOutput([]);
    setActiveTab("tests");
    addOutput("info", "⏳ Running tests...");

    try {
      const body: Record<string, unknown> = { code };

      if (testCode) {
        body.testCode = testCode;
      } else if (expectedOutput) {
        body.expectedOutput = expectedOutput;
      }

      const res = await fetch("/api/test-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      setConsoleOutput([]);

      if (!data.success && data.phase === "compile") {
        addOutput("error", "❌ Compilation Error:\n" + data.error);
        setTestResults([]);
      } else if (!data.success && data.phase === "runtime") {
        if (data.stdout) addOutput("stdout", data.stdout);
        addOutput("error", "❌ Runtime Error: " + data.error);
        setTestResults(data.results || []);
      } else {
        const results: TestResult[] = data.results || [];
        setTestResults(results);

        const allPassed = results.length > 0 && results.every((r) => r.passed);

        if (allPassed) {
          addOutput("success", `✅ All ${results.length} test(s) passed!`);
          if (!passed) {
            setPassed(true);
            // Save completion via server action
            try {
              const saveRes = await fetch("/api/submit-lesson", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lessonId, code, partSlug, lessonSlug }),
              });
              if (saveRes.ok) {
                onPass();
              }
            } catch { /* ignore save errors */ }
          }
        } else {
          const passedCount = results.filter((r) => r.passed).length;
          addOutput(
            "error",
            `❌ ${passedCount}/${results.length} test(s) passed`
          );
        }

        if (data.warnings) addOutput("stderr", "⚠️ Warnings:\n" + data.warnings);
      }
    } catch {
      addOutput("error", "❌ Network error — could not reach server");
    } finally {
      setIsTesting(false);
    }
  }

  function handleReset() {
    setCode(starterCode);
    setConsoleOutput([]);
    setTestResults([]);
  }

  function handleShowSolution() {
    if (solutionCode) {
      setShowSolution(!showSolution);
      if (!showSolution) {
        setCode(solutionCode);
      } else {
        setCode(starterCode);
      }
    }
  }

  const isLoading = isRunning || isTesting;

  return (
    <div className="flex flex-col h-full">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/60" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <span className="w-3 h-3 rounded-full bg-green-500/60" />
          <span className="text-xs text-gray-500 ml-2 font-mono">solution.cpp</span>
        </div>
        <div className="flex items-center gap-2">
          {passed && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-green-950 text-green-400 px-2 py-0.5 rounded-full border border-green-800/30">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
              Passed
            </span>
          )}
          {solutionCode && (
            <button
              onClick={handleShowSolution}
              className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                showSolution
                  ? "bg-yellow-950 text-yellow-400 border border-yellow-800/30"
                  : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
              }`}
            >
              {showSolution ? "Hide Solution" : "Solution"}
            </button>
          )}
          <button
            onClick={handleReset}
            className="text-[11px] text-gray-500 hover:text-gray-300 px-2.5 py-1 rounded-md hover:bg-gray-800 transition-colors font-medium"
            disabled={isLoading}
          >
            Reset
          </button>
          <button
            onClick={handleRun}
            disabled={isLoading || !code.trim()}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:opacity-40 transition-colors"
          >
            {isRunning ? (
              <>
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                Running...
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                Run
              </>
            )}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !code.trim()}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-500 disabled:opacity-40 transition-colors"
          >
            {isTesting ? (
              <>
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                Testing...
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Submit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0">
          <CodeEditor
            value={code}
            onChange={setCode}
            language="cpp"
            height="100%"
          />
        </div>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="h-1.5 bg-gray-900 border-y border-gray-700 cursor-row-resize hover:bg-gray-600 transition-colors shrink-0 flex items-center justify-center"
      >
        <div className="w-8 h-0.5 bg-gray-600 rounded-full" />
      </div>

      {/* Console / Test results panel */}
      <div style={{ height: consoleHeight }} className="flex flex-col shrink-0 bg-gray-950">
        {/* Console tabs */}
        <div className="flex items-center border-b border-gray-700 px-3 shrink-0">
          <button
            onClick={() => setActiveTab("console")}
            className={`px-3 py-1.5 text-[11px] font-semibold border-b-2 transition-colors ${
              activeTab === "console"
                ? "text-gray-100 border-yellow-500"
                : "text-gray-500 border-transparent hover:text-gray-300"
            }`}
          >
            Console
          </button>
          <button
            onClick={() => setActiveTab("tests")}
            className={`px-3 py-1.5 text-[11px] font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "tests"
                ? "text-gray-100 border-yellow-500"
                : "text-gray-500 border-transparent hover:text-gray-300"
            }`}
          >
            Tests
            {testResults.length > 0 && (
              <span
                className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${
                  testResults.every((r) => r.passed)
                    ? "bg-green-950 text-green-400"
                    : "bg-red-950 text-red-400"
                }`}
              >
                {testResults.filter((r) => r.passed).length}
              </span>
            )}
          </button>
          <div className="flex-1" />
          <button
            onClick={() => {
              setConsoleOutput([]);
              setTestResults([]);
            }}
            className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Console content */}
        <div ref={consoleRef} className="flex-1 overflow-auto p-3 font-mono text-xs">
          {activeTab === "console" && (
            <div className="space-y-1">
              {consoleOutput.length === 0 && (
                <p className="text-gray-600 italic">Click &quot;Run&quot; to execute your code, or &quot;Submit&quot; to run tests...</p>
              )}
              {consoleOutput.map((line) => (
                <pre
                  key={line.timestamp + line.text.slice(0, 20)}
                  className={`whitespace-pre-wrap break-all leading-relaxed ${
                    line.type === "stdout"
                      ? "text-gray-300"
                      : line.type === "stderr"
                        ? "text-yellow-400"
                        : line.type === "error"
                          ? "text-red-400"
                          : line.type === "success"
                            ? "text-green-400"
                            : "text-gray-500"
                  }`}
                >
                  {line.text}
                </pre>
              ))}
            </div>
          )}

          {activeTab === "tests" && (
            <div className="space-y-2">
              {testResults.length === 0 && consoleOutput.length === 0 && (
                <p className="text-gray-600 italic">Click &quot;Submit&quot; to run tests against your code...</p>
              )}
              {/* Show compile/runtime errors in tests tab too */}
              {consoleOutput
                .filter((o) => o.type === "error")
                .map((line) => (
                  <pre
                    key={line.timestamp}
                    className="whitespace-pre-wrap break-all text-red-400 leading-relaxed"
                  >
                    {line.text}
                  </pre>
                ))}
              {testResults.map((result, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 ${
                    result.passed
                      ? "bg-green-950/30 border-green-800/30"
                      : "bg-red-950/30 border-red-800/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        result.passed
                          ? "bg-green-900 text-green-400"
                          : "bg-red-900 text-red-400"
                      }`}
                    >
                      {result.passed ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      )}
                    </div>
                    <span className={`text-xs font-semibold ${result.passed ? "text-green-400" : "text-red-400"}`}>
                      {result.name}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      result.passed ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"
                    }`}>
                      {result.passed ? "PASS" : "FAIL"}
                    </span>
                  </div>
                  {!result.passed && (
                    <div className="mt-2 space-y-1 text-[11px]">
                      {result.expected && (
                        <div>
                          <span className="text-gray-500">Expected: </span>
                          <code className="text-green-400 bg-green-950/50 px-1.5 py-0.5 rounded">{result.expected}</code>
                        </div>
                      )}
                      {result.actual && (
                        <div>
                          <span className="text-gray-500">Got: </span>
                          <code className="text-red-400 bg-red-950/50 px-1.5 py-0.5 rounded">{result.actual}</code>
                        </div>
                      )}
                      {result.error && (
                        <div className="text-red-400 mt-1">{result.error}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { History, Loader2, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useEffect, useMemo, useState } from "react";

type Mode = "review" | "explain" | "fix";

type ReviewHistoryItem = {
  code: string;
  language: string;
  mode: Mode;
  result: string;
  timestamp: string;
};

const STORAGE_KEY = "codemind-review-history";
const MAX_HISTORY_ITEMS = 5;

const languages = ["Python", "JavaScript", "TypeScript", "Java", "C++"];

const modeLabel: Record<Mode, string> = {
  review: "Review Code",
  explain: "Explain Code",
  fix: "Fix Bug",
};

type ParsedReviewResult = {
  issues: string[];
  suggestions: string[];
  security: string[];
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseReviewResult = (rawResult: string): ParsedReviewResult | null => {
  const trimmed = rawResult.trim();
  if (!trimmed) {
    return null;
  }

  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>;

    return {
      issues: toStringArray(parsed.issues),
      suggestions: toStringArray(parsed.suggestions),
      security: toStringArray(parsed.security),
    };
  } catch {
    return null;
  }
};

export default function CodeReviewer() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("Python");
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ReviewHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as ReviewHistoryItem[];
      if (Array.isArray(parsed)) {
        setHistory(parsed.slice(0, MAX_HISTORY_ITEMS));
      }
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const historyCount = useMemo(() => history.length, [history]);

  const parsedReviewResult = useMemo(() => {
    if (activeMode !== "review") {
      return null;
    }

    return parseReviewResult(result);
  }, [activeMode, result]);

  const runReview = async (mode: Mode) => {
    setError("");
    setResult("");

    if (!code.trim()) {
      setError("Please enter some code before continuing.");
      return;
    }

    setActiveMode(mode);
    setIsLoading(true);
    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language,
          mode,
        }),
      });

      const data = (await response.json()) as {
        result?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong while contacting the API.");
      }

      const aiResult = data.result || "";
      setResult(aiResult);

      const newItem: ReviewHistoryItem = {
        code,
        language,
        mode,
        result: aiResult,
        timestamp: new Date().toISOString(),
      };

      setHistory((prev) => [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS));
      setIsHistoryOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const restoreHistoryItem = (item: ReviewHistoryItem) => {
    setCode(item.code);
    setLanguage(item.language);
    setActiveMode(item.mode);
    setResult(item.result);
    setError("");
    setIsHistoryOpen(false);
  };

  return (
    <section className="relative grid gap-4 md:grid-cols-[290px_minmax(0,1fr)]">
      <button
        type="button"
        className="md:hidden inline-flex items-center justify-center gap-2 rounded-[4px] border border-[#d8d8d8]/20 bg-[#0f172a] px-4 py-2 text-xs font-semibold uppercase tracking-[1px] text-gray-100"
        onClick={() => setIsHistoryOpen((prev) => !prev)}
      >
        <History className="h-4 w-4 text-[#3b89ff]" />
        History ({historyCount})
      </button>

      <aside
        className={`
          border border-[#d8d8d8]/20 bg-[#111827] p-4 shadow-[rgba(0,0,0,0)_0px_84px_24px,rgba(0,0,0,0.01)_0px_54px_22px,rgba(0,0,0,0.04)_0px_30px_18px,rgba(0,0,0,0.08)_0px_13px_13px,rgba(0,0,0,0.09)_0px_3px_7px]
          ${isHistoryOpen ? "block" : "hidden"} md:block
        `}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[12px] font-semibold uppercase tracking-[1.5px] text-gray-300">Recent Reviews</h2>
          <button
            type="button"
            onClick={clearHistory}
            className="inline-flex items-center gap-1 rounded-[4px] border border-[#d8d8d8]/25 px-2 py-1 text-[10px] font-semibold uppercase tracking-[1px] text-gray-300 transition hover:border-[#898989] hover:text-white"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>

        <div className="space-y-2">
          {history.length === 0 && (
            <p className="text-sm text-gray-400">No history yet. Your last 5 requests will appear here.</p>
          )}

          {history.map((item) => (
            <button
              key={`${item.timestamp}-${item.mode}`}
              type="button"
              onClick={() => restoreHistoryItem(item)}
              className="w-full rounded-[4px] border border-[#d8d8d8]/20 bg-[#0b1220] p-3 text-left transition hover:border-[#146ef5]"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[1px] text-[#3b89ff]">
                {modeLabel[item.mode]} • {item.language}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-gray-300">{item.code}</p>
              <p className="mt-2 text-[10px] text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
            </button>
          ))}
        </div>
      </aside>

      <div className="space-y-4">
        <div className="rounded-[6px] border border-[#d8d8d8]/20 bg-gray-900 p-4 shadow-[rgba(0,0,0,0)_0px_84px_24px,rgba(0,0,0,0.01)_0px_54px_22px,rgba(0,0,0,0.04)_0px_30px_18px,rgba(0,0,0,0.08)_0px_13px_13px,rgba(0,0,0,0.09)_0px_3px_7px]">
          <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[1.2px] text-gray-300" htmlFor="language">
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="mb-4 w-full rounded-[4px] border border-[#d8d8d8]/30 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:border-[#146ef5]"
          >
            {languages.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[1.2px] text-gray-300" htmlFor="code">
            Your Code
          </label>
          <textarea
            id="code"
            rows={12}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Paste your code here..."
            className="w-full rounded-[4px] border border-[#d8d8d8]/30 bg-gray-950 p-3 font-mono text-sm text-gray-100 outline-none focus:border-[#146ef5]"
          />

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => runReview("review")}
              disabled={isLoading}
              className="rounded-[4px] bg-[#00d722] px-4 py-2 text-sm font-semibold text-[#021807] transition hover:translate-x-[6px] hover:bg-[#2bf348] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Review Code
            </button>
            <button
              type="button"
              onClick={() => runReview("explain")}
              disabled={isLoading}
              className="rounded-[4px] bg-[#00d722] px-4 py-2 text-sm font-semibold text-[#021807] transition hover:translate-x-[6px] hover:bg-[#2bf348] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Explain Code
            </button>
            <button
              type="button"
              onClick={() => runReview("fix")}
              disabled={isLoading}
              className="rounded-[4px] bg-[#00d722] px-4 py-2 text-sm font-semibold text-[#021807] transition hover:translate-x-[6px] hover:bg-[#2bf348] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Fix Bug
            </button>
          </div>
        </div>

        <div className="rounded-[6px] border border-[#d8d8d8]/20 bg-gray-900 p-4 min-h-[220px]">
          <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[1.5px] text-gray-300">Result</h2>

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Loader2 className="h-4 w-4 animate-spin text-[#3b89ff]" />
              Processing your request...
            </div>
          )}

          {!isLoading && error && (
            <p className="rounded-[4px] border border-[#ee1d36]/40 bg-[#ee1d36]/10 p-3 text-sm text-[#ff6b7a]">
              {error}
            </p>
          )}

          {!isLoading && !error && !result && (
            <p className="text-sm text-gray-400">Run a review to see AI output here.</p>
          )}

          {!isLoading && !error && result && parsedReviewResult && (
            <div className="grid gap-3">
              <div className="rounded-[4px] border border-[#d8d8d8]/20 bg-[#0b1220] p-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#3b89ff]">Issues</h3>
                {parsedReviewResult.issues.length === 0 && <p className="mt-2 text-sm text-gray-400">No issues found.</p>}
                {parsedReviewResult.issues.length > 0 && (
                  <ul className="mt-2 space-y-2 text-sm text-gray-200 list-disc list-inside">
                    {parsedReviewResult.issues.map((item, index) => (
                      <li key={`issue-${index}`} className="break-words leading-6">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-[4px] border border-[#d8d8d8]/20 bg-[#0b1220] p-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#00d722]">Suggestions</h3>
                {parsedReviewResult.suggestions.length === 0 && (
                  <p className="mt-2 text-sm text-gray-400">No suggestions returned.</p>
                )}
                {parsedReviewResult.suggestions.length > 0 && (
                  <ul className="mt-2 space-y-2 text-sm text-gray-200 list-disc list-inside">
                    {parsedReviewResult.suggestions.map((item, index) => (
                      <li key={`suggestion-${index}`} className="break-words leading-6">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-[4px] border border-[#d8d8d8]/20 bg-[#0b1220] p-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#ffae13]">Security</h3>
                {parsedReviewResult.security.length === 0 && <p className="mt-2 text-sm text-gray-400">No security notes returned.</p>}
                {parsedReviewResult.security.length > 0 && (
                  <ul className="mt-2 space-y-2 text-sm text-gray-200 list-disc list-inside">
                    {parsedReviewResult.security.map((item, index) => (
                      <li key={`security-${index}`} className="break-words leading-6">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {!isLoading && !error && result && !parsedReviewResult && activeMode === "fix" && (
            <pre className="w-full overflow-x-auto whitespace-pre-wrap break-words rounded-[4px] border border-[#d8d8d8]/20 bg-[#0b1220] p-3 font-mono text-sm text-[#9bf8b1]">
              {result}
            </pre>
          )}

          {!isLoading && !error && result && !parsedReviewResult && activeMode === "explain" && (
            <div className="rounded-[4px] border border-[#d8d8d8]/20 bg-[#0b1220] p-3 text-sm leading-7 text-gray-100 whitespace-pre-wrap break-words">
              {result}
            </div>
          )}

          {!isLoading && !error && result && !parsedReviewResult && !activeMode && (
            <article className="prose prose-invert max-w-none break-words prose-p:whitespace-pre-wrap prose-pre:overflow-x-auto prose-pre:rounded-[4px] prose-pre:bg-gray-950 prose-code:text-[#9bf8b1]">
              <ReactMarkdown>{result}</ReactMarkdown>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}

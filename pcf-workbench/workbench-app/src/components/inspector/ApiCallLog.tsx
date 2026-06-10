import React, { useState, useRef, useEffect } from "react";
import { useLogStore, type ApiLogEntry } from "../../store/logStore";
import { useWorkbenchStore } from "../../store/workbenchStore";
import { Trash2, Download, Search, ChevronDown, ChevronRight } from "lucide-react";
import dayjs from "dayjs";

const METHOD_COLORS: Record<string, string> = {
  GET: "text-[#22c55e] bg-[#22c55e]/10",
  POST: "text-[#4f6ef7] bg-[#4f6ef7]/10",
  PATCH: "text-[#f59e0b] bg-[#f59e0b]/10",
  DELETE: "text-[#ef4444] bg-[#ef4444]/10",
  ACTION: "text-[#06b6d4] bg-[#06b6d4]/10",
  EXECUTE: "text-[#a855f7] bg-[#a855f7]/10",
};

export const ApiCallLog: React.FC = () => {
  const { apiLog, clearApiLog } = useLogStore();
  const { resetApiCallCount } = useWorkbenchStore();
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [apiLog, autoScroll]);

  const filtered = apiLog.filter((e) => {
    if (methodFilter !== "ALL" && e.method !== methodFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        e.entity.toLowerCase().includes(s) ||
        (e.options ?? "").toLowerCase().includes(s) ||
        e.method.toLowerCase().includes(s)
      );
    }
    return true;
  });

  function handleClear() {
    clearApiLog();
    resetApiCallCount();
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(apiLog, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `api-log-${dayjs().format("YYYYMMDD-HHmmss")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-wb-border shrink-0">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Search size={11} className="text-wb-muted shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter logs..."
            className="flex-1 bg-transparent text-wb-text text-xs outline-none placeholder:text-wb-muted"
          />
        </div>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="bg-wb-elevated border border-wb-border text-wb-text2 text-xs rounded px-2 py-1 outline-none"
        >
          {["ALL", "GET", "POST", "PATCH", "DELETE", "ACTION"].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <button onClick={handleExport} title="Export JSON" className="p-1 text-wb-muted hover:text-wb-text transition-colors">
          <Download size={13} />
        </button>
        <button onClick={handleClear} title="Clear log (Ctrl+Shift+C)" className="p-1 text-wb-muted hover:text-[#ef4444] transition-colors">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Log entries */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto font-mono text-[11px]"
        onMouseEnter={() => setAutoScroll(false)}
        onMouseLeave={() => setAutoScroll(true)}
      >
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-wb-muted text-xs">
            No API calls logged yet
          </div>
        ) : (
          filtered.map((entry) => (
            <ApiLogRow
              key={entry.id}
              entry={entry}
              expanded={expandedId === entry.id}
              onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

const ApiLogRow: React.FC<{ entry: ApiLogEntry; expanded: boolean; onToggle: () => void }> = ({
  entry, expanded, onToggle,
}) => {
  const methodColor = METHOD_COLORS[entry.method] ?? "text-wb-text2 bg-wb-elevated";

  return (
    <div className={`border-b border-[wb-bg2] ${expanded ? "bg-wb-bg2" : "hover:bg-wb-panel"}`}>
      <div
        className="flex items-center gap-2 px-3 py-1.5 cursor-pointer"
        onClick={onToggle}
      >
        <span className="text-wb-muted w-6 text-right shrink-0">{entry.sequence}</span>
        <span className="text-wb-muted shrink-0 w-20">{dayjs(entry.timestamp).format("HH:mm:ss.SSS")}</span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold shrink-0 ${methodColor}`}>
          {entry.method}
        </span>
        <span className="text-wb-text2 flex-1 truncate">{entry.entity}</span>
        {entry.options && (
          <span className="text-wb-muted max-w-[120px] truncate">{entry.options}</span>
        )}
        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] ${
          entry.status === "success" ? "text-[#22c55e] bg-[#22c55e]/10" :
          entry.status === "error" ? "text-[#ef4444] bg-[#ef4444]/10" :
          "text-[#f59e0b] bg-[#f59e0b]/10"
        }`}>
          {entry.status}
        </span>
        {entry.duration !== undefined && (
          <span className="text-wb-muted shrink-0 w-14 text-right">{entry.duration}ms</span>
        )}
        <span className="text-wb-muted shrink-0">
          {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </span>
      </div>
      {expanded && (
        <div className="px-3 pb-2 space-y-2">
          {entry.options && (
            <div>
              <div className="text-wb-muted text-[10px] mb-0.5">Options/Params</div>
              <pre className="text-wb-text2 text-[10px] bg-wb-bg p-2 rounded border border-wb-border overflow-auto max-h-24 whitespace-pre-wrap">
                {entry.options}
              </pre>
            </div>
          )}
          {entry.responseData !== undefined && (
            <div>
              <div className="text-wb-muted text-[10px] mb-0.5">Response ({entry.responseSize ?? 0} bytes)</div>
              <pre className="text-[#22c55e] text-[10px] bg-wb-bg p-2 rounded border border-wb-border overflow-auto max-h-32 whitespace-pre-wrap">
                {JSON.stringify(entry.responseData, null, 2)}
              </pre>
            </div>
          )}
          {!!entry.errorData && (
            <div>
              <div className="text-[#ef4444] text-[10px] mb-0.5">Error</div>
              <pre className="text-[#ef4444] text-[10px] bg-wb-bg p-2 rounded border border-[#ef4444]/20 overflow-auto max-h-24 whitespace-pre-wrap">
                {JSON.stringify(entry.errorData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

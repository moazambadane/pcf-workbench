import React, { useRef, useEffect, useState } from "react";
import { useLogStore, type ConsoleLevel } from "../../store/logStore";
import { Trash2, ChevronDown } from "lucide-react";
import dayjs from "dayjs";

const LEVEL_COLORS: Record<ConsoleLevel, string> = {
  log: "text-wb-text",
  info: "text-[#06b6d4]",
  warn: "text-[#f59e0b]",
  error: "text-[#ef4444]",
  debug: "text-wb-text2",
};

const LEVEL_BG: Record<ConsoleLevel, string> = {
  log: "",
  info: "bg-[#06b6d4]/5",
  warn: "bg-[#f59e0b]/5",
  error: "bg-[#ef4444]/5",
  debug: "bg-wb-elevated/30",
};

export const ConsolePanel: React.FC = () => {
  const { consoleLog, clearConsoleLog } = useLogStore();
  const [filter, setFilter] = useState<ConsoleLevel | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [consoleLog, autoScroll]);

  const filtered = consoleLog.filter(
    (e) => filter === "all" || e.level === filter
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-wb-border shrink-0">
        <div className="flex gap-1">
          {(["all", "log", "info", "warn", "error", "debug"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setFilter(l)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors capitalize
                ${filter === l ? "bg-wb-elevated text-wb-text" : "text-wb-muted hover:text-wb-text2"}`}
            >
              {l}
              {l !== "all" && (
                <span className="ml-1 text-wb-muted">
                  ({consoleLog.filter((e) => e.level === l).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={clearConsoleLog} title="Clear console" className="p-1 text-wb-muted hover:text-[#ef4444] transition-colors">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Entries */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto font-mono text-[11px]"
        onMouseEnter={() => setAutoScroll(false)}
        onMouseLeave={() => setAutoScroll(true)}
      >
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-wb-muted text-xs">
            No console output
          </div>
        ) : (
          filtered.map((entry) => (
            <div
              key={entry.id}
              className={`border-b border-[wb-bg2]/50 px-3 py-1 cursor-pointer hover:brightness-125 ${LEVEL_BG[entry.level]}`}
              onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            >
              <div className="flex items-start gap-2">
                <span className="text-wb-muted shrink-0 w-20">{dayjs(entry.timestamp).format("HH:mm:ss.SSS")}</span>
                <span className={`shrink-0 w-10 font-semibold uppercase text-[9px] ${LEVEL_COLORS[entry.level]}`}>
                  {entry.level}
                </span>
                <span className={`flex-1 ${LEVEL_COLORS[entry.level]} ${expandedId === entry.id ? "whitespace-pre-wrap" : "truncate"}`}>
                  {entry.args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ")}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

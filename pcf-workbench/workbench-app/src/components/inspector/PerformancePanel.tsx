import React from "react";
import { useLogStore } from "../../store/logStore";
import { Trash2 } from "lucide-react";
import dayjs from "dayjs";

export const PerformancePanel: React.FC = () => {
  const { performanceLog, apiLog, clearPerformanceLog } = useLogStore();

  const initEntries = performanceLog.filter((e) => e.type === "init");
  const uvEntries = performanceLog.filter((e) => e.type === "updateView");

  const avgUv = uvEntries.length > 0
    ? Math.round(uvEntries.reduce((sum, e) => sum + e.duration, 0) / uvEntries.length)
    : 0;

  const successCalls = apiLog.filter((e) => e.status === "success");
  const avgApiLatency = successCalls.length > 0
    ? Math.round(successCalls.reduce((sum, e) => sum + (e.duration ?? 0), 0) / successCalls.length)
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center px-3 py-2 border-b border-wb-border shrink-0">
        <span className="text-wb-text2 text-xs">Performance Metrics</span>
        <div className="flex-1" />
        <button onClick={clearPerformanceLog} className="p-1 text-wb-muted hover:text-[#ef4444] transition-colors">
          <Trash2 size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-2">
          <MetricCard label="Init Time" value={initEntries[initEntries.length - 1]?.duration ?? 0} unit="ms" color="#22c55e" />
          <MetricCard label="Avg updateView" value={avgUv} unit="ms" color="#4f6ef7" />
          <MetricCard label="updateView Count" value={uvEntries.length} unit="calls" color="#06b6d4" />
          <MetricCard label="API Avg Latency" value={avgApiLatency} unit="ms" color="#f59e0b" />
          <MetricCard label="API Success" value={successCalls.length} unit="calls" color="#22c55e" />
          <MetricCard label="API Errors" value={apiLog.filter(e => e.status === "error").length} unit="errors" color="#ef4444" />
        </div>

        {/* updateView timeline */}
        {uvEntries.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-wb-text2 uppercase tracking-wider mb-2">updateView Timeline</div>
            <MiniChart entries={uvEntries.map(e => e.duration)} />
          </div>
        )}

        {/* Recent entries */}
        <div>
          <div className="text-[11px] font-semibold text-wb-text2 uppercase tracking-wider mb-2">Recent Events</div>
          <div className="space-y-1">
            {performanceLog.slice(-20).reverse().map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 text-[11px] px-2 py-1 rounded bg-wb-bg border border-wb-border">
                <span className="text-wb-muted w-20 shrink-0">{dayjs(entry.timestamp).format("HH:mm:ss.SSS")}</span>
                <span className="text-wb-text2 flex-1">{entry.type}</span>
                <span className={`font-mono ${entry.duration > 100 ? "text-[#f59e0b]" : entry.duration > 500 ? "text-[#ef4444]" : "text-[#22c55e]"}`}>
                  {entry.duration}ms
                </span>
              </div>
            ))}
            {performanceLog.length === 0 && (
              <div className="text-center text-wb-muted text-xs py-4">No performance data yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: number; unit: string; color: string }> = ({ label, value, unit, color }) => (
  <div className="p-3 rounded bg-wb-bg border border-wb-border">
    <div className="text-[10px] text-wb-muted uppercase tracking-wider">{label}</div>
    <div className="flex items-baseline gap-1 mt-1">
      <span className="text-lg font-semibold font-mono" style={{ color }}>{value}</span>
      <span className="text-[10px] text-wb-muted">{unit}</span>
    </div>
  </div>
);

const MiniChart: React.FC<{ entries: number[] }> = ({ entries }) => {
  if (entries.length === 0) return null;
  const max = Math.max(...entries, 1);
  const last20 = entries.slice(-30);
  return (
    <div className="flex items-end gap-px h-16 bg-wb-bg border border-wb-border rounded px-2 py-1">
      {last20.map((val, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm min-w-[2px] transition-all"
          style={{
            height: `${Math.max(2, (val / max) * 100)}%`,
            background: val > 500 ? "#ef4444" : val > 100 ? "#f59e0b" : "#4f6ef7",
          }}
          title={`${val}ms`}
        />
      ))}
    </div>
  );
};

import { create } from "zustand";

export type ApiCallMethod = "GET" | "POST" | "PATCH" | "DELETE" | "ACTION" | "EXECUTE" | "FETCHXML";
export type ApiCallStatus = "pending" | "success" | "error";

export interface ApiLogEntry {
  id: string;
  sequence: number;
  timestamp: Date;
  method: ApiCallMethod;
  entity: string;
  options?: string;
  status: ApiCallStatus;
  duration?: number;
  requestData?: unknown;
  responseData?: unknown;
  errorData?: unknown;
  responseSize?: number;
}

export type ConsoleLevel = "log" | "info" | "warn" | "error" | "debug";

export interface ConsoleLogEntry {
  id: string;
  timestamp: Date;
  level: ConsoleLevel;
  args: unknown[];
}

export interface PerformanceEntry {
  id: string;
  timestamp: Date;
  type: "init" | "updateView" | "getOutputs" | "destroy";
  duration: number;
}

interface LogStoreState {
  apiLog: ApiLogEntry[];
  consoleLog: ConsoleLogEntry[];
  performanceLog: PerformanceEntry[];
  sequence: number;

  addApiCall: (entry: Omit<ApiLogEntry, "id" | "sequence" | "timestamp">) => string;
  updateApiCall: (id: string, update: Partial<ApiLogEntry>) => void;
  clearApiLog: () => void;

  addConsoleEntry: (level: ConsoleLevel, args: unknown[]) => void;
  clearConsoleLog: () => void;

  addPerformanceEntry: (type: PerformanceEntry["type"], duration: number) => void;
  clearPerformanceLog: () => void;

  clearAll: () => void;
}

let seq = 0;

export const useLogStore = create<LogStoreState>()((set) => ({
  apiLog: [],
  consoleLog: [],
  performanceLog: [],
  sequence: 0,

  addApiCall: (entry) => {
    const id = crypto.randomUUID();
    const sequence = ++seq;
    set((s) => ({
      apiLog: [
        ...s.apiLog,
        { ...entry, id, sequence, timestamp: new Date() },
      ],
    }));
    return id;
  },
  updateApiCall: (id, update) =>
    set((s) => ({
      apiLog: s.apiLog.map((e) => (e.id === id ? { ...e, ...update } : e)),
    })),
  clearApiLog: () => set({ apiLog: [] }),

  addConsoleEntry: (level, args) =>
    set((s) => ({
      consoleLog: [
        ...s.consoleLog,
        { id: crypto.randomUUID(), timestamp: new Date(), level, args },
      ],
    })),
  clearConsoleLog: () => set({ consoleLog: [] }),

  addPerformanceEntry: (type, duration) =>
    set((s) => ({
      performanceLog: [
        ...s.performanceLog,
        { id: crypto.randomUUID(), timestamp: new Date(), type, duration },
      ],
    })),
  clearPerformanceLog: () => set({ performanceLog: [] }),

  clearAll: () => set({ apiLog: [], consoleLog: [], performanceLog: [] }),
}));

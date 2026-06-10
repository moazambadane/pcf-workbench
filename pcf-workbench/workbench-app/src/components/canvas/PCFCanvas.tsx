import React, { useRef, useEffect, useCallback, useState } from "react";
import { useWorkbenchStore } from "../../store/workbenchStore";
import { useMockDataStore } from "../../store/mockDataStore";
import { useLogStore } from "../../store/logStore";
import { buildIframeSrcdoc } from "../../utils/scriptInjector";
import { createWebApiMock } from "../mock-engine/WebApiMock";
import { CANVAS_SIZE_PRESETS } from "../../types/pcf.types";
import type { IframeMessage } from "../../types/pcf.types";
import { AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export const PCFCanvas: React.FC = () => {
  const {
    loadedControl, canvasSize, customCanvasDimensions, canvasBg,
    propertyBag, canvasRefreshKey, mockSettings,
    setStatusMessage, setLastUpdated,
  } = useWorkbenchStore();

  const { entities, customActions, setEntityRecords, addRecord } = useMockDataStore();
  const { addConsoleEntry, addPerformanceEntry } = useLogStore();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webApiRef = useRef(
    createWebApiMock(
      () => useMockDataStore.getState().entities,
      (name, records) => useMockDataStore.getState().setEntityRecords(name, records),
      (name, record) => useMockDataStore.getState().addRecord(name, record),
      () => useMockDataStore.getState().customActions,
      () => useMockDataStore.getState().fetchXmlMocks
    )
  );

  // Rebuild webApi when store changes
  useEffect(() => {
    webApiRef.current = createWebApiMock(
      () => useMockDataStore.getState().entities,
      (name, records) => useMockDataStore.getState().setEntityRecords(name, records),
      (name, record) => useMockDataStore.getState().addRecord(name, record),
      () => useMockDataStore.getState().customActions,
      () => useMockDataStore.getState().fetchXmlMocks
    );
  }, [entities, customActions]);

  // Compute canvas dimensions
  const dimensions = (() => {
    if (canvasSize === "custom") return customCanvasDimensions;
    if (canvasSize === "full") return null;
    return CANVAS_SIZE_PRESETS[canvasSize];
  })();

  // Handle messages from iframe
  const handleMessage = useCallback((event: MessageEvent) => {
    const msg = event.data as IframeMessage & { event?: string; duration?: number };
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case "api_call": {
        // Route to host-side mock WebApi
        const { requestId, method, entity, options, data } = msg as {
          requestId: string; method: string; entity: string; options: string; data: unknown;
        };
        handleApiCall(requestId, method, entity, options, data);
        break;
      }
      case "console":
        addConsoleEntry(
          (msg.level as "log" | "info" | "warn" | "error" | "debug") ?? "log",
          msg.args ?? []
        );
        break;
      case "output_changed":
        if (msg.outputs) {
          useWorkbenchStore.getState().setPropertyBag({
            ...useWorkbenchStore.getState().propertyBag,
            ...msg.outputs,
          });
        }
        break;
      case "init_complete":
        setLoading(false);
        setError(null);
        setStatusMessage("Control initialized");
        setLastUpdated(new Date());
        break;
      case "error":
        setLoading(false);
        setError((msg as unknown as { message: string }).message ?? "Unknown error");
        setStatusMessage("Control error");
        break;
      case "perf" as string: {
        const perfMsg = msg as unknown as { event: string; duration: number };
        if (perfMsg.event === "init") addPerformanceEntry("init", perfMsg.duration);
        if (perfMsg.event === "updateView") addPerformanceEntry("updateView", perfMsg.duration);
        break;
      }
      case "http_mock_hit" as string: {
        const httpMsg = msg as unknown as { url: string; method: string; mockId: string; urlPattern: string };
        useLogStore.getState().addApiCall({
          method: httpMsg.method as "GET" | "POST" | "PATCH" | "DELETE" | "ACTION",
          entity: `HTTP Mock: ${httpMsg.urlPattern}`,
          options: httpMsg.url,
          status: "success",
          duration: 0,
          responseData: { mockId: httpMsg.mockId, intercepted: true },
        });
        break;
      }
    }
  }, [addConsoleEntry, addPerformanceEntry, setStatusMessage, setLastUpdated]);

  async function handleApiCall(
    requestId: string,
    method: string,
    entity: string,
    options: string,
    data: unknown
  ) {
    try {
      let result: unknown;
      const api = webApiRef.current;

      if (method === "retrieveMultipleRecords") {
        result = await api.retrieveMultipleRecords(entity, options);
      } else if (method === "retrieveRecord") {
        const d = data as { id: string; options?: string };
        result = await api.retrieveRecord(entity, d.id, d.options);
      } else if (method === "createRecord") {
        result = await api.createRecord(entity, data as object);
      } else if (method === "updateRecord") {
        const d = data as { id: string; data: object };
        result = await api.updateRecord(entity, d.id, d.data);
      } else if (method === "deleteRecord") {
        result = await api.deleteRecord(entity, (data as { id: string }).id);
      } else if (method === "execute" || method?.startsWith("navigation") || method?.startsWith("utility")) {
        result = await api.execute(data as Record<string, unknown>);
      } else {
        result = { success: true, message: `Mock: ${method}` };
      }

      iframeRef.current?.contentWindow?.postMessage(
        { type: "api_response", requestId, data: result }, "*"
      );
    } catch (err) {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: "api_response",
          requestId,
          error: { message: err instanceof Error ? err.message : String(err), errorCode: (err as { errorCode?: number }).errorCode ?? 500 },
        },
        "*"
      );
    }
  }

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // Reload iframe when control or refresh key changes
  useEffect(() => {
    if (!loadedControl) { setLoading(false); setError(null); return; }
    setLoading(true);
    setError(null);
    // srcdoc update happens via render
  }, [loadedControl, canvasRefreshKey, mockSettings]);

  if (!loadedControl) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-wb-muted">
        <div className="w-20 h-20 rounded-2xl bg-wb-bg2 border-2 border-dashed border-wb-border flex items-center justify-center">
          <span className="text-3xl">📦</span>
        </div>
        <div className="text-center">
          <div className="text-wb-text2 font-medium">No PCF Control Loaded</div>
          <div className="text-sm text-wb-muted mt-1">Drop files here or use the Load Control panel</div>
          <div className="text-xs text-[#444] mt-2">
            <kbd className="text-[#4f6ef7] font-mono">Ctrl+L</kbd> to open loader
          </div>
        </div>
      </div>
    );
  }

  const srcdoc = buildIframeSrcdoc({
    manifest: loadedControl.manifest,
    bundleContent: loadedControl.bundleContent,
    cssContents: loadedControl.cssContents ?? [],
    canvasBackground: canvasBg,
    propertyBagJson: JSON.stringify(propertyBag),
    allocatedWidth: dimensions?.width ?? 1280,
    allocatedHeight: dimensions?.height ?? 800,
  });

  return (
    <div className="flex items-center justify-center w-full h-full p-4 overflow-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative shadow-2xl rounded-lg overflow-hidden border border-wb-border"
        style={{
          width: dimensions ? dimensions.width : "100%",
          height: dimensions ? dimensions.height : "100%",
          minWidth: 200,
          minHeight: 150,
        }}
      >
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-wb-bg/80">
            <Loader2 size={24} className="text-[#4f6ef7] animate-spin" />
          </div>
        )}

        {/* Error overlay */}
        {error && !loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-wb-bg/95 p-6">
            <AlertTriangle size={32} className="text-[#ef4444] mb-3" />
            <div className="text-sm text-[#ef4444] font-semibold mb-2">Control Error</div>
            <div className="text-xs text-wb-text2 text-center max-w-sm font-mono bg-wb-bg2 p-3 rounded border border-wb-border max-h-40 overflow-auto">
              {error}
            </div>
            <button
              onClick={() => { setError(null); useWorkbenchStore.getState().refreshCanvas(); }}
              className="mt-3 px-4 py-1.5 rounded bg-[#4f6ef7] text-white text-xs hover:bg-[#3b5ce5] transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <iframe
          key={canvasRefreshKey}
          ref={iframeRef}
          srcDoc={srcdoc}
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
          title="PCF Control Sandbox"
          onLoad={() => {
            // Give the iframe time to execute scripts before showing
            setTimeout(() => setLoading(false), 500);
          }}
        />
      </motion.div>
    </div>
  );
};

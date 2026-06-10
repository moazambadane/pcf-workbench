import React, { useState } from "react";
import { RefreshCw, Maximize2, Monitor, Smartphone, Tablet, ChevronDown } from "lucide-react";
import { useWorkbenchStore, type CanvasSize } from "../../store/workbenchStore";
import { CANVAS_SIZE_PRESETS } from "../../types/pcf.types";

const SIZE_OPTIONS: { value: CanvasSize; label: string; icon?: React.ReactNode }[] = [
  { value: "phone", label: "Phone (375px)", icon: <Smartphone size={12} /> },
  { value: "tablet", label: "Tablet (768px)", icon: <Tablet size={12} /> },
  { value: "small", label: "Small (480px)" },
  { value: "desktop", label: "Desktop (1280px)", icon: <Monitor size={12} /> },
  { value: "full", label: "Full Width (100%)" },
  { value: "custom", label: "Custom..." },
];

export const TopBar: React.FC = () => {
  const {
    loadedControl, canvasSize, setCanvasSize, refreshCanvas,
    customCanvasDimensions, setCustomCanvasDimensions,
  } = useWorkbenchStore();
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customW, setCustomW] = useState(String(customCanvasDimensions.width));
  const [customH, setCustomH] = useState(String(customCanvasDimensions.height));

  const currentLabel = SIZE_OPTIONS.find((o) => o.value === canvasSize)?.label ?? canvasSize;

  function handleSizeSelect(size: CanvasSize) {
    setShowSizeMenu(false);
    if (size === "custom") { setShowCustomModal(true); return; }
    setCanvasSize(size);
  }

  function handleCustomApply() {
    const w = parseInt(customW, 10);
    const h = parseInt(customH, 10);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      setCustomCanvasDimensions({ width: w, height: h });
      setCanvasSize("custom");
      setShowCustomModal(false);
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 h-11 bg-wb-bg2 border-b border-wb-border shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-wb-muted text-xs">Canvas</span>
        <span className="text-[wb-border] text-xs">/</span>
        <span className="text-wb-text text-xs font-medium truncate">
          {loadedControl
            ? `${loadedControl.manifest.namespace}.${loadedControl.manifest.constructor}`
            : "No Control Loaded"}
        </span>
        {loadedControl && (
          <>
            <span className="text-[wb-border] text-xs">/</span>
            <span className="text-wb-muted text-xs">v{loadedControl.manifest.version}</span>
          </>
        )}
      </div>

      {/* Canvas Size Selector */}
      <div className="relative">
        <button
          onClick={() => setShowSizeMenu(!showSizeMenu)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-wb-elevated border border-wb-border text-wb-text2 hover:text-wb-text hover:border-wb-border2 text-xs transition-colors"
        >
          <Monitor size={12} />
          <span>{currentLabel}</span>
          <ChevronDown size={10} />
        </button>
        {showSizeMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowSizeMenu(false)} />
            <div className="absolute right-0 top-full mt-1 w-44 bg-wb-elevated border border-wb-border rounded shadow-xl z-50 py-1">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSizeSelect(opt.value)}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors
                    ${canvasSize === opt.value ? "text-[#4f6ef7] bg-[#4f6ef7]/10" : "text-wb-text2 hover:text-wb-text hover:bg-[wb-border]"}`}
                >
                  {opt.icon && <span>{opt.icon}</span>}
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Refresh */}
      <button
        onClick={refreshCanvas}
        title="Refresh Canvas (Ctrl+R)"
        className="p-1.5 rounded text-wb-text2 hover:text-wb-text hover:bg-wb-elevated transition-colors"
      >
        <RefreshCw size={14} />
      </button>

      {/* Fullscreen placeholder */}
      <button
        title="Fullscreen"
        className="p-1.5 rounded text-wb-text2 hover:text-wb-text hover:bg-wb-elevated transition-colors"
        onClick={() => {
          const el = document.getElementById("pcf-canvas-wrapper");
          if (el) el.requestFullscreen?.();
        }}
      >
        <Maximize2 size={14} />
      </button>

      {/* Custom size modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-wb-bg2 border border-wb-border rounded-lg p-6 w-72">
            <h3 className="text-wb-text font-semibold mb-4">Custom Canvas Size</h3>
            <div className="space-y-3">
              <div>
                <label className="text-wb-text2 text-xs block mb-1">Width (px)</label>
                <input value={customW} onChange={(e) => setCustomW(e.target.value)} type="number" min="100"
                  className="w-full px-3 py-2 rounded bg-wb-elevated border border-wb-border text-wb-text text-sm focus:border-[#4f6ef7] outline-none" />
              </div>
              <div>
                <label className="text-wb-text2 text-xs block mb-1">Height (px)</label>
                <input value={customH} onChange={(e) => setCustomH(e.target.value)} type="number" min="100"
                  className="w-full px-3 py-2 rounded bg-wb-elevated border border-wb-border text-wb-text text-sm focus:border-[#4f6ef7] outline-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowCustomModal(false)}
                className="flex-1 px-3 py-2 rounded bg-wb-elevated text-wb-text2 hover:text-wb-text text-sm transition-colors">Cancel</button>
              <button onClick={handleCustomApply}
                className="flex-1 px-3 py-2 rounded bg-[#4f6ef7] text-white hover:bg-[#3b5ce5] text-sm transition-colors">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

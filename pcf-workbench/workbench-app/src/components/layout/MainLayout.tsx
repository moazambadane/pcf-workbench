import React, { useEffect, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from "react-resizable-panels";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { StatusBar } from "./StatusBar";
import { PCFCanvas } from "../canvas/PCFCanvas";
import { PCFLoader } from "../loader/PCFLoader";
import { MockConfigPanel } from "../mock-config/MockConfigPanel";
import { PropertyInspector } from "../inspector/PropertyInspector";
import { ApiCallLog } from "../inspector/ApiCallLog";
import { ConsolePanel } from "../inspector/ConsolePanel";
import { PerformancePanel } from "../inspector/PerformancePanel";
import { SettingsPanel } from "../settings/SettingsPanel";
import { useWorkbenchStore, type BottomTab } from "../../store/workbenchStore";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";

export const MainLayout: React.FC = () => {
  const {
    activePanel, bottomTab, rightTab, setRightTab,
    bottomPanelCollapsed, setBottomPanelCollapsed,
    setBottomTab, setActivePanel, loadedControl,
  } = useWorkbenchStore();

  const leftPanelRef  = useRef<ImperativePanelHandle>(null);
  const rightPanelRef = useRef<ImperativePanelHandle>(null);
  const bottomPanelRef = useRef<ImperativePanelHandle>(null);
  const [leftCollapsed,  setLeftCollapsed]  = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [bottomCollapsed, setBottomCollapsed] = useState(false);

  // When sidebar items for bottom/right panels are clicked, route them
  const prevActivePanel = useRef(activePanel);
  useEffect(() => {
    if (activePanel === prevActivePanel.current) return;
    prevActivePanel.current = activePanel;

    const bottomTabs: BottomTab[] = ["api-log", "console", "performance"];
    if (bottomTabs.includes(activePanel as BottomTab)) {
      setBottomTab(activePanel as BottomTab);
      bottomPanelRef.current?.expand();
      return;
    }
    if (activePanel === "property-bag") {
      setRightTab("properties");
      rightPanelRef.current?.expand();
      setRightCollapsed(false);
      return;
    }
  }, [activePanel, setBottomTab, setRightTab]);

  function toggleLeft() {
    if (leftCollapsed) { leftPanelRef.current?.expand(); setLeftCollapsed(false); }
    else               { leftPanelRef.current?.collapse(); setLeftCollapsed(true); }
  }

  function toggleRight() {
    if (rightCollapsed) { rightPanelRef.current?.expand(); setRightCollapsed(false); }
    else                { rightPanelRef.current?.collapse(); setRightCollapsed(true); }
  }

  function toggleBottom() {
    if (bottomCollapsed) { bottomPanelRef.current?.expand(); setBottomCollapsed(false); }
    else                 { bottomPanelRef.current?.collapse(); setBottomCollapsed(true); }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "l") { e.preventDefault(); useWorkbenchStore.getState().setActivePanel("load"); }
      if (e.ctrlKey && e.key === "r") { e.preventDefault(); useWorkbenchStore.getState().refreshCanvas(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const leftPanelContent = () => {
    switch (activePanel) {
      case "load":        return <PCFLoader />;
      case "mock-config": return <MockConfigPanel />;
      case "settings":    return <SettingsPanel />;
      default:            return <PCFLoader />;
    }
  };

  const rightPanelContent = () => {
    switch (rightTab) {
      case "properties": return <PropertyInspector />;
      case "inspector":  return <PropertyInspector showInspector />;
      case "manifest":   return <ManifestPanel />;
      default:           return <PropertyInspector />;
    }
  };

  const bottomPanelContent = () => {
    switch (bottomTab) {
      case "api-log":     return <ApiCallLog />;
      case "console":     return <ConsolePanel />;
      case "performance": return <PerformancePanel />;
      default:            return <ApiCallLog />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-wb-bg text-wb-text">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex flex-1 overflow-hidden">
          <PanelGroup direction="horizontal" autoSaveId="main-layout">

            {/* ── Left Panel ── */}
            <Panel ref={leftPanelRef} defaultSize={22} minSize={18} maxSize={40}
              collapsible onCollapse={() => setLeftCollapsed(true)} onExpand={() => setLeftCollapsed(false)}>
              <div className="flex flex-col h-full bg-wb-panel border-r border-wb-border overflow-hidden">
                {!leftCollapsed && leftPanelContent()}
              </div>
            </Panel>

            {/* Left resize / collapse handle */}
            <div className="relative flex items-center">
              <PanelResizeHandle className="w-1 h-full bg-wb-border hover:bg-[#4f6ef7] transition-colors cursor-col-resize" />
              <button
                onClick={toggleLeft}
                title={leftCollapsed ? "Expand panel" : "Collapse panel"}
                className="absolute left-1/2 -translate-x-1/2 z-10 w-4 h-8 flex items-center justify-center rounded bg-wb-elevated border border-wb-border text-wb-muted hover:text-[#4f6ef7] hover:border-[#4f6ef7] transition-colors shadow-sm"
              >
                {leftCollapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
              </button>
            </div>

            {/* ── Center + Bottom ── */}
            <Panel defaultSize={55} minSize={30}>
              <PanelGroup direction="vertical" autoSaveId="center-layout">
                <Panel defaultSize={70} minSize={30}>
                  <div className="flex flex-col h-full">
                    <TopBar />
                    <div id="pcf-canvas-wrapper" className="flex-1 overflow-auto bg-wb-bg">
                      <PCFCanvas />
                    </div>
                  </div>
                </Panel>

                <div className="relative flex justify-center">
                  <PanelResizeHandle className="h-1 w-full bg-wb-border hover:bg-[#4f6ef7] transition-colors cursor-row-resize" />
                  <button
                    onClick={toggleBottom}
                    title={bottomCollapsed ? "Expand panel" : "Collapse panel"}
                    className="absolute top-1/2 -translate-y-1/2 z-10 h-4 w-8 flex items-center justify-center rounded bg-wb-elevated border border-wb-border text-wb-muted hover:text-[#4f6ef7] hover:border-[#4f6ef7] transition-colors shadow-sm"
                  >
                    {bottomCollapsed ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  </button>
                </div>

                <Panel ref={bottomPanelRef} defaultSize={30} minSize={15} maxSize={60}
                  collapsible onCollapse={() => { setBottomPanelCollapsed(true); setBottomCollapsed(true); }} onExpand={() => { setBottomPanelCollapsed(false); setBottomCollapsed(false); }}>
                  <div className="flex flex-col h-full bg-wb-panel border-t border-wb-border">
                    <BottomTabs tab={bottomTab} setTab={setBottomTab} onCollapse={() => setBottomPanelCollapsed(!bottomPanelCollapsed)} />
                    <div className="flex-1 overflow-hidden">
                      {bottomPanelContent()}
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
            </Panel>

            {/* Right resize / collapse handle */}
            <div className="relative flex items-center">
              <PanelResizeHandle className="w-1 h-full bg-wb-border hover:bg-[#4f6ef7] transition-colors cursor-col-resize" />
              <button
                onClick={toggleRight}
                title={rightCollapsed ? "Expand panel" : "Collapse panel"}
                className="absolute left-1/2 -translate-x-1/2 z-10 w-4 h-8 flex items-center justify-center rounded bg-wb-elevated border border-wb-border text-wb-muted hover:text-[#4f6ef7] hover:border-[#4f6ef7] transition-colors shadow-sm"
              >
                {rightCollapsed ? <ChevronLeft size={11} /> : <ChevronRight size={11} />}
              </button>
            </div>

            {/* ── Right Panel ── */}
            <Panel ref={rightPanelRef} defaultSize={23} minSize={18} maxSize={40}
              collapsible onCollapse={() => setRightCollapsed(true)} onExpand={() => setRightCollapsed(false)}>
              <div className="flex flex-col h-full bg-wb-panel border-l border-wb-border overflow-hidden">
                {!rightCollapsed && (
                  <>
                    <RightTabs tab={rightTab} setTab={setRightTab} />
                    <div className="flex-1 overflow-hidden">
                      {rightPanelContent()}
                    </div>
                  </>
                )}
              </div>
            </Panel>

          </PanelGroup>
        </div>
      </div>
      <StatusBar />
    </div>
  );
};

const BottomTabs: React.FC<{ tab: string; setTab: (t: "api-log" | "console" | "performance") => void; onCollapse: () => void }> = ({ tab, setTab }) => (
  <div className="flex items-center border-b border-wb-border px-3 h-9 shrink-0">
    {[
      { id: "api-log",     label: "API Log" },
      { id: "console",     label: "Console" },
      { id: "performance", label: "Performance" },
    ].map((t) => (
      <button key={t.id} onClick={() => setTab(t.id as "api-log" | "console" | "performance")}
        className={`px-3 py-1.5 text-xs mr-1 rounded-t transition-colors ${tab === t.id ? "text-[#4f6ef7] border-b-2 border-[#4f6ef7]" : "text-wb-text2 hover:text-wb-text"}`}>
        {t.label}
      </button>
    ))}
  </div>
);

const RightTabs: React.FC<{ tab: string; setTab: (t: "properties" | "inspector" | "manifest") => void }> = ({ tab, setTab }) => (
  <div className="flex items-center border-b border-wb-border px-3 h-9 shrink-0">
    {[
      { id: "properties", label: "Properties" },
      { id: "inspector",  label: "Inspector" },
      { id: "manifest",   label: "Manifest" },
    ].map((t) => (
      <button key={t.id} onClick={() => setTab(t.id as "properties" | "inspector" | "manifest")}
        className={`px-3 py-1.5 text-xs mr-1 rounded-t transition-colors ${tab === t.id ? "text-[#4f6ef7] border-b-2 border-[#4f6ef7]" : "text-wb-text2 hover:text-wb-text"}`}>
        {t.label}
      </button>
    ))}
  </div>
);

const ManifestPanel: React.FC = () => {
  const { loadedControl } = useWorkbenchStore();
  if (!loadedControl) return <EmptyState text="No control loaded" />;
  const m = loadedControl.manifest;
  return (
    <div className="p-4 overflow-y-auto h-full space-y-4 text-xs">
      <Section title="Control Info">
        <Row label="Namespace"    value={m.namespace} />
        <Row label="Constructor"  value={m.constructor} />
        <Row label="Version"      value={m.version} />
        <Row label="Type"         value={m.controlType} />
        <Row label="Display Name" value={m.displayName} />
      </Section>
      <Section title={`Properties (${m.properties.length})`}>
        {m.properties.map((p) => (
          <div key={p.name} className="mb-2 p-2 rounded bg-wb-bg border border-wb-border">
            <div className="flex items-center gap-2">
              <span className="text-wb-text font-medium">{p.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#4f6ef7]/20 text-[#4f6ef7]">{p.ofType}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-wb-elevated text-wb-text2">{p.type}</span>
              {p.required && <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#ef4444]/20 text-[#ef4444]">required</span>}
            </div>
          </div>
        ))}
      </Section>
      <Section title={`Features (${m.features.length})`}>
        {m.features.map((f) => <Row key={f} label="" value={f} />)}
      </Section>
    </div>
  );
};

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center justify-center h-full text-wb-muted text-xs">{text}</div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <div className="text-[11px] font-semibold text-wb-text2 uppercase tracking-wider mb-2">{title}</div>
    {children}
  </div>
);

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex gap-2 py-0.5">
    {label && <span className="text-wb-muted w-28 shrink-0">{label}:</span>}
    <span className="text-wb-text font-mono">{value}</span>
  </div>
);
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, Settings2, Activity, Terminal, Zap, Database,
  ChevronLeft, ChevronRight, FileJson, Monitor,
  BarChart2, Sliders
} from "lucide-react";
import { useWorkbenchStore, type ActivePanel } from "../../store/workbenchStore";

interface NavItem {
  id: ActivePanel;
  label: string;
  icon: React.ReactNode;
}

const workspaceItems: NavItem[] = [
  { id: "load", label: "Load Control", icon: <FolderOpen size={16} /> },
  { id: "mock-config", label: "Mock Config", icon: <Database size={16} /> },
  { id: "property-bag", label: "Property Bag", icon: <FileJson size={16} /> },
];

const toolItems: NavItem[] = [
  { id: "api-log", label: "API Log", icon: <Activity size={16} /> },
  { id: "console", label: "Console", icon: <Terminal size={16} /> },
  { id: "performance", label: "Performance", icon: <BarChart2 size={16} /> },
];

const settingItems: NavItem[] = [
  { id: "settings", label: "Settings", icon: <Sliders size={16} /> },
];

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, setSidebarCollapsed, activePanel, setActivePanel } =
    useWorkbenchStore();

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 52 : 260 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex flex-col h-full bg-wb-panel border-r border-wb-border overflow-hidden select-none shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-wb-border min-h-[52px]">
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <img src="/pcf-logo.svg" alt="PCF" className="w-7 h-7 rounded shrink-0" />
              <div className="overflow-hidden">
                <div className="text-[13px] font-semibold text-wb-text whitespace-nowrap">
                  PCF Workbench
                </div>
                <div className="text-[10px] text-wb-muted whitespace-nowrap">v1.0.0</div>
                <div className="text-[9px] text-wb-muted whitespace-nowrap">
                  By : <a
                    href="https://www.linkedin.com/in/moazam-badane-b5a2b47a/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-wb-muted hover:text-[#4f6ef7] transition-colors"
                  >Moazam Badane</a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1 rounded text-wb-text2 hover:text-wb-text hover:bg-wb-elevated transition-colors shrink-0"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-2">
        <NavSection label="WORKSPACE" items={workspaceItems} collapsed={sidebarCollapsed} activePanel={activePanel} onSelect={setActivePanel} />
        <NavSection label="TOOLS" items={toolItems} collapsed={sidebarCollapsed} activePanel={activePanel} onSelect={setActivePanel} />
        <NavSection label="SETTINGS" items={settingItems} collapsed={sidebarCollapsed} activePanel={activePanel} onSelect={setActivePanel} />
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-wb-border">
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] text-wb-muted text-center"
            >
              Power Apps Component Framework Emulator
            </motion.div>
          )}
        </AnimatePresence>
        {sidebarCollapsed && (
          <div className="flex justify-center">
            <Monitor size={14} className="text-wb-muted" />
          </div>
        )}
      </div>
    </motion.aside>
  );
};

interface NavSectionProps {
  label: string;
  items: NavItem[];
  collapsed: boolean;
  activePanel: ActivePanel;
  onSelect: (id: ActivePanel) => void;
}

const NavSection: React.FC<NavSectionProps> = ({ label, items, collapsed, activePanel, onSelect }) => (
  <div className="mb-1">
    <AnimatePresence>
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="px-3 py-1 text-[10px] font-semibold tracking-widest text-wb-muted uppercase"
        >
          {label}
        </motion.div>
      )}
    </AnimatePresence>
    {items.map((item) => (
      <button
        key={item.id}
        onClick={() => onSelect(item.id)}
        title={collapsed ? item.label : undefined}
        className={`
          w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors
          ${activePanel === item.id
            ? "bg-[#4f6ef7]/15 text-[#4f6ef7] border-r-2 border-[#4f6ef7]"
            : "text-wb-text2 hover:text-wb-text hover:bg-wb-elevated"
          }
        `}
      >
        <span className="shrink-0">{item.icon}</span>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    ))}
  </div>
);

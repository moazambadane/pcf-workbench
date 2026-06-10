import React from "react";
import { useWorkbenchStore, type Theme } from "../../store/workbenchStore";

export const SettingsPanel: React.FC = () => {
  const { theme, setTheme, mockSettings, setMockSettings, canvasBg, setCanvasBg } = useWorkbenchStore();

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-6">
      <SectionHeader title="Appearance" />

      <SettingRow label="Theme">
        <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)}
          className="input-select">
          <optgroup label="Light Themes">
            <option value="light">Light</option>
            <option value="rose">Rose</option>
            <option value="ocean">Ocean</option>
            <option value="sage">Sage</option>
            <option value="lavender">Lavender</option>
            <option value="sand">Sand</option>
            <option value="solarized">Solarized</option>
          </optgroup>
          <optgroup label="Dark Themes">
            <option value="dark">Dark</option>
            <option value="nord">Nord</option>
            <option value="midnight">Midnight</option>
          </optgroup>
        </select>
      </SettingRow>

      <SettingRow label="Canvas Background">
        <div className="flex items-center gap-2">
          <input type="color" value={canvasBg} onChange={(e) => setCanvasBg(e.target.value)}
            className="w-8 h-7 rounded cursor-pointer bg-transparent border border-wb-border" />
          <input value={canvasBg} onChange={(e) => setCanvasBg(e.target.value)}
            className="input-text flex-1" />
        </div>
        <div className="flex gap-1 mt-1">
          {["#ffffff", "#f8f8f8", "#e5e5e5", "transparent", "wb-bg"].map((c) => (
            <button key={c} onClick={() => setCanvasBg(c)}
              style={{ background: c === "transparent" ? undefined : c }}
              className={`w-6 h-6 rounded border text-xs ${canvasBg === c ? "border-[#4f6ef7]" : "border-wb-border"} ${c === "transparent" ? "bg-wb-elevated text-wb-text2" : ""}`}>
              {c === "transparent" ? "T" : ""}
            </button>
          ))}
        </div>
      </SettingRow>

      <SectionHeader title="Mock API Settings" />

      <SettingRow label="Default Delay (ms)">
        <input type="range" min={0} max={2000} step={50} value={mockSettings.defaultDelay}
          onChange={(e) => setMockSettings({ defaultDelay: parseInt(e.target.value, 10) })}
          className="w-full accent-[#4f6ef7]" />
        <span className="text-wb-text2 text-xs">{mockSettings.defaultDelay}ms</span>
      </SettingRow>

      <SettingRow label="Error Rate">
        <input type="range" min={0} max={1} step={0.01} value={mockSettings.errorRate}
          onChange={(e) => setMockSettings({ errorRate: parseFloat(e.target.value) })}
          className="w-full accent-[#ef4444]" />
        <span className="text-wb-text2 text-xs">{Math.round(mockSettings.errorRate * 100)}%</span>
      </SettingRow>

      <SettingRow label="Offline Mode">
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setMockSettings({ isOffline: !mockSettings.isOffline })}
            className={`w-10 h-5 rounded-full transition-colors relative ${mockSettings.isOffline ? "bg-[#f59e0b]" : "bg-[wb-border]"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${mockSettings.isOffline ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
          <span className="text-wb-text2 text-xs">{mockSettings.isOffline ? "Offline" : "Online"}</span>
        </label>
      </SettingRow>

      <SectionHeader title="Environment" />

      <SettingRow label="Organization Name">
        <input value={mockSettings.organizationName}
          onChange={(e) => setMockSettings({ organizationName: e.target.value })}
          className="input-text" />
      </SettingRow>

      <SettingRow label="User Name">
        <input value={mockSettings.userName}
          onChange={(e) => setMockSettings({ userName: e.target.value })}
          className="input-text" />
      </SettingRow>

      <SettingRow label="User ID">
        <input value={mockSettings.userId}
          onChange={(e) => setMockSettings({ userId: e.target.value })}
          className="input-text font-mono text-xs" />
      </SettingRow>

      <SettingRow label="Language ID">
        <input type="number" value={mockSettings.languageId}
          onChange={(e) => setMockSettings({ languageId: parseInt(e.target.value, 10) })}
          className="input-text" />
      </SettingRow>
    </div>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="text-[11px] font-semibold text-wb-text2 uppercase tracking-wider border-b border-wb-border pb-1">{title}</div>
);

const SettingRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs text-wb-text2 mb-1">{label}</label>
    {children}
  </div>
);

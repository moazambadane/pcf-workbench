import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LoadedPCFControl, CanvasSize, CanvasDimensions, PropertyBag } from "../types/pcf.types";
export type { CanvasSize };
import type { MockSettings } from "../types/mock.types";

export type Theme = "dark" | "light" | "nord" | "solarized" | "midnight" | "rose" | "ocean" | "sage" | "lavender" | "sand";
export type ActivePanel = "load" | "mock-config" | "property-bag" | "api-log" | "console" | "performance" | "settings";
export type BottomTab = "api-log" | "console" | "performance";
export type RightTab = "properties" | "inspector" | "manifest";

interface WorkbenchState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Loaded control
  loadedControl: LoadedPCFControl | null;
  setLoadedControl: (control: LoadedPCFControl | null) => void;

  // Property bag (current values)
  propertyBag: PropertyBag;
  setPropertyBag: (bag: PropertyBag) => void;
  updateProperty: (name: string, raw: unknown, formatted?: string) => void;

  // Canvas
  canvasSize: CanvasSize;
  setCanvasSize: (size: CanvasSize) => void;
  customCanvasDimensions: CanvasDimensions;
  setCustomCanvasDimensions: (dim: CanvasDimensions) => void;
  canvasBg: string;
  setCanvasBg: (bg: string) => void;

  // UI state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  rightPanelCollapsed: boolean;
  setRightPanelCollapsed: (v: boolean) => void;
  bottomPanelCollapsed: boolean;
  setBottomPanelCollapsed: (v: boolean) => void;
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;
  bottomTab: BottomTab;
  setBottomTab: (tab: BottomTab) => void;
  rightTab: RightTab;
  setRightTab: (tab: RightTab) => void;

  // Settings
  mockSettings: MockSettings;
  setMockSettings: (settings: Partial<MockSettings>) => void;

  // Canvas refresh trigger
  canvasRefreshKey: number;
  refreshCanvas: () => void;

  // Status
  statusMessage: string;
  setStatusMessage: (msg: string) => void;
  apiCallCount: number;
  incrementApiCallCount: () => void;
  resetApiCallCount: () => void;
  lastUpdated: Date | null;
  setLastUpdated: (d: Date) => void;
}

const DEFAULT_MOCK_SETTINGS: MockSettings = {
  defaultDelay: 100,
  errorRate: 0,
  isOffline: false,
  userId: "{00000000-0000-0000-0000-000000000001}",
  userName: "Developer User",
  organizationName: "Mock Dynamics Org",
  languageId: 1033,
};

export const useWorkbenchStore = create<WorkbenchState>()(
  persist(
    (set) => ({
      theme: "light",
      setTheme: (theme) => set({ theme }),

      loadedControl: null,
      setLoadedControl: (control) => set({ loadedControl: control, lastUpdated: control ? new Date() : null }),

      propertyBag: {},
      setPropertyBag: (bag) => set({ propertyBag: bag }),
      updateProperty: (name, raw, formatted) =>
        set((s) => ({
          propertyBag: {
            ...s.propertyBag,
            [name]: { ...s.propertyBag[name], raw: raw as string | number | boolean | null | undefined, formatted },
          },
        })),

      canvasSize: "desktop",
      setCanvasSize: (size) => set({ canvasSize: size }),
      customCanvasDimensions: { width: 800, height: 600 },
      setCustomCanvasDimensions: (dim) => set({ customCanvasDimensions: dim }),
      canvasBg: "#ffffff",
      setCanvasBg: (bg) => set({ canvasBg: bg }),

      sidebarCollapsed: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      rightPanelCollapsed: false,
      setRightPanelCollapsed: (v) => set({ rightPanelCollapsed: v }),
      bottomPanelCollapsed: false,
      setBottomPanelCollapsed: (v) => set({ bottomPanelCollapsed: v }),
      activePanel: "load",
      setActivePanel: (panel) => set({ activePanel: panel }),
      bottomTab: "api-log",
      setBottomTab: (tab) => set({ bottomTab: tab }),
      rightTab: "properties",
      setRightTab: (tab) => set({ rightTab: tab }),

      mockSettings: DEFAULT_MOCK_SETTINGS,
      setMockSettings: (settings) =>
        set((s) => ({ mockSettings: { ...s.mockSettings, ...settings } })),

      canvasRefreshKey: 0,
      refreshCanvas: () => set((s) => ({ canvasRefreshKey: s.canvasRefreshKey + 1 })),

      statusMessage: "Ready",
      setStatusMessage: (msg) => set({ statusMessage: msg }),
      apiCallCount: 0,
      incrementApiCallCount: () => set((s) => ({ apiCallCount: s.apiCallCount + 1 })),
      resetApiCallCount: () => set({ apiCallCount: 0 }),
      lastUpdated: null,
      setLastUpdated: (d) => set({ lastUpdated: d }),
    }),
    {
      name: "pcf-workbench-state",
      partialize: (s) => ({
        theme: s.theme,
        canvasSize: s.canvasSize,
        customCanvasDimensions: s.customCanvasDimensions,
        canvasBg: s.canvasBg,
        mockSettings: s.mockSettings,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    }
  )
);

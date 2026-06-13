// PCF (Power Apps Component Framework) Type Definitions

export interface ParsedManifest {
  namespace: string;
  constructor: string;
  version: string;
  displayName: string;
  description: string;
  controlType: "standard" | "virtual" | "react";
  properties: PCFProperty[];
  resources: PCFResource[];
  features: string[];
}

export interface PCFProperty {
  name: string;
  ofType: string;
  type: "input" | "output" | "bound" | "input-output";
  usage: string;
  required: boolean;
  defaultValue?: string;
  displayName: string;
  description: string;
  options?: PCFOptionSetValue[];
}

export interface PCFOptionSetValue {
  value: number;
  displayName: string;
}

export interface PCFResource {
  type: "code" | "css" | "img" | "resx" | "platform-library";
  path?: string;
  order?: number;
  name?: string;
  version?: string;
}

export type PropertyValue = string | number | boolean | Date | EntityReference | null | undefined;

export interface EntityReference {
  entityType: string;
  id: string;
  name?: string;
}

export interface PropertyBag {
  [key: string]: PropertyBagEntry;
}

export interface PropertyBagEntry {
  raw: PropertyValue;
  formatted?: string;
  type: string;
  attributes?: Record<string, unknown>;
}

export interface LoadedPCFControl {
  manifest: ParsedManifest;
  bundleContent: string;
  cssContents: string[];         // inline CSS from any loaded .css files
  platformLibContents: string[]; // inline JS for platform libraries (e.g. Fluent UI UMD)
  manifestFileName: string;
  bundleFileName: string;
  loadedAt: Date;
}

export type CanvasSize = "phone" | "tablet" | "small" | "desktop" | "full" | "custom";

export interface CanvasDimensions {
  width: number;
  height: number;
}

export const CANVAS_SIZE_PRESETS: Record<Exclude<CanvasSize, "custom">, CanvasDimensions> = {
  phone: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  small: { width: 480, height: 640 },
  desktop: { width: 1280, height: 800 },
  full: { width: 0, height: 0 },
};

export interface IframeMessage {
  type: "api_call" | "api_response" | "console" | "output_changed" | "update_view" | "init_complete" | "error" | "resize";
  requestId?: string;
  method?: string;
  entity?: string;
  options?: unknown;
  data?: unknown;
  error?: unknown;
  level?: "log" | "info" | "warn" | "error" | "debug";
  args?: unknown[];
  outputs?: PropertyBag;
  parameters?: PropertyBag;
  width?: number;
  height?: number;
}

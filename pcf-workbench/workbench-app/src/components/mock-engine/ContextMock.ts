import type { PropertyBag } from "../../types/pcf.types";
import { createXrmMock } from "./XrmMock";

export interface MockContext {
  parameters: PropertyBag;
  mode: {
    allocatedHeight: number;
    allocatedWidth: number;
    isControlDisabled: boolean;
    isVisible: boolean;
    label: string;
    setControlState: (state: Record<string, unknown>) => void;
    setFullScreen: (value: boolean) => void;
    trackContainerResize: (value: boolean) => void;
  };
  client: {
    getClient: () => "Web" | "Mobile" | "Outlook";
    getFormFactor: () => number;
    isNetworkAvailable: () => boolean;
    isOffline: () => boolean;
  };
  userSettings: {
    dateFormattingInfo: object;
    isRTL: boolean;
    languageId: number;
    numberFormattingInfo: object;
    securityRoles: string[];
    timeZoneOffsetMinutes: number;
    userId: string;
    userName: string;
    getTimeZoneOffsetMinutes: () => number;
  };
  formatting: {
    formatCurrency: (value: number, precision?: number, symbol?: string) => string;
    formatDateAsFilterStringInUTC: (value: Date) => string;
    formatDateLong: (value: Date) => string;
    formatDateLongAbbreviated: (value: Date) => string;
    formatDateShort: (value: Date) => string;
    formatDateYearMonth: (value: Date) => string;
    formatDecimal: (value: number, precision?: number) => string;
    formatInteger: (value: number) => string;
    formatLanguage: (value: number) => string;
    formatTime: (value: Date, behavior: number) => string;
    getWeekOfYear: (value: Date) => number;
    parseDateFromInput: (value: string) => Date | null;
  };
  navigation: ReturnType<typeof createXrmMock>["Navigation"];
  webAPI: ReturnType<typeof createXrmMock>["WebApi"];
  resources: {
    getResource: (id: string, success: (data: string) => void, failure: () => void) => void;
    getString: (id: string) => string;
  };
  utils: {
    lookupObjects: (options: object) => Promise<unknown[]>;
    getEntityMetadata: (entityName: string, attrs?: string[]) => Promise<unknown>;
    hasEntityPrivilege: (entityLogicalName: string, privilegeType: number, privilegeDepth: number) => boolean;
  };
  device: {
    captureAudio: () => Promise<unknown>;
    captureImage: (options?: object) => Promise<unknown>;
    captureVideo: () => Promise<unknown>;
    getBarcodeValue: () => Promise<string>;
    getCurrentPosition: () => Promise<unknown>;
    pickFile: (options?: object) => Promise<unknown[]>;
  };
  diagnostics: {
    getSessionDiagnostics: () => object;
    getSystemDiagnostics: () => object;
  };
  factory: {
    createElement: (type: string, props: object, children?: unknown) => object;
    getPopupService: () => {
      createPopup: (props: object) => void;
      openPopup: (name: string) => void;
      closePopup: (name: string) => void;
      deletePopup: (name: string) => void;
    };
    requestRender: () => void;
  };
  events: {
    getEventArgs: () => object;
  };
  page: {
    appId: string;
    entityId: string;
    entityTypeName: string;
    id: string;
    isPageReadOnly: boolean;
  };
  updatedProperties: string[];
}

export function createContextMock(
  propertyBag: PropertyBag,
  settings: {
    allocatedWidth?: number;
    allocatedHeight?: number;
    isControlDisabled?: boolean;
    isOffline?: boolean;
    userId?: string;
    userName?: string;
    languageId?: number;
    organizationName?: string;
  } = {}
): MockContext {
  const xrm = createXrmMock();

  const ctx: MockContext = {
    parameters: propertyBag,
    updatedProperties: Object.keys(propertyBag),
    mode: {
      allocatedHeight: settings.allocatedHeight ?? 400,
      allocatedWidth: settings.allocatedWidth ?? 600,
      isControlDisabled: settings.isControlDisabled ?? false,
      isVisible: true,
      label: "PCF Control",
      setControlState: (_state) => {},
      setFullScreen: (_value) => {},
      trackContainerResize: (_value) => {},
    },
    client: {
      getClient: () => "Web",
      getFormFactor: () => 1,
      isNetworkAvailable: () => !settings.isOffline,
      isOffline: () => settings.isOffline ?? false,
    },
    userSettings: {
      dateFormattingInfo: {
        FirstDayOfWeek: 0,
        LongDatePattern: "dddd, MMMM d, yyyy",
        ShortDatePattern: "M/d/yyyy",
        TimeFormat: "h:mm tt",
      },
      isRTL: false,
      languageId: settings.languageId ?? 1033,
      numberFormattingInfo: {
        CurrencyDecimalDigits: 2,
        CurrencySymbol: "$",
        NumberDecimalSeparator: ".",
        NumberGroupSeparator: ",",
      },
      securityRoles: ["System Administrator"],
      timeZoneOffsetMinutes: -300,
      userId: settings.userId ?? "{mock-user-id-00000001}",
      userName: settings.userName ?? "Developer User",
      getTimeZoneOffsetMinutes: () => -300,
    },
    formatting: {
      formatCurrency: (value, _precision, symbol) => `${symbol ?? "$"}${value.toFixed(2)}`,
      formatDateAsFilterStringInUTC: (value) => value.toISOString(),
      formatDateLong: (value) => value.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      formatDateLongAbbreviated: (value) => value.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      formatDateShort: (value) => value.toLocaleDateString("en-US"),
      formatDateYearMonth: (value) => value.toLocaleDateString("en-US", { year: "numeric", month: "long" }),
      formatDecimal: (value, precision) => value.toFixed(precision ?? 2),
      formatInteger: (value) => Math.round(value).toString(),
      formatLanguage: (value) => `Language(${value})`,
      formatTime: (value, _behavior) => value.toLocaleTimeString("en-US"),
      getWeekOfYear: (value) => {
        const start = new Date(value.getFullYear(), 0, 1);
        return Math.ceil(((value.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
      },
      parseDateFromInput: (value) => {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
      },
    },
    navigation: xrm.Navigation,
    webAPI: xrm.WebApi,
    resources: {
      getResource: (id, success, failure) => {
        setTimeout(() => {
          if (id) success(`/* Resource: ${id} */`);
          else failure();
        }, 50);
      },
      getString: (id) => id,
    },
    utils: {
      lookupObjects: xrm.Utility.lookupObjects,
      getEntityMetadata: xrm.Utility.getEntityMetadata,
      hasEntityPrivilege: (_entityLogicalName, _privilegeType, _privilegeDepth) => true,
    },
    device: {
      captureAudio: () => Promise.reject(new Error("captureAudio not supported in mock")),
      captureImage: () => Promise.reject(new Error("captureImage not supported in mock")),
      captureVideo: () => Promise.reject(new Error("captureVideo not supported in mock")),
      getBarcodeValue: () => Promise.reject(new Error("getBarcodeValue not supported in mock")),
      getCurrentPosition: () => Promise.resolve({ coords: { latitude: 47.6062, longitude: -122.3321, accuracy: 10 }, timestamp: Date.now() }),
      pickFile: (options?: { accept?: string; allowMultipleFiles?: boolean; maximumAllowedFileSize?: number }) => {
        return new Promise((resolve, reject) => {
          const input = document.createElement("input");
          input.type = "file";
          if (options?.allowMultipleFiles) input.multiple = true;
          if (options?.accept && options.accept !== "any") input.accept = options.accept;
          input.style.display = "none";
          input.addEventListener("change", async () => {
            const files = Array.from(input.files ?? []);
            if (!files.length) { reject(new Error("cancelled")); return; }
            try {
              const results = await Promise.all(files.map(f => {
                return new Promise<{ fileName: string; fileSize: number; mimeType: string; fileContent: string }>((res, rej) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const base64 = (reader.result as string).split(",")[1] || "";
                    res({ fileName: f.name, fileSize: f.size, mimeType: f.type || "application/octet-stream", fileContent: base64 });
                  };
                  reader.onerror = () => rej(new Error("Failed to read file"));
                  reader.readAsDataURL(f);
                });
              }));
              resolve(results);
            } catch (e) { reject(e); }
            input.remove();
          });
          input.addEventListener("cancel", () => { reject(new Error("cancelled")); input.remove(); });
          document.body.appendChild(input);
          input.click();
        });
      },
    },
    diagnostics: {
      getSessionDiagnostics: () => ({ sessionId: "mock-session-id", tenantId: "mock-tenant-id" }),
      getSystemDiagnostics: () => ({ version: "9.2.23043.00148", orgId: "mock-org-id" }),
    },
    factory: {
      createElement: (type, props, children) => ({ type, props, children }),
      getPopupService: () => ({
        createPopup: (_props) => {},
        openPopup: (_name) => {},
        closePopup: (_name) => {},
        deletePopup: (_name) => {},
      }),
      requestRender: () => {},
    },
    events: {
      getEventArgs: () => ({}),
    },
    page: {
      appId: "mock-app-id-00000001",
      entityId: "{mock-entity-id-00000001}",
      entityTypeName: "contact",
      id: "mock-page-id-00000001",
      isPageReadOnly: false,
    },
  };

  return ctx;
}

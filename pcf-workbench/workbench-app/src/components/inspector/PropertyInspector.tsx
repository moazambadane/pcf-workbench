import React, { useCallback, useRef } from "react";
import { useWorkbenchStore } from "../../store/workbenchStore";
import type { PCFProperty } from "../../types/pcf.types";
import { useMockDataStore } from "../../store/mockDataStore";

interface PropertyInspectorProps {
  showInspector?: boolean;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({ showInspector }) => {
  const { loadedControl, propertyBag, updateProperty, canvasRefreshKey } = useWorkbenchStore();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const sendUpdate = useCallback(
    (bag: typeof propertyBag) => {
      const iframe = document.querySelector<HTMLIFrameElement>("#pcf-canvas-wrapper iframe");
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ type: "update_view", parameters: bag }, "*");
      }
    },
    []
  );

  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  function handleChange(propName: string, value: unknown) {
    updateProperty(propName, value as string | number | boolean | null);
    clearTimeout(debounceTimers.current[propName]);
    debounceTimers.current[propName] = setTimeout(() => {
      const bag = useWorkbenchStore.getState().propertyBag;
      sendUpdate(bag);
    }, 300);
  }

  if (!loadedControl) {
    return (
      <div className="flex items-center justify-center h-full text-wb-muted text-xs">
        No control loaded
      </div>
    );
  }

  if (showInspector) {
    return <InspectorView />;
  }

  const props = loadedControl.manifest.properties;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-3">
      {props.map((prop) => (
        <PropertyField
          key={prop.name}
          prop={prop}
          value={propertyBag[prop.name]?.raw}
          onChange={(v) => handleChange(prop.name, v)}
        />
      ))}
      {props.length === 0 && (
        <div className="text-center text-wb-muted text-xs py-8">No properties defined in manifest</div>
      )}
    </div>
  );
};

interface PropertyFieldProps {
  prop: PCFProperty;
  value: unknown;
  onChange: (v: unknown) => void;
}

const PropertyField: React.FC<PropertyFieldProps> = ({ prop, value, onChange }) => {
  const { globalOptionSets } = useMockDataStore();
  const inputClass = "w-full px-2 py-1.5 rounded bg-wb-bg border border-wb-border text-wb-text text-xs focus:border-[#4f6ef7] outline-none transition-colors";

  const renderInput = () => {
    const t = prop.ofType;

    if (t === "TwoOptions") {
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => onChange(!value)}
            className={`w-9 h-5 rounded-full transition-colors relative ${value ? "bg-[#4f6ef7]" : "bg-[wb-border]"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${value ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
          <span className="text-wb-text2 text-xs">{value ? "Yes" : "No"}</span>
        </label>
      );
    }

    if (t === "OptionSet") {
      const options = prop.options ?? [];
      return (
        <select value={String(value ?? "")} onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className={inputClass}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.displayName} ({o.value})</option>
          ))}
          {options.length === 0 && <option value="">No options</option>}
        </select>
      );
    }

    if (t === "Whole.None") {
      return <input type="number" step="1" value={String(value ?? 0)} onChange={(e) => onChange(parseInt(e.target.value, 10))} className={inputClass} />;
    }

    if (t === "Decimal" || t === "Currency" || t === "FloatingPoint") {
      return <input type="number" step="0.01" value={String(value ?? 0)} onChange={(e) => onChange(parseFloat(e.target.value))} className={inputClass} />;
    }

    if (t === "DateAndTime.DateAndTime") {
      return <input type="datetime-local" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
    }

    if (t === "DateAndTime.DateOnly") {
      return <input type="date" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
    }

    if (t === "Multiple") {
      return <textarea rows={3} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputClass + " resize-y"} />;
    }

    if (t === "SingleLine.Email") {
      return <input type="email" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
    }

    if (t === "SingleLine.URL") {
      return <input type="url" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
    }

    if (t === "File" || t === "Image") {
      return (
        <input type="file" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file.name);
        }} className={inputClass} />
      );
    }

    // Default: text
    return <input type="text" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
  };

  const typeColor = prop.type === "output" ? "#f59e0b" : prop.type === "bound" ? "#06b6d4" : "#4f6ef7";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <span className="text-wb-text text-xs font-medium">{prop.name}</span>
        <span className="px-1 py-0.5 rounded text-[9px] font-mono" style={{ background: `${typeColor}20`, color: typeColor }}>
          {prop.ofType}
        </span>
        <span className="px-1 py-0.5 rounded text-[9px] bg-wb-elevated text-wb-muted">
          {prop.type}
        </span>
        {prop.required && <span className="text-[#ef4444] text-xs">*</span>}
      </div>
      {renderInput()}
    </div>
  );
};

const InspectorView: React.FC = () => {
  const { loadedControl, propertyBag } = useWorkbenchStore();
  if (!loadedControl) return null;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-2">
      <div className="text-[11px] font-semibold text-wb-text2 uppercase tracking-wider mb-1">Live Property Values</div>
      {Object.entries(propertyBag).map(([key, entry]) => (
        <div key={key} className="px-2 py-2 rounded bg-wb-bg border border-wb-border">
          <div className="flex items-center justify-between gap-2">
            <span className="text-wb-text2 text-xs">{key}</span>
            <span className="text-[#4f6ef7] text-[10px] font-mono">{entry.type}</span>
          </div>
          <div className="text-wb-text text-xs font-mono mt-0.5 break-all">
            {JSON.stringify(entry.raw)}
          </div>
        </div>
      ))}
    </div>
  );
};

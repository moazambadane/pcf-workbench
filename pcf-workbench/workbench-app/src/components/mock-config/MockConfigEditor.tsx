import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { useMockDataStore } from "../../store/mockDataStore";
import { parseMockConfigJson } from "../../utils/schemaValidator";
import { Download, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { readFileAsText } from "../../utils/fileLoader";
import dayjs from "dayjs";
import toast from "react-hot-toast";
// MockConfigSchema available for future Monaco schema validation

export const MockConfigEditor: React.FC = () => {
  const { entities, customActions, globalOptionSets, importConfig, resetToDefaults } = useMockDataStore();
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] } | null>(null);

  const currentConfig = JSON.stringify({
    entities: Object.fromEntries(Object.entries(entities).map(([k, v]) => [k, v.slice(0, 3)])),
    customActions: Object.values(customActions),
    globalOptionSets,
  }, null, 2);

  async function handleImportFile(files: File[]) {
    if (!files.length) return;
    try {
      const text = await readFileAsText(files[0]);
      const result = parseMockConfigJson(text);
      if (result.error) {
        toast.error(result.error);
        setValidation({ valid: false, errors: [result.error] });
        return;
      }
      if (result.config) {
        importConfig(result.config);
        setValidation({ valid: true, errors: [] });
        toast.success("Mock config imported successfully");
      }
    } catch (err) {
      toast.error(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/json": [".json"] },
    multiple: false,
    onDrop: handleImportFile,
  });

  function handleExport() {
    const config = {
      entities,
      customActions: Object.values(customActions),
      globalOptionSets,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mock-config-${dayjs().format("YYYYMMDD-HHmmss")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Mock config exported");
  }

  return (
    <div className="flex flex-col h-full p-3 space-y-4">
      {/* Import / Export buttons */}
      <div className="flex gap-2">
        <button onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-wb-elevated text-wb-text2 hover:text-wb-text text-xs transition-colors border border-wb-border">
          <Download size={12} /> Export JSON
        </button>
        <button onClick={() => { if (confirm("Reset all mock data to defaults?")) { resetToDefaults(); toast.success("Reset to defaults"); } }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-wb-elevated text-wb-text2 hover:text-[#ef4444] text-xs transition-colors border border-wb-border">
          Reset Defaults
        </button>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-[#4f6ef7] bg-[#4f6ef7]/10" : "border-wb-border hover:border-wb-border2"}`}
      >
        <input {...getInputProps()} />
        <Upload size={16} className="mx-auto mb-1 text-wb-muted" />
        <p className="text-xs text-wb-text2">Drop mock-config.json here or click to browse</p>
      </div>

      {/* Validation result */}
      {validation && (
        <div className={`flex items-start gap-2 p-2 rounded text-xs ${validation.valid ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"}`}>
          {validation.valid ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
          <span>{validation.valid ? "Config is valid" : validation.errors.join("; ")}</span>
        </div>
      )}

      {/* Current config preview */}
      <div className="flex-1 min-h-0">
        <div className="text-[11px] text-wb-muted mb-1">Current Config Preview (first 3 records per entity)</div>
        <Editor
          height="100%"
          defaultLanguage="json"
          value={currentConfig}
          theme="vs-dark"
          options={{ readOnly: true, minimap: { enabled: false }, fontSize: 11, lineNumbers: "off", scrollBeyondLastLine: false }}
        />
      </div>
    </div>
  );
};

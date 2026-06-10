import React, { useState } from "react";
import { FilePicker } from "./FilePicker";
import { parseManifest } from "../../utils/manifestParser";
import { readFileAsText, classifyFiles } from "../../utils/fileLoader";
import { useWorkbenchStore } from "../../store/workbenchStore";
import { CheckCircle, RotateCcw, Info } from "lucide-react";
import type { PropertyBag } from "../../types/pcf.types";
import toast from "react-hot-toast";

export const PCFLoader: React.FC = () => {
  const { loadedControl, setLoadedControl, setPropertyBag, refreshCanvas } = useWorkbenchStore();
  const [manifestFile, setManifestFile] = useState<File | null>(null);
  const [bundleFile, setBundleFile] = useState<File | null>(null);
  const [cssFiles, setCssFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFilesSelected(files: File[]) {
    const { manifest, bundle, cssFiles: css } = classifyFiles(files);
    if (manifest) setManifestFile(manifest);
    if (bundle) setBundleFile(bundle);
    if (css.length > 0) setCssFiles(prev => [...prev, ...css]);
    setError(null);
  }

  async function handleLoad() {
    if (!manifestFile || !bundleFile) {
      setError("Both ControlManifest.Input.xml and bundle.js are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [xmlContent, bundleContent, ...cssContents] = await Promise.all([
        readFileAsText(manifestFile),
        readFileAsText(bundleFile),
        ...cssFiles.map(readFileAsText),
      ]);
      const manifest = parseManifest(xmlContent);

      const bag: PropertyBag = {};
      for (const prop of manifest.properties) {
        let raw: string | number | boolean | null = prop.defaultValue ?? null;
        if (prop.ofType === "TwoOptions") {
          raw = prop.defaultValue === "true" || prop.defaultValue === "1" ? true : false;
        } else if (["Whole.None", "Currency", "Decimal", "FloatingPoint"].includes(prop.ofType)) {
          raw = prop.defaultValue ? parseFloat(prop.defaultValue) : 0;
        } else if (prop.ofType === "OptionSet") {
          raw = prop.defaultValue ? parseInt(prop.defaultValue, 10) : 0;
        } else {
          raw = prop.defaultValue ?? "";
        }
        bag[prop.name] = { raw, type: prop.ofType };
      }

      setLoadedControl({
        manifest,
        bundleContent,
        cssContents,
        manifestFileName: manifestFile.name,
        bundleFileName: bundleFile.name,
        loadedAt: new Date(),
      });
      setPropertyBag(bag);
      refreshCanvas();
      toast.success(`Loaded: ${manifest.namespace}.${manifest.constructor} v${manifest.version}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error("Failed to load PCF control");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setLoadedControl(null);
    setManifestFile(null);
    setBundleFile(null);
    setCssFiles([]);
    setError(null);
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-wb-text">Load PCF Control</h2>
      </div>

      {loadedControl && (
        <div className="flex items-start gap-2 p-3 rounded bg-[#22c55e]/10 border border-[#22c55e]/20">
          <CheckCircle size={14} className="text-[#22c55e] shrink-0 mt-0.5" />
          <div className="text-xs flex-1">
            <div className="text-wb-text font-medium">
              {loadedControl.manifest.namespace}.{loadedControl.manifest.constructor}
            </div>
            <div className="text-wb-text2">
              v{loadedControl.manifest.version} &mdash; {loadedControl.manifest.properties.length} properties
            </div>
          </div>
          <button
            onClick={handleClear}
            title="Unload control"
            className="p-1 rounded text-wb-text2 hover:text-[#ef4444] transition-colors"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      )}

      <FilePicker
        onFilesSelected={handleFilesSelected}
        manifestFile={manifestFile}
        bundleFile={bundleFile}
        cssFiles={cssFiles}
        error={error}
      />

      <button
        onClick={handleLoad}
        disabled={!manifestFile || !bundleFile || loading}
        className={[
          "w-full py-2 rounded text-sm font-medium transition-colors",
          (!manifestFile || !bundleFile || loading)
            ? "bg-wb-border text-wb-muted cursor-not-allowed"
            : "bg-[#4f6ef7] hover:bg-[#3b5ce5] text-white cursor-pointer",
        ].join(" ")}
      >
        {loading ? "Loading..." : "Load Control"}
      </button>

      <div className="flex items-start gap-2 p-3 rounded bg-wb-elevated border border-wb-border">
        <Info size={13} className="text-wb-muted shrink-0 mt-0.5" />
        <div className="text-[11px] text-wb-muted space-y-1">
          <p>1. Select <code className="text-wb-text2">ControlManifest.Input.xml</code></p>
          <p>2. Select compiled <code className="text-wb-text2">bundle.js</code></p>
          <p>3. Click <strong className="text-wb-text2">Load Control</strong></p>
          <p className="pt-1">Shortcut: <kbd className="text-[#4f6ef7] font-mono">Ctrl+L</kbd></p>
        </div>
      </div>

          </div>
        );
      };

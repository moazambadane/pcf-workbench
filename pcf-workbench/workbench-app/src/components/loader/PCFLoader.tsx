import React, { useState } from "react";
import { FilePicker } from "./FilePicker";
import { parseManifest } from "../../utils/manifestParser";
import { readFileAsText, classifyFiles, isPlatformLibFile } from "../../utils/fileLoader";
import { useWorkbenchStore } from "../../store/workbenchStore";
import { CheckCircle, RotateCcw, Info } from "lucide-react";
import type { PropertyBag } from "../../types/pcf.types";
import toast from "react-hot-toast";

export const PCFLoader: React.FC = () => {
  const { loadedControl, setLoadedControl, setPropertyBag, refreshCanvas } = useWorkbenchStore();
  const [manifestFile, setManifestFile] = useState<File | null>(null);
  const [bundleFile, setBundleFile] = useState<File | null>(null);
  const [cssFiles, setCssFiles] = useState<File[]>([]);
  const [platformLibFiles, setPlatformLibFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Derive which platform library names the loaded manifest requires
  const [manifestPlatformLibs, setManifestPlatformLibs] = useState<string[]>([]);

  async function handleFilesSelected(files: File[]) {
    const { manifest, bundle, cssFiles: css, platformLibFiles: platLibs } = classifyFiles(files);
    if (manifest) {
      setManifestFile(manifest);
      // Pre-parse manifest to know which platform libs are needed
      try {
        const xml = await readFileAsText(manifest);
        const parsed = parseManifest(xml);
        const libNames = parsed.resources
          .filter((r) => r.type === "platform-library")
          .map((r) => r.name ?? "")
          .filter(Boolean);
        setManifestPlatformLibs(libNames);
      } catch {
        setManifestPlatformLibs([]);
      }
    }
    if (bundle) setBundleFile(bundle);
    if (css.length > 0) setCssFiles((prev) => [...prev, ...css]);
    if (platLibs.length > 0) setPlatformLibFiles((prev) => [...prev, ...platLibs]);
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
      const [xmlContent, bundleContent, ...rest] = await Promise.all([
        readFileAsText(manifestFile),
        readFileAsText(bundleFile),
        ...cssFiles.map(readFileAsText),
        ...platformLibFiles.map(readFileAsText),
      ]);
      const cssContents = rest.slice(0, cssFiles.length);
      const platformLibContents = rest.slice(cssFiles.length);
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
        platformLibContents,
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
    setPlatformLibFiles([]);
    setManifestPlatformLibs([]);
    setError(null);
  }

  // Fluent hint: manifest declares Fluent but no Fluent UMD file is loaded yet
  const needsFluentHint =
    manifestPlatformLibs.some((n) => n.toLowerCase() === "fluent") &&
    platformLibFiles.every((f) => isPlatformLibFile(f) !== "Fluent");

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

      {platformLibFiles.length > 0 && (
        <div className="text-[11px] text-wb-muted space-y-0.5">
          {platformLibFiles.map((f) => (
            <div key={f.name} className="flex items-center gap-1.5">
              <CheckCircle size={11} className="text-[#22c55e]" />
              <span className="text-wb-text2 font-mono truncate">{f.name}</span>
            </div>
          ))}
        </div>
      )}

      {needsFluentHint && (
        <div className="flex items-start gap-2 p-2.5 rounded bg-[#f59e0b]/10 border border-[#f59e0b]/25">
          <Info size={12} className="text-[#f59e0b] shrink-0 mt-0.5" />
          <div className="text-[11px] text-wb-text2">
            <span className="font-medium text-[#f59e0b]">Fluent UI required</span> — also drop{" "}
            <code className="text-wb-text">fluentui-react.js</code> from{" "}
            <code className="text-wb-text">node_modules/@fluentui/react/dist/</code>
          </div>
        </div>
      )}

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


import { useState, useCallback } from "react";
import { parseManifest } from "../utils/manifestParser";
import { readFileAsText, classifyFiles } from "../utils/fileLoader";
import { useWorkbenchStore } from "../store/workbenchStore";
import type { PropertyBag, LoadedPCFControl } from "../types/pcf.types";

export function usePCFLoader() {
  const { setLoadedControl, setPropertyBag, refreshCanvas } = useWorkbenchStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async (files: File[]) => {
    const { manifest, bundle } = classifyFiles(files);
    if (!manifest || !bundle) {
      setError("Both ControlManifest.Input.xml and bundle.js are required.");
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const [xmlContent, bundleContent] = await Promise.all([
        readFileAsText(manifest),
        readFileAsText(bundle),
      ]);
      const parsedManifest = parseManifest(xmlContent);
      const bag: PropertyBag = {};
      for (const prop of parsedManifest.properties) {
        bag[prop.name] = { raw: prop.defaultValue ?? null, type: prop.ofType };
      }
      const control: LoadedPCFControl = {
        manifest: parsedManifest,
        bundleContent,
        cssContents: [],
        platformLibContents: [],
        manifestFileName: manifest.name,
        bundleFileName: bundle.name,
        loadedAt: new Date(),
      };
      setLoadedControl(control);
      setPropertyBag(bag);
      refreshCanvas();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoadedControl, setPropertyBag, refreshCanvas]);

  return { loadFiles, loading, error, setError };
}

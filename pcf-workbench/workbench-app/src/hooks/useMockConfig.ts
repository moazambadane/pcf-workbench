import { useMockDataStore } from "../store/mockDataStore";
import { parseMockConfigJson } from "../utils/schemaValidator";
import toast from "react-hot-toast";

export function useMockConfig() {
  const store = useMockDataStore();

  function importJson(json: string): boolean {
    const result = parseMockConfigJson(json);
    if (result.error) { toast.error(result.error); return false; }
    if (result.config) { store.importConfig(result.config); toast.success("Config imported"); return true; }
    return false;
  }

  return { importJson, resetToDefaults: store.resetToDefaults };
}

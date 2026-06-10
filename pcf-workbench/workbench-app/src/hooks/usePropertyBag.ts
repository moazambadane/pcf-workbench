import { useWorkbenchStore } from "../store/workbenchStore";
export function usePropertyBag() {
  const { propertyBag, updateProperty } = useWorkbenchStore();
  return { propertyBag, updateProperty };
}

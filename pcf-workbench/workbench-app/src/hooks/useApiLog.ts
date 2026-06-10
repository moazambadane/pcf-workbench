import { useLogStore } from "../store/logStore";
export function useApiLog() {
  return useLogStore();
}

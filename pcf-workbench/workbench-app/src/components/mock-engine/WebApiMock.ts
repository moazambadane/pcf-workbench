import { v4 as uuidv4 } from "uuid";
import type { Entity, EntityReference, RetrieveMultipleResponse, CustomActionMock } from "../../types/mock.types";
import type { MockSettings, FetchXmlMock } from "../../types/mock.types";
import { autoGenerateRecords } from "./MockDataStore";
import { useLogStore } from "../../store/logStore";
import { useWorkbenchStore } from "../../store/workbenchStore";
import { applyFetchXml, extractFetchXmlFromOptions } from "./FetchXmlParser";

function matchesFields(request: Record<string, unknown>, matchFields: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(matchFields)) {
    if (String(request[key] ?? "") !== String(value)) return false;
  }
  return true;
}

function getDelay(settings: MockSettings): number {
  return settings.defaultDelay + Math.floor(Math.random() * 100);
}

function maybeThrow(settings: MockSettings): void {
  if (settings.errorRate > 0 && Math.random() < settings.errorRate) {
    const codes = [401, 403, 404, 409, 429, 500];
    const code = codes[Math.floor(Math.random() * codes.length)];
    const messages: Record<number, string> = {
      401: "Caller is not authenticated.",
      403: "You do not have permission to perform this action.",
      404: "The requested record was not found.",
      409: "A record with the same value already exists.",
      429: "Service protection limits exceeded.",
      500: "An unexpected error occurred on the server.",
    };
    const err = new Error(messages[code] || "Unknown error") as Error & { errorCode: number };
    err.errorCode = code;
    throw err;
  }
}

function applyODataFilter(records: Entity[], filterStr: string): Entity[] {
  if (!filterStr) return records;
  let filtered = records;

  // Handle "contains(field,'value')" filters (joined with " or ")
  const containsParts = filterStr.match(/contains\(\s*(\w+)\s*,\s*'([^']+)'\s*\)/g);
  if (containsParts && containsParts.length > 0) {
    const conditions: { field: string; value: string }[] = [];
    for (const part of containsParts) {
      const m = /contains\(\s*(\w+)\s*,\s*'([^']+)'\s*\)/.exec(part);
      if (m) conditions.push({ field: m[1], value: m[2].toLowerCase() });
    }
    if (conditions.length) {
      filtered = filtered.filter((r) =>
        conditions.some((c) => String(r[c.field] ?? "").toLowerCase().includes(c.value))
      );
    }
    // Remove contains portions from filterStr for further processing
    filterStr = filterStr.replace(/contains\(\s*\w+\s*,\s*'[^']+'\s*\)/g, "").replace(/\s+(or|and)\s+/g, " ").trim();
  }

  // Handle equality filters: field eq 'value' or field eq guid (unquoted)
  const eqMatch = /(\w+)\s+eq\s+'([^']+)'/g;
  let match: RegExpExecArray | null;
  while ((match = eqMatch.exec(filterStr)) !== null) {
    const [, field, value] = match;
    filtered = filtered.filter((r) => String(r[field] ?? "") === value);
  }

  return filtered;
}

function applyODataOptions(records: Entity[], options?: string): Entity[] {
  if (!options) return records;
  let result = [...records];
  const filterMatch = /\$filter=([^&]+)/.exec(options);
  if (filterMatch) result = applyODataFilter(result, decodeURIComponent(filterMatch[1]));
  const topMatch = /\$top=(\d+)/.exec(options);
  if (topMatch) result = result.slice(0, parseInt(topMatch[1], 10));
  const orderbyMatch = /\$orderby=(\w+)(?:\s+(asc|desc))?/.exec(options);
  if (orderbyMatch) {
    const [, field, dir] = orderbyMatch;
    result.sort((a, b) => {
      const av = String(a[field] ?? "");
      const bv = String(b[field] ?? "");
      return dir === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
    });
  }
  return result;
}

function methodToHttpVerb(method: string): "GET" | "POST" | "PATCH" | "DELETE" | "ACTION" | "EXECUTE" | "FETCHXML" {
  if (method === "retrieveMultipleRecords" || method === "retrieveRecord") return "GET";
  if (method === "createRecord") return "POST";
  if (method === "updateRecord") return "PATCH";
  if (method === "deleteRecord") return "DELETE";
  if (method === "execute" || method === "executeMultiple") return "ACTION";
  if (method === "fetchXml") return "FETCHXML";
  return "GET";
}

export function createWebApiMock(
  getEntities: () => Record<string, Entity[]>,
  setEntityRecords: (name: string, records: Entity[]) => void,
  addRecord: (name: string, record: Entity) => void,
  getCustomActions: () => Record<string, CustomActionMock>,
  getFetchXmlMocks: () => FetchXmlMock[] = () => []
) {
  const log = useLogStore.getState;
  const settings = () => useWorkbenchStore.getState().mockSettings;

  async function withLog<T>(
    method: string,
    entity: string,
    options: unknown,
    fn: () => Promise<T>
  ): Promise<T> {
    const s = settings();
    const callId = log().addApiCall({
      method: methodToHttpVerb(method),
      entity,
      options: typeof options === "string" ? options : JSON.stringify(options),
      status: "pending",
      requestData: options,
    });
    const start = performance.now();
    await new Promise((r) => setTimeout(r, getDelay(s)));
    try {
      maybeThrow(s);
      const result = await fn();
      const duration = Math.round(performance.now() - start);
      log().updateApiCall(callId, {
        status: "success",
        duration,
        responseData: result,
        responseSize: JSON.stringify(result).length,
      });
      useWorkbenchStore.getState().incrementApiCallCount();
      return result;
    } catch (err) {
      const duration = Math.round(performance.now() - start);
      log().updateApiCall(callId, { status: "error", duration, errorData: err });
      throw err;
    }
  }

  const api = {
    isAvailableOffline: (_entityLogicalName: string) => false,

    retrieveMultipleRecords: (
      entityLogicalName: string,
      options?: string,
      _maxPageSize?: number
    ): Promise<RetrieveMultipleResponse> => {
      const fetchXml = extractFetchXmlFromOptions(options);
      if (fetchXml) {
        return withLog("fetchXml", entityLogicalName, options, async () => {
          // Check for an explicit FetchXML mock override
          const overrides = getFetchXmlMocks().filter(
            (m) => m.enabled && m.entityName === entityLogicalName
          );
          const matched = overrides.find(
            (m) => !m.xmlContains || fetchXml.includes(m.xmlContains)
          );
          if (matched) {
            if (matched.errorCode) {
              const err = new Error(matched.errorMessage || "FetchXML mock error") as Error & { errorCode: number };
              err.errorCode = matched.errorCode;
              throw err;
            }
            if (matched.delay) await new Promise((r) => setTimeout(r, matched.delay));
            return { entities: matched.mockResponse.map((r) => structuredClone(r)) };
          }
          // Auto-parse and apply FetchXML against mock data
          const userId = useWorkbenchStore.getState().mockSettings.userId;
          return applyFetchXml(fetchXml, getEntities(), userId);
        });
      }
      return withLog("retrieveMultipleRecords", entityLogicalName, options, async () => {
        const entities = getEntities();
        let records: Entity[] = entities[entityLogicalName] || autoGenerateRecords(entityLogicalName, 5);
        records = applyODataOptions(records, options);
        return { entities: records.map((r) => structuredClone(r)) };
      });
    },

    retrieveRecord: (entityLogicalName: string, id: string, options?: string): Promise<Entity> =>
      withLog("retrieveRecord", entityLogicalName, { id, options }, async () => {
        const entities = getEntities();
        const idField = entityLogicalName + "id";
        const records = entities[entityLogicalName] || [];
        const found = records.find((r) => (r[idField] as string) === id || (r.id as string) === id);
        if (found) return structuredClone(found);
        // Auto-generate
        return { [idField]: id, name: `Mock ${entityLogicalName}`, statecode: 0, createdon: new Date().toISOString() };
      }),

    createRecord: (entityLogicalName: string, data: object): Promise<EntityReference> =>
      withLog("createRecord", entityLogicalName, data, async () => {
        const id = uuidv4();
        const idField = entityLogicalName + "id";
        const record: Entity = { [idField]: id, ...data as Record<string, unknown>, createdon: new Date().toISOString() };
        addRecord(entityLogicalName, record);
        return { entityType: entityLogicalName, id };
      }),

    updateRecord: (entityLogicalName: string, id: string, data: object): Promise<EntityReference> =>
      withLog("updateRecord", entityLogicalName, { id, ...data as Record<string, unknown> }, async () => {
        const entities = getEntities();
        const idField = entityLogicalName + "id";
        const records = entities[entityLogicalName] || [];
        const updated = records.map((r) =>
          (r[idField] as string) === id ? { ...r, ...data as Record<string, unknown>, modifiedon: new Date().toISOString() } : r
        );
        setEntityRecords(entityLogicalName, updated);
        return { entityType: entityLogicalName, id };
      }),

    deleteRecord: (entityLogicalName: string, id: string): Promise<EntityReference> =>
      withLog("deleteRecord", entityLogicalName, { id }, async () => {
        const entities = getEntities();
        const idField = entityLogicalName + "id";
        const records = (entities[entityLogicalName] || []).filter((r) => (r[idField] as string) !== id);
        setEntityRecords(entityLogicalName, records);
        return { entityType: entityLogicalName, id };
      }),

    execute: (request: Record<string, unknown>): Promise<unknown> => {
      const actionName = (request.RequestName || request.LogicalName) as string;
      return withLog("execute", actionName || "CustomAction", request, async () => {
        const customActions = getCustomActions();
        const mock = customActions[actionName];
        if (mock) {
          if (mock.errorCode) {
            const err = new Error(mock.errorMessage || "Action error") as Error & { errorCode: number };
            err.errorCode = mock.errorCode;
            throw err;
          }
          if (mock.delay) await new Promise((r) => setTimeout(r, mock.delay));

          // Check conditional responses — first match wins
          if (mock.conditionalResponses?.length) {
            for (const cond of mock.conditionalResponses) {
              if (matchesFields(request, cond.matchFields)) {
                return structuredClone(cond.response);
              }
            }
          }

          return structuredClone(mock.mockResponse);
        }
        return { success: true, message: `Mock response for action: ${actionName}` };
      });
    },

    executeMultiple: (requests: object[]): Promise<unknown[]> =>
      withLog("executeMultiple", "Multiple", requests, async () => {
        const results = [];
        for (const req of requests) {
          results.push(await api.execute(req as Record<string, unknown>));
        }
        return results;
      }),

    retrieveDependentComponents: (componentType: string, id: string): Promise<unknown> =>
      withLog("retrieveDependentComponents", componentType, { id }, async () => ({
        value: [],
      })),

      };

      type WebApiMockType = typeof api;
      (api as unknown as Record<string, unknown>)["online"] = api;
      (api as unknown as Record<string, unknown>)["offline"] = api;

      return api as WebApiMockType & { online: WebApiMockType; offline: WebApiMockType };
    }


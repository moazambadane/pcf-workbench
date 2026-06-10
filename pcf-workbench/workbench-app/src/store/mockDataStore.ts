import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MockDataStoreState, Entity, CustomActionMock, OptionSetValue, EntityMetadata, MockConfig, HttpMock, FetchXmlMock } from "../types/mock.types";
import { generateDefaultData } from "../components/mock-engine/MockDataStore";

interface MockDataStoreActions {
  entities: Record<string, Entity[]>;
  customActions: Record<string, CustomActionMock>;
  globalOptionSets: Record<string, OptionSetValue[]>;
  metadata: Record<string, EntityMetadata>;
  httpMocks: HttpMock[];
  fetchXmlMocks: FetchXmlMock[];

  setEntities: (entities: Record<string, Entity[]>) => void;
  setEntityRecords: (entityName: string, records: Entity[]) => void;
  addRecord: (entityName: string, record: Entity) => void;
  updateRecord: (entityName: string, id: string, data: Partial<Entity>) => void;
  deleteRecord: (entityName: string, id: string) => void;

  setCustomAction: (mock: CustomActionMock) => void;
  removeCustomAction: (actionName: string) => void;

  setHttpMocks: (mocks: HttpMock[]) => void;
  addHttpMock: (mock: HttpMock) => void;
  updateHttpMock: (id: string, mock: HttpMock) => void;
  removeHttpMock: (id: string) => void;

  addFetchXmlMock: (mock: FetchXmlMock) => void;
  updateFetchXmlMock: (id: string, mock: FetchXmlMock) => void;
  removeFetchXmlMock: (id: string) => void;

  importConfig: (config: MockConfig) => void;
  resetToDefaults: () => void;
}

const defaults = generateDefaultData();

export const useMockDataStore = create<MockDataStoreActions>()(
  persist(
    (set) => ({
      entities: defaults.entities,
      customActions: defaults.customActions,
      globalOptionSets: defaults.globalOptionSets,
      metadata: defaults.metadata,
      httpMocks: defaults.httpMocks,
      fetchXmlMocks: defaults.fetchXmlMocks,

      setEntities: (entities) => set({ entities }),
      setEntityRecords: (entityName, records) =>
        set((s) => ({ entities: { ...s.entities, [entityName]: records } })),
      addRecord: (entityName, record) =>
        set((s) => ({
          entities: {
            ...s.entities,
            [entityName]: [...(s.entities[entityName] || []), record],
          },
        })),
      updateRecord: (entityName, id, data) =>
        set((s) => {
          const idField = entityName + "id";
          return {
            entities: {
              ...s.entities,
              [entityName]: (s.entities[entityName] || []).map((r) =>
                (r[idField] as string) === id ? { ...r, ...data } : r
              ),
            },
          };
        }),
      deleteRecord: (entityName, id) =>
        set((s) => {
          const idField = entityName + "id";
          return {
            entities: {
              ...s.entities,
              [entityName]: (s.entities[entityName] || []).filter(
                (r) => (r[idField] as string) !== id
              ),
            },
          };
        }),

      setCustomAction: (mock) =>
        set((s) => ({
          customActions: { ...s.customActions, [mock.actionName]: mock },
        })),
      removeCustomAction: (actionName) =>
        set((s) => {
          const updated = { ...s.customActions };
          delete updated[actionName];
          return { customActions: updated };
        }),

      setHttpMocks: (mocks) => set({ httpMocks: mocks }),
      addHttpMock: (mock) =>
        set((s) => ({ httpMocks: [...s.httpMocks, mock] })),
      updateHttpMock: (id, mock) =>
        set((s) => ({
          httpMocks: s.httpMocks.map((m) => (m.id === id ? mock : m)),
        })),
      removeHttpMock: (id) =>
        set((s) => ({
          httpMocks: s.httpMocks.filter((m) => m.id !== id),
        })),

      addFetchXmlMock: (mock) =>
        set((s) => ({ fetchXmlMocks: [...s.fetchXmlMocks, mock] })),
      updateFetchXmlMock: (id, mock) =>
        set((s) => ({
          fetchXmlMocks: s.fetchXmlMocks.map((m) => (m.id === id ? mock : m)),
        })),
      removeFetchXmlMock: (id) =>
        set((s) => ({
          fetchXmlMocks: s.fetchXmlMocks.filter((m) => m.id !== id),
        })),

      importConfig: (config) =>
        set((s) => {
          const entities = config.entities
            ? { ...s.entities, ...config.entities }
            : s.entities;
          const customActions = config.customActions
            ? {
                ...s.customActions,
                ...Object.fromEntries(config.customActions.map((a) => [a.actionName, a])),
              }
            : s.customActions;
          const globalOptionSets = config.globalOptionSets
            ? { ...s.globalOptionSets, ...config.globalOptionSets }
            : s.globalOptionSets;
          const httpMocks = config.httpMocks
            ? [...s.httpMocks, ...config.httpMocks]
            : s.httpMocks;
          const fetchXmlMocks = config.fetchXmlMocks
            ? [...s.fetchXmlMocks, ...config.fetchXmlMocks]
            : s.fetchXmlMocks;
          return { entities, customActions, globalOptionSets, httpMocks, fetchXmlMocks };
        }),
      resetToDefaults: () => {
        const d = generateDefaultData();
        set({ entities: d.entities, customActions: d.customActions, globalOptionSets: d.globalOptionSets, metadata: d.metadata, httpMocks: d.httpMocks, fetchXmlMocks: d.fetchXmlMocks });
      },
    }),
    {
      name: "pcf-workbench-mock-data",
      version: 4,
      migrate: () => {
        const d = generateDefaultData();
        return {
          entities: d.entities,
          customActions: d.customActions,
          globalOptionSets: d.globalOptionSets,
          metadata: d.metadata,
          httpMocks: d.httpMocks,
          fetchXmlMocks: d.fetchXmlMocks,
        };
      },
      partialize: (s) => ({
        entities: s.entities,
        customActions: s.customActions,
        globalOptionSets: s.globalOptionSets,
        httpMocks: s.httpMocks,
        fetchXmlMocks: s.fetchXmlMocks,
      }),
    }
  )
);

export type { MockDataStoreState };

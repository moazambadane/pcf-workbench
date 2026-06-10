import React, { useState } from "react";
import { useMockDataStore } from "../../store/mockDataStore";
import { EntityDataGrid } from "./EntityDataGrid";
import { MockConfigEditor } from "./MockConfigEditor";
import { Plus, Trash2, Edit2 } from "lucide-react";
import Editor from "@monaco-editor/react";
import type { CustomActionMock, ConditionalResponse, HttpMock, HttpMockMethod, FetchXmlMock } from "../../types/mock.types";

import toast from "react-hot-toast";

type Tab = "entities" | "actions" | "http-mocks" | "fetchxml-mocks" | "import-export";

export const MockConfigPanel: React.FC = () => {
  const [tab, setTab] = useState<Tab>("entities");
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  const TABS: { id: Tab; label: string }[] = [
    { id: "entities", label: "Entity Data" },
    { id: "actions", label: "Custom Actions" },
    { id: "http-mocks", label: "HTTP Mocks" },
    { id: "fetchxml-mocks", label: "FetchXML Mocks" },
    { id: "import-export", label: "Import / Export" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 pt-3 pb-0 shrink-0">
        <h2 className="text-sm font-semibold text-wb-text mb-2">Mock Configuration</h2>
        <div className="flex gap-1 border-b border-wb-border">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-xs transition-colors whitespace-nowrap
                ${tab === t.id ? "text-[#4f6ef7] border-b-2 border-[#4f6ef7]" : "text-wb-text2 hover:text-wb-text"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab === "entities" && <EntityTab selectedEntity={selectedEntity} setSelectedEntity={setSelectedEntity} />}
        {tab === "actions" && <ActionsTab />}
        {tab === "http-mocks" && <HttpMocksTab />}
        {tab === "fetchxml-mocks" && <FetchXmlMocksTab />}
        {tab === "import-export" && <MockConfigEditor />}
      </div>
    </div>
  );
};

const EntityTab: React.FC<{
  selectedEntity: string | null;
  setSelectedEntity: (e: string | null) => void;
}> = ({ selectedEntity, setSelectedEntity }) => {
  const { entities, setEntityRecords } = useMockDataStore();
  const entityNames = Object.keys(entities);
  const [newEntity, setNewEntity] = useState("");

  function handleAddEntity() {
    const name = newEntity.trim().toLowerCase();
    if (!name) return;
    setEntityRecords(name, []);
    setSelectedEntity(name);
    setNewEntity("");
  }

  if (selectedEntity && entities[selectedEntity] !== undefined) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-wb-border shrink-0">
          <button onClick={() => setSelectedEntity(null)} className="text-[#4f6ef7] text-xs hover:underline">← Back</button>
          <span className="text-wb-muted text-xs">/</span>
          <span className="text-xs font-medium text-wb-text">{selectedEntity}</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <EntityDataGrid entityName={selectedEntity} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-2">
      {entityNames.map((name) => (
        <button key={name} onClick={() => setSelectedEntity(name)}
          className="flex items-center gap-3 px-3 py-2.5 rounded bg-wb-bg border border-wb-border hover:border-wb-border2 text-left transition-colors">
          <div className="w-7 h-7 rounded bg-[#4f6ef7]/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#4f6ef7]">{name[0].toUpperCase()}</span>
          </div>
          <div>
            <div className="text-xs font-medium text-wb-text">{name}</div>
            <div className="text-[10px] text-wb-muted">{entities[name]?.length ?? 0} records</div>
          </div>
        </button>
      ))}
      <div className="flex gap-2 pt-2">
        <input value={newEntity} onChange={(e) => setNewEntity(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddEntity()}
          placeholder="New entity name..."
          className="flex-1 px-2 py-1.5 rounded bg-wb-bg border border-wb-border text-wb-text text-xs focus:border-[#4f6ef7] outline-none" />
        <button onClick={handleAddEntity}
          className="px-3 py-1.5 rounded bg-[#4f6ef7] text-white text-xs hover:bg-[#3b5ce5] transition-colors">
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
};

const ActionsTab: React.FC = () => {
  const { customActions, setCustomAction, removeCustomAction } = useMockDataStore();
  const actions = Object.values(customActions);
  const [editing, setEditing] = useState<CustomActionMock | null>(null);
  const [formJson, setFormJson] = useState("");
  const [formName, setFormName] = useState("");
  const [formDelay, setFormDelay] = useState("100");
  const [conditionals, setConditionals] = useState<ConditionalResponse[]>([]);

  function handleEdit(action: CustomActionMock) {
    setEditing(action);
    setFormName(action.actionName);
    setFormDelay(String(action.delay ?? 100));
    setFormJson(JSON.stringify(action.mockResponse, null, 2));
    setConditionals(action.conditionalResponses ?? []);
  }

  function handleNew() {
    setEditing({ actionName: "", mockResponse: {} });
    setFormName("");
    setFormDelay("100");
    setFormJson(JSON.stringify({ success: true, result: "mock response" }, null, 2));
    setConditionals([]);
  }

  function handleSave() {
    try {
      const response = JSON.parse(formJson) as unknown;
      const action: CustomActionMock = {
        actionName: formName,
        mockResponse: response,
        conditionalResponses: conditionals.length > 0 ? conditionals : undefined,
        delay: parseInt(formDelay, 10),
      };
      setCustomAction(action);
      setEditing(null);
      toast.success(`Action "${formName}" saved`);
    } catch {
      toast.error("Invalid JSON in default response");
    }
  }

  function addConditional() {
    setConditionals([...conditionals, { label: "", matchFields: {}, response: {} }]);
  }

  function updateConditional(index: number, field: "label" | "matchFields" | "response", value: string) {
    const updated = [...conditionals];
    if (field === "label") {
      updated[index] = { ...updated[index], label: value };
    } else {
      try {
        const parsed = JSON.parse(value) as Record<string, unknown>;
        updated[index] = { ...updated[index], [field]: parsed };
      } catch { /* keep old value on invalid JSON */ }
    }
    setConditionals(updated);
  }

  function removeConditional(index: number) {
    setConditionals(conditionals.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-wb-border">
        <span className="text-xs text-wb-text2">{actions.length} actions registered</span>
        <div className="flex-1" />
        <button onClick={handleNew}
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#4f6ef7]/20 text-[#4f6ef7] text-xs hover:bg-[#4f6ef7]/30 transition-colors">
          <Plus size={11} /> Add Action
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {actions.map((action) => (
          <div key={action.actionName} className="flex items-center gap-2 px-3 py-2 rounded bg-wb-bg border border-wb-border">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-wb-text truncate">{action.actionName}</div>
              <div className="text-[10px] text-wb-muted">
                delay: {action.delay ?? 100}ms
                {action.conditionalResponses?.length ? ` | ${action.conditionalResponses.length} conditional rule(s)` : ""}
                {action.errorCode && ` | error: ${action.errorCode}`}
              </div>
            </div>
            <button onClick={() => handleEdit(action)} className="p-1 text-wb-muted hover:text-[#4f6ef7] transition-colors">
              <Edit2 size={11} />
            </button>
            <button onClick={() => { removeCustomAction(action.actionName); toast.success("Action removed"); }}
              className="p-1 text-wb-muted hover:text-[#ef4444] transition-colors">
              <Trash2 size={11} />
            </button>
          </div>
        ))}
        {actions.length === 0 && (
          <div className="text-center text-wb-muted text-xs py-6">No custom actions. Click "Add Action" to create one.</div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-wb-bg2 border border-wb-border rounded-lg w-[560px] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-wb-border">
              <span className="text-sm font-semibold text-wb-text">Custom Action Mock</span>
              <button onClick={() => setEditing(null)} className="text-wb-muted hover:text-wb-text">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div>
                <label className="text-xs text-wb-text2 block mb-1">Action Name</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. new_GetContactInfo"
                  className="w-full px-2 py-1.5 rounded bg-wb-bg border border-wb-border text-wb-text text-xs focus:border-[#4f6ef7] outline-none" />
              </div>
              <div>
                <label className="text-xs text-wb-text2 block mb-1">Delay (ms)</label>
                <input type="number" value={formDelay} onChange={(e) => setFormDelay(e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-wb-bg border border-wb-border text-wb-text text-xs focus:border-[#4f6ef7] outline-none" />
              </div>
              <div>
                <label className="text-xs text-wb-text2 block mb-1">Default Response (JSON) — used when no conditional rules match</label>
                <Editor height="150px" defaultLanguage="json" value={formJson}
                  onChange={(v) => setFormJson(v ?? "")} theme="vs-dark"
                  options={{ minimap: { enabled: false }, fontSize: 12, lineNumbers: "off" }} />
              </div>

              {/* Conditional Responses */}
              <div className="border-t border-wb-border pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-wb-text2 font-medium">Conditional Responses</label>
                  <button onClick={addConditional}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#4f6ef7]/20 text-[#4f6ef7] text-[10px] hover:bg-[#4f6ef7]/30 transition-colors">
                    <Plus size={10} /> Add Rule
                  </button>
                </div>
                <div className="text-[10px] text-wb-muted mb-2">
                  Rules are evaluated top-to-bottom. First match wins. If no rule matches, the default response is returned.
                </div>
                {conditionals.map((cond, i) => (
                  <div key={i} className="mb-3 p-2 rounded bg-wb-bg border border-wb-border">
                    <div className="flex items-center justify-between mb-1">
                      <input value={cond.label ?? ""} onChange={(e) => updateConditional(i, "label", e.target.value)}
                        placeholder={`Rule ${i + 1} label`}
                        className="flex-1 px-2 py-1 rounded bg-wb-elevated border border-wb-border text-wb-text text-[10px] focus:border-[#4f6ef7] outline-none mr-2" />
                      <button onClick={() => removeConditional(i)} className="p-0.5 text-wb-muted hover:text-[#ef4444] transition-colors">
                        <Trash2 size={10} />
                      </button>
                    </div>
                    <div className="mb-1">
                      <label className="text-[10px] text-wb-muted block mb-0.5">Match Fields (JSON) — fields in the request to match</label>
                      <Editor height="60px" defaultLanguage="json"
                        value={JSON.stringify(cond.matchFields, null, 2)}
                        onChange={(v) => updateConditional(i, "matchFields", v ?? "")}
                        theme="vs-dark"
                        options={{ minimap: { enabled: false }, fontSize: 11, lineNumbers: "off", scrollBeyondLastLine: false }} />
                    </div>
                    <div>
                      <label className="text-[10px] text-wb-muted block mb-0.5">Response (JSON)</label>
                      <Editor height="80px" defaultLanguage="json"
                        value={JSON.stringify(cond.response, null, 2)}
                        onChange={(v) => updateConditional(i, "response", v ?? "")}
                        theme="vs-dark"
                        options={{ minimap: { enabled: false }, fontSize: 11, lineNumbers: "off", scrollBeyondLastLine: false }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 px-4 py-3 border-t border-wb-border">
              <button onClick={() => setEditing(null)}
                className="flex-1 px-3 py-1.5 rounded bg-wb-elevated text-wb-text2 text-sm hover:text-wb-text transition-colors">Cancel</button>
              <button onClick={handleSave}
                className="flex-1 px-3 py-1.5 rounded bg-[#4f6ef7] text-white text-sm hover:bg-[#3b5ce5] transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const HTTP_METHODS: HttpMockMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "ANY"];

const HttpMocksTab: React.FC = () => {
  const { httpMocks, addHttpMock, updateHttpMock, removeHttpMock } = useMockDataStore();
  const [editing, setEditing] = useState<HttpMock | null>(null);
  const [formUrl, setFormUrl] = useState("");
  const [formMatchType, setFormMatchType] = useState<HttpMock["matchType"]>("contains");
  const [formMethod, setFormMethod] = useState<HttpMockMethod>("GET");
  const [formStatus, setFormStatus] = useState("200");
  const [formDelay, setFormDelay] = useState("0");
  const [formBody, setFormBody] = useState("");
  const [isNew, setIsNew] = useState(false);

  function handleEdit(mock: HttpMock) {
    setEditing(mock);
    setIsNew(false);
    setFormUrl(mock.urlPattern);
    setFormMatchType(mock.matchType);
    setFormMethod(mock.method);
    setFormStatus(String(mock.statusCode));
    setFormDelay(String(mock.delay ?? 0));
    setFormBody(typeof mock.responseBody === "string" ? mock.responseBody : JSON.stringify(mock.responseBody, null, 2));
  }

  function handleNew() {
    setEditing({ id: "", urlPattern: "", matchType: "contains", method: "GET", statusCode: 200, responseBody: {}, enabled: true });
    setIsNew(true);
    setFormUrl("");
    setFormMatchType("contains");
    setFormMethod("GET");
    setFormStatus("200");
    setFormDelay("0");
    setFormBody(JSON.stringify({ success: true }, null, 2));
  }

  function handleSave() {
    if (!formUrl.trim()) { toast.error("URL pattern is required"); return; }
    let body: unknown;
    try { body = JSON.parse(formBody); } catch { body = formBody; }

    const mock: HttpMock = {
      id: isNew ? `http-mock-${Date.now()}` : editing!.id,
      urlPattern: formUrl,
      matchType: formMatchType,
      method: formMethod,
      statusCode: parseInt(formStatus, 10) || 200,
      responseBody: body,
      responseHeaders: { "Content-Type": "application/json" },
      delay: parseInt(formDelay, 10) || 0,
      enabled: editing?.enabled ?? true,
    };

    if (isNew) addHttpMock(mock);
    else updateHttpMock(mock.id, mock);

    setEditing(null);
    toast.success(`HTTP mock "${formUrl}" saved`);
  }

  function toggleEnabled(mock: HttpMock) {
    updateHttpMock(mock.id, { ...mock, enabled: !mock.enabled });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-wb-border">
        <span className="text-xs text-wb-text2">{httpMocks.length} HTTP mock(s)</span>
        <div className="flex-1" />
        <button onClick={handleNew}
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#4f6ef7]/20 text-[#4f6ef7] text-xs hover:bg-[#4f6ef7]/30 transition-colors">
          <Plus size={11} /> Add Mock
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {httpMocks.map((mock) => (
          <div key={mock.id} className={`flex items-center gap-2 px-3 py-2 rounded border ${mock.enabled ? "bg-wb-bg border-wb-border" : "bg-wb-bg/50 border-wb-border/50 opacity-60"}`}>
            <button onClick={() => toggleEnabled(mock)}
              className={`w-3 h-3 rounded-sm border ${mock.enabled ? "bg-[#4f6ef7] border-[#4f6ef7]" : "border-wb-border"}`}
              title={mock.enabled ? "Disable" : "Enable"} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-wb-elevated text-wb-text2">{mock.method}</span>
                <span className="text-xs font-medium text-wb-text truncate">{mock.urlPattern}</span>
              </div>
              <div className="text-[10px] text-wb-muted">
                {mock.matchType} | status: {mock.statusCode}{mock.delay ? ` | delay: ${mock.delay}ms` : ""}
              </div>
            </div>
            <button onClick={() => handleEdit(mock)} className="p-1 text-wb-muted hover:text-[#4f6ef7] transition-colors">
              <Edit2 size={11} />
            </button>
            <button onClick={() => { removeHttpMock(mock.id); toast.success("HTTP mock removed"); }}
              className="p-1 text-wb-muted hover:text-[#ef4444] transition-colors">
              <Trash2 size={11} />
            </button>
          </div>
        ))}
        {httpMocks.length === 0 && (
          <div className="text-center text-wb-muted text-xs py-6">
            No HTTP mocks. Click "Add Mock" to intercept fetch/XHR requests.
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-wb-bg2 border border-wb-border rounded-lg w-[500px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-wb-border">
              <span className="text-sm font-semibold text-wb-text">HTTP Request Mock</span>
              <button onClick={() => setEditing(null)} className="text-wb-muted hover:text-wb-text">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div>
                <label className="text-xs text-wb-text2 block mb-1">URL Pattern</label>
                <input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="e.g. /api/v1/health"
                  className="w-full px-2 py-1.5 rounded bg-wb-bg border border-wb-border text-wb-text text-xs focus:border-[#4f6ef7] outline-none" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-wb-text2 block mb-1">Match Type</label>
                  <select value={formMatchType} onChange={(e) => setFormMatchType(e.target.value as HttpMock["matchType"])}
                    className="w-full px-2 py-1.5 rounded bg-wb-bg border border-wb-border text-wb-text text-xs focus:border-[#4f6ef7] outline-none">
                    <option value="contains">Contains</option>
                    <option value="exact">Exact</option>
                    <option value="startsWith">Starts With</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-wb-text2 block mb-1">HTTP Method</label>
                  <select value={formMethod} onChange={(e) => setFormMethod(e.target.value as HttpMockMethod)}
                    className="w-full px-2 py-1.5 rounded bg-wb-bg border border-wb-border text-wb-text text-xs focus:border-[#4f6ef7] outline-none">
                    {HTTP_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-wb-text2 block mb-1">Status Code</label>
                  <input type="number" value={formStatus} onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-2 py-1.5 rounded bg-wb-bg border border-wb-border text-wb-text text-xs focus:border-[#4f6ef7] outline-none" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-wb-text2 block mb-1">Delay (ms)</label>
                  <input type="number" value={formDelay} onChange={(e) => setFormDelay(e.target.value)}
                    className="w-full px-2 py-1.5 rounded bg-wb-bg border border-wb-border text-wb-text text-xs focus:border-[#4f6ef7] outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-wb-text2 block mb-1">Response Body (JSON)</label>
                <Editor height="180px" defaultLanguage="json" value={formBody}
                  onChange={(v) => setFormBody(v ?? "")} theme="vs-dark"
                  options={{ minimap: { enabled: false }, fontSize: 12, lineNumbers: "off" }} />
              </div>
            </div>
            <div className="flex gap-2 px-4 py-3 border-t border-wb-border">
              <button onClick={() => setEditing(null)}
                className="flex-1 px-3 py-1.5 rounded bg-wb-elevated text-wb-text2 text-sm hover:text-wb-text transition-colors">Cancel</button>
              <button onClick={handleSave}
                className="flex-1 px-3 py-1.5 rounded bg-[#4f6ef7] text-white text-sm hover:bg-[#3b5ce5] transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FetchXmlMocksTab: React.FC = () => {
  const { fetchXmlMocks, addFetchXmlMock, updateFetchXmlMock, removeFetchXmlMock } = useMockDataStore();
  const [editing, setEditing] = useState<FetchXmlMock | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [formEntity, setFormEntity] = useState("");
  const [formXmlContains, setFormXmlContains] = useState("");
  const [formDelay, setFormDelay] = useState("0");
  const [formResponse, setFormResponse] = useState("");

  function handleNew() {
    setIsNew(true);
    setEditing({ id: "", entityName: "", xmlContains: "", mockResponse: [], delay: 0, enabled: true });
    setFormEntity("");
    setFormXmlContains("");
    setFormDelay("0");
    setFormResponse(JSON.stringify([], null, 2));
  }

  function handleEdit(mock: FetchXmlMock) {
    setIsNew(false);
    setEditing(mock);
    setFormEntity(mock.entityName);
    setFormXmlContains(mock.xmlContains ?? "");
    setFormDelay(String(mock.delay ?? 0));
    setFormResponse(JSON.stringify(mock.mockResponse, null, 2));
  }

  function handleSave() {
    if (!formEntity.trim()) { toast.error("Entity name is required"); return; }
    let response: unknown;
    try { response = JSON.parse(formResponse); } catch { toast.error("Invalid JSON in mock response"); return; }
    if (!Array.isArray(response)) { toast.error("Mock response must be a JSON array of records"); return; }
    const mock: FetchXmlMock = {
      id: isNew ? `fetchxml-mock-${Date.now()}` : editing!.id,
      entityName: formEntity.trim(),
      xmlContains: formXmlContains.trim() || undefined,
      mockResponse: response as FetchXmlMock["mockResponse"],
      delay: parseInt(formDelay, 10) || 0,
      enabled: editing?.enabled ?? true,
    };
    if (isNew) addFetchXmlMock(mock);
    else updateFetchXmlMock(mock.id, mock);
    setEditing(null);
    toast.success(`FetchXML mock for "${mock.entityName}" saved`);
  }

  function toggleEnabled(mock: FetchXmlMock) {
    updateFetchXmlMock(mock.id, { ...mock, enabled: !mock.enabled });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-wb-border">
        <span className="text-xs text-wb-text2">{fetchXmlMocks.length} FetchXML mock(s)</span>
        <div className="flex-1" />
        <button onClick={handleNew}
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#4f6ef7]/20 text-[#4f6ef7] text-xs hover:bg-[#4f6ef7]/30 transition-colors">
          <Plus size={11} /> Add Mock
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {fetchXmlMocks.map((mock) => (
          <div key={mock.id}
            className={`flex items-center gap-2 px-3 py-2 rounded border ${
              mock.enabled ? "bg-wb-bg border-wb-border" : "bg-wb-bg/50 border-wb-border/50 opacity-60"
            }`}>
            <button onClick={() => toggleEnabled(mock)}
              className={`w-3 h-3 rounded-sm border ${
                mock.enabled ? "bg-[#4f6ef7] border-[#4f6ef7]" : "border-wb-border"
              }`}
              title={mock.enabled ? "Disable" : "Enable"} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#4f6ef7]/10 text-[#4f6ef7]">FETCHXML</span>
                <span className="text-xs font-medium text-wb-text truncate">{mock.entityName}</span>
              </div>
              <div className="text-[10px] text-wb-muted">
                {mock.xmlContains ? `match: "${mock.xmlContains}"` : "match: any"}
                {mock.delay ? ` | delay: ${mock.delay}ms` : ""}
                {` | ${mock.mockResponse.length} record(s)`}
              </div>
            </div>
            <button onClick={() => handleEdit(mock)} className="p-1 text-wb-muted hover:text-[#4f6ef7] transition-colors">
              <Edit2 size={11} />
            </button>
            <button onClick={() => { removeFetchXmlMock(mock.id); toast.success("FetchXML mock removed"); }}
              className="p-1 text-wb-muted hover:text-[#ef4444] transition-colors">
              <Trash2 size={11} />
            </button>
          </div>
        ))}
        {fetchXmlMocks.length === 0 && (
          <div className="text-center text-wb-muted text-xs py-6 space-y-1">
            <div>No FetchXML mocks.</div>
            <div className="text-[10px]">FetchXML queries auto-resolve from entity data. Add a mock to override specific queries.</div>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-wb-bg2 border border-wb-border rounded-lg w-[560px] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-wb-border">
              <span className="text-sm font-semibold text-wb-text">FetchXML Mock Override</span>
              <button onClick={() => setEditing(null)} className="text-wb-muted hover:text-wb-text">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div>
                <label className="text-xs text-wb-text2 block mb-1">Entity Logical Name</label>
                <input value={formEntity} onChange={(e) => setFormEntity(e.target.value)}
                  placeholder="e.g. contact"
                  className="w-full px-2 py-1.5 rounded bg-wb-bg border border-wb-border text-wb-text text-xs focus:border-[#4f6ef7] outline-none" />
              </div>
              <div>
                <label className="text-xs text-wb-text2 block mb-1">
                  XML Contains <span className="text-wb-muted">(optional — leave empty to match all FetchXML for this entity)</span>
                </label>
                <input value={formXmlContains} onChange={(e) => setFormXmlContains(e.target.value)}
                  placeholder="e.g. statecode eq 1  or  name of attribute/value to match"
                  className="w-full px-2 py-1.5 rounded bg-wb-bg border border-wb-border text-wb-text text-xs focus:border-[#4f6ef7] outline-none" />
                <div className="text-[10px] text-wb-muted mt-1">
                  If set, this mock only activates when the decoded FetchXML string contains this substring.
                  First matching mock wins.
                </div>
              </div>
              <div>
                <label className="text-xs text-wb-text2 block mb-1">Delay (ms)</label>
                <input type="number" value={formDelay} onChange={(e) => setFormDelay(e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-wb-bg border border-wb-border text-wb-text text-xs focus:border-[#4f6ef7] outline-none" />
              </div>
              <div>
                <label className="text-xs text-wb-text2 block mb-1">Mock Response (JSON array of records)</label>
                <Editor height="220px" defaultLanguage="json" value={formResponse}
                  onChange={(v) => setFormResponse(v ?? "")} theme="vs-dark"
                  options={{ minimap: { enabled: false }, fontSize: 12, lineNumbers: "off" }} />
              </div>
            </div>
            <div className="flex gap-2 px-4 py-3 border-t border-wb-border">
              <button onClick={() => setEditing(null)}
                className="flex-1 px-3 py-1.5 rounded bg-wb-elevated text-wb-text2 text-sm hover:text-wb-text transition-colors">Cancel</button>
              <button onClick={handleSave}
                className="flex-1 px-3 py-1.5 rounded bg-[#4f6ef7] text-white text-sm hover:bg-[#3b5ce5] transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

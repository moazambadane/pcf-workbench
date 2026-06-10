import React, { useState } from "react";
import { useMockDataStore } from "../../store/mockDataStore";
import { Plus, Trash2, Edit2, X } from "lucide-react";
import type { Entity } from "../../types/mock.types";
import { v4 as uuidv4 } from "uuid";
import Editor from "@monaco-editor/react";

interface EntityDataGridProps {
  entityName: string;
}

export const EntityDataGrid: React.FC<EntityDataGridProps> = ({ entityName }) => {
  const { entities, setEntityRecords, addRecord, deleteRecord } = useMockDataStore();
  const records = entities[entityName] ?? [];
  const [editingRecord, setEditingRecord] = useState<Entity | null>(null);
  const [editJson, setEditJson] = useState("");
  const [addMode, setAddMode] = useState(false);
  const [newJson, setNewJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const idField = entityName + "id";
  const columns = records.length > 0 ? Object.keys(records[0]).slice(0, 6) : [];

  function handleEdit(record: Entity) {
    setEditingRecord(record);
    setEditJson(JSON.stringify(record, null, 2));
    setJsonError(null);
  }

  function handleSaveEdit() {
    try {
      const updated = JSON.parse(editJson) as Entity;
      const id = updated[idField] as string || editingRecord?.[idField] as string;
      const updatedRecords = records.map((r) => (r[idField] as string) === id ? updated : r);
      setEntityRecords(entityName, updatedRecords);
      setEditingRecord(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleDelete(id: string) {
    deleteRecord(entityName, id);
  }

  function handleAdd() {
    const template: Entity = {
      [idField]: uuidv4(),
      name: `New ${entityName}`,
      statecode: 0,
      createdon: new Date().toISOString(),
    };
    setNewJson(JSON.stringify(template, null, 2));
    setAddMode(true);
  }

  function handleSaveAdd() {
    try {
      const newRec = JSON.parse(newJson) as Entity;
      if (!newRec[idField]) newRec[idField] = uuidv4();
      addRecord(entityName, newRec);
      setAddMode(false);
      setJsonError(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-wb-border">
        <span className="text-xs font-medium text-wb-text">{entityName}</span>
        <span className="text-[10px] text-wb-muted">({records.length} records)</span>
        <div className="flex-1" />
        <button onClick={handleAdd}
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#4f6ef7]/20 text-[#4f6ef7] hover:bg-[#4f6ef7]/30 text-xs transition-colors">
          <Plus size={11} /> Add Record
        </button>
        <button
          onClick={() => { if (confirm("Clear all records?")) setEntityRecords(entityName, []); }}
          className="flex items-center gap-1 px-2 py-1 rounded text-[#ef4444]/70 hover:text-[#ef4444] text-xs transition-colors"
        >
          <Trash2 size={11} /> Clear
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[11px] border-collapse">
          <thead className="sticky top-0 bg-wb-panel">
            <tr>
              {columns.map((col) => (
                <th key={col} className="text-left px-3 py-1.5 text-wb-muted border-b border-wb-border font-medium whitespace-nowrap">
                  {col}
                </th>
              ))}
              <th className="text-left px-3 py-1.5 text-wb-muted border-b border-wb-border font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, idx) => (
              <tr key={idx} className="hover:bg-wb-bg2 border-b border-[wb-bg2]">
                {columns.map((col) => (
                  <td key={col} className="px-3 py-1 text-wb-text2 max-w-[120px] truncate">
                    {String(record[col] ?? "")}
                  </td>
                ))}
                <td className="px-3 py-1">
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(record)}
                      className="p-1 text-wb-muted hover:text-[#4f6ef7] transition-colors">
                      <Edit2 size={11} />
                    </button>
                    <button onClick={() => handleDelete(record[idField] as string)}
                      className="p-1 text-wb-muted hover:text-[#ef4444] transition-colors">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-3 py-6 text-center text-wb-muted">
                  No records. Click "Add Record" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {(editingRecord || addMode) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-wb-bg2 border border-wb-border rounded-lg w-[500px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-wb-border">
              <span className="text-sm font-semibold text-wb-text">
                {addMode ? `Add ${entityName} Record` : `Edit ${entityName} Record`}
              </span>
              <button onClick={() => { setEditingRecord(null); setAddMode(false); setJsonError(null); }}
                className="text-wb-muted hover:text-wb-text transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <Editor
                height="300px"
                defaultLanguage="json"
                value={addMode ? newJson : editJson}
                onChange={(v) => addMode ? setNewJson(v ?? "") : setEditJson(v ?? "")}
                theme="vs-dark"
                options={{ minimap: { enabled: false }, fontSize: 12, lineNumbers: "off" }}
              />
              {jsonError && (
                <div className="mt-2 text-xs text-[#ef4444]">{jsonError}</div>
              )}
            </div>
            <div className="flex gap-2 px-4 py-3 border-t border-wb-border">
              <button onClick={() => { setEditingRecord(null); setAddMode(false); setJsonError(null); }}
                className="flex-1 px-3 py-1.5 rounded bg-wb-elevated text-wb-text2 hover:text-wb-text text-sm transition-colors">Cancel</button>
              <button onClick={addMode ? handleSaveAdd : handleSaveEdit}
                className="flex-1 px-3 py-1.5 rounded bg-[#4f6ef7] text-white hover:bg-[#3b5ce5] text-sm transition-colors">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

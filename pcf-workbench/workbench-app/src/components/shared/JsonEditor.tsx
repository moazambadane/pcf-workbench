import React from "react";
import Editor from "@monaco-editor/react";

interface JsonEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  value, onChange, readOnly = false, height = "200px",
}) => (
  <Editor
    height={height}
    defaultLanguage="json"
    value={value}
    onChange={(v) => onChange?.(v ?? "")}
    theme="vs-dark"
    options={{
      readOnly,
      minimap: { enabled: false },
      fontSize: 12,
      lineNumbers: "off",
      scrollBeyondLastLine: false,
      wordWrap: "on",
    }}
  />
);

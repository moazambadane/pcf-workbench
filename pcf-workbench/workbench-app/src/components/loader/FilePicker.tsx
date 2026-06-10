import React, { useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileCode, FileText, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface FilePickerProps {
  onFilesSelected: (files: File[]) => void;
  manifestFile?: File | null;
  bundleFile?: File | null;
  cssFiles?: File[];
  error?: string | null;
}

export const FilePicker: React.FC<FilePickerProps> = ({
  onFilesSelected, manifestFile, bundleFile, cssFiles = [], error,
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  // Allow folder selection via hidden directory input
  const dirInputRef = React.useRef<HTMLInputElement>(null);
  function handleDirInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) onFilesSelected(files);
    e.target.value = "";
  }

  return (
    <div className="space-y-3">
      <motion.div
        {...(getRootProps() as object)}
        whileHover={{ borderColor: "#4f6ef7" }}
        className={`
          border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors
          ${isDragActive
            ? "border-[#4f6ef7] bg-[#4f6ef7]/10"
            : "border-wb-border hover:border-wb-border2 hover:bg-wb-bg2"
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload size={22} className={`mx-auto mb-2 ${isDragActive ? "text-[#4f6ef7]" : "text-wb-muted"}`} />
        <p className="text-sm text-wb-text2">
          {isDragActive ? "Drop files here..." : "Drag & drop or click to browse"}
        </p>
        <p className="text-xs text-wb-muted mt-1">
          ControlManifest.xml · bundle.js · css/*.css
        </p>
        <div className="mt-3 pt-3 border-t border-wb-border">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); dirInputRef.current?.click(); }}
            className="text-xs text-[#4f6ef7] hover:underline"
          >
            Or select the entire <code className="font-mono">out/controls/ControlName/</code> folder
          </button>
        </div>
      </motion.div>

      <input
        ref={dirInputRef}
        type="file"
        style={{ display: "none" }}
        {...{ webkitdirectory: "", directory: "", multiple: true } as React.InputHTMLAttributes<HTMLInputElement>}
        onChange={handleDirInput}
      />

      {/* File status */}
      <div className="space-y-2">
        <FileStatus label="Manifest" file={manifestFile} icon={<FileText size={13} />} />
        <FileStatus label="Bundle" file={bundleFile} icon={<FileCode size={13} />} />
        {cssFiles.map((f, i) => (
          <FileStatus key={i} label="CSS" file={f} icon={<FileCode size={13} />} />
        ))}
        {cssFiles.length === 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded border border-wb-border bg-wb-panel text-xs text-wb-muted">
            <FileCode size={13} className="text-wb-muted" />
            <span>CSS</span>
            <span className="ml-auto">Optional — add css/*.css</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded bg-[#ef4444]/10 border border-[#ef4444]/20">
          <AlertCircle size={14} className="text-[#ef4444] shrink-0 mt-0.5" />
          <p className="text-xs text-[#ef4444]">{error}</p>
        </div>
      )}
    </div>
  );
};

const FileStatus: React.FC<{ label: string; file?: File | null; icon: React.ReactNode }> = ({ label, file, icon }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded border text-xs transition-colors
    ${file ? "border-[#22c55e]/30 bg-[#22c55e]/5" : "border-wb-border bg-wb-panel"}`}>
    <span className={file ? "text-[#22c55e]" : "text-wb-muted"}>{icon}</span>
    <span className={file ? "text-wb-text" : "text-wb-muted"}>{label}</span>
    {file ? (
      <span className="ml-auto text-wb-text2 truncate max-w-[140px]">{file.name}</span>
    ) : (
      <span className="ml-auto text-wb-muted">Not loaded</span>
    )}
  </div>
);

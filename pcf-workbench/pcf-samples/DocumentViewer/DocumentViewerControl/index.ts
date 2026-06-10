/**
 * DocumentViewerControl — PCF Samples
 * Namespace: PCFSamples
 * Version: 1.0.0
 *
 * Demonstrates:
 *  - context.webAPI.retrieveMultipleRecords on annotation entity
 *  - Base64 file preview for images (data URI) and PDFs (blob object URL)
 *  - context.device.pickFile — file upload picker
 *  - context.webAPI.createRecord with base64 documentbody payload
 *  - context.utils.getEntityMetadata — display name of regarding entity
 *  - context.webAPI.deleteRecord — delete annotation
 */

interface DocumentViewerParameters {
  regardingId: ComponentFramework.PropertyTypes.StringProperty;
  regardingEntityName: ComponentFramework.PropertyTypes.StringProperty;
  allowUpload: ComponentFramework.PropertyTypes.TwoOptionsProperty;
}

interface AnnotationRecord {
  annotationid: string;
  subject: string;
  notetext: string;
  filename: string;
  mimetype: string;
  documentbody: string;
  filesize: number;
  createdon: string;
  isdocument: boolean;
}

export class DocumentViewerControl
  implements ComponentFramework.StandardControl<DocumentViewerParameters, DocumentViewerParameters> {

  private _context!: ComponentFramework.Context<DocumentViewerParameters>;
  private _container!: HTMLDivElement;
  private _root!: HTMLDivElement;
  private _listEl!: HTMLDivElement;
  private _previewEl!: HTMLDivElement;
  private _entityDisplayName = "";

  // ── Lifecycle ────────────────────────────────────────────────────────────

  public init(
    context: ComponentFramework.Context<DocumentViewerParameters>,
    _notifyOutputChanged: () => void,
    _state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this._context = context;
    this._container = container;
    this._buildUI();
    this._loadEntityMetadata();
    this._loadAnnotations();
  }

  public updateView(context: ComponentFramework.Context<DocumentViewerParameters>): void {
    const prevId = this._context?.parameters?.regardingId?.raw;
    this._context = context;
    if (context.parameters.regardingId.raw !== prevId) {
      this._loadAnnotations();
    }
  }

  public getOutputs(): DocumentViewerParameters {
    return {} as DocumentViewerParameters;
  }

  public destroy(): void { /* no-op */ }

  // ── UI ────────────────────────────────────────────────────────────────────

  private _buildUI(): void {
    this._root = document.createElement("div");
    this._root.className = "dv-root";

    // Header
    const header = document.createElement("div");
    header.className = "dv-header";
    header.innerHTML = `
      <div class="dv-header-left">
        <span class="dv-header-icon">📂</span>
        <div>
          <div class="dv-header-title">Documents & Notes</div>
          <div class="dv-header-subtitle" id="dv-subtitle">Loading entity info…</div>
        </div>
      </div>
    `;

    const uploadBtn = document.createElement("button");
    uploadBtn.className = "dv-upload-btn";
    uploadBtn.id = "dv-upload-btn";
    uploadBtn.innerHTML = `📎 Upload File`;
    uploadBtn.addEventListener("click", () => this._pickAndUpload());
    header.appendChild(uploadBtn);

    // Layout: split list + preview
    const layout = document.createElement("div");
    layout.className = "dv-layout";

    this._listEl = document.createElement("div");
    this._listEl.className = "dv-list";

    this._previewEl = document.createElement("div");
    this._previewEl.className = "dv-preview";
    this._previewEl.innerHTML = `<div class="dv-preview-empty"><span>📄</span><p>Select a file to preview</p></div>`;

    layout.appendChild(this._listEl);
    layout.appendChild(this._previewEl);

    this._root.appendChild(header);
    this._root.appendChild(layout);
    this._container.appendChild(this._root);
  }

  // ── Entity Metadata ───────────────────────────────────────────────────────

  private async _loadEntityMetadata(): Promise<void> {
    const entityName = this._context.parameters.regardingEntityName.raw || "account";
    try {
      const meta = await this._context.utils.getEntityMetadata(entityName);
      this._entityDisplayName = meta.DisplayName || entityName;
    } catch {
      this._entityDisplayName = entityName;
    }
    const subtitle = this._root.querySelector("#dv-subtitle");
    if (subtitle) subtitle.textContent = `Files attached to ${this._entityDisplayName} record`;
  }

  // ── Load Annotations ──────────────────────────────────────────────────────

  private async _loadAnnotations(): Promise<void> {
    this._listEl.innerHTML = `<div class="dv-loading"><div class="dv-spinner"></div>Loading files…</div>`;
    const regardingId = this._context.parameters.regardingId.raw || "";

    if (!regardingId) {
      this._listEl.innerHTML = `<div class="dv-empty">No record ID provided.</div>`;
      return;
    }

    try {
      const res = await this._context.webAPI.retrieveMultipleRecords(
        "annotation",
        `?$select=annotationid,subject,notetext,filename,mimetype,filesize,createdon,isdocument` +
        `&$filter=_objectid_value eq '${regardingId}'` +
        `&$orderby=createdon desc&$top=50`
      );

      const annotations = res.entities as unknown as AnnotationRecord[];

      if (!annotations.length) {
        this._listEl.innerHTML = `<div class="dv-empty">📭 No files or notes attached.</div>`;
        return;
      }

      this._renderList(annotations);
    } catch (err) {
      this._listEl.innerHTML = `<div class="dv-error">⚠ Failed to load: ${err instanceof Error ? err.message : String(err)}</div>`;
    }
  }

  private _renderList(annotations: AnnotationRecord[]): void {
    this._listEl.innerHTML = "";
    annotations.forEach(a => {
      const item = document.createElement("div");
      item.className = "dv-list-item";
      const ext = this._getExt(a.filename);
      const icon = this._fileIcon(a.mimetype, a.filename);
      const size = a.filesize ? this._formatSize(a.filesize) : "";
      const date = a.createdon ? new Date(a.createdon).toLocaleDateString() : "";

      item.innerHTML = `
        <div class="dv-item-icon">${icon}</div>
        <div class="dv-item-info">
          <div class="dv-item-name">${a.filename || a.subject || "(Untitled)"}</div>
          <div class="dv-item-meta">${[ext?.toUpperCase(), size, date].filter(Boolean).join(" · ")}</div>
          ${a.notetext ? `<div class="dv-item-note">${a.notetext}</div>` : ""}
        </div>
        <div class="dv-item-actions">
          <button class="dv-action-preview" title="Preview">👁</button>
          <button class="dv-action-delete" title="Delete">🗑</button>
        </div>
      `;

      item.querySelector(".dv-action-preview")?.addEventListener("click", () => {
        this._previewAnnotation(a);
        this._listEl.querySelectorAll(".dv-list-item").forEach(i => i.classList.remove("dv-item-active"));
        item.classList.add("dv-item-active");
      });
      item.querySelector(".dv-action-delete")?.addEventListener("click", () => {
        this._deleteAnnotation(a.annotationid, item);
      });

      this._listEl.appendChild(item);
    });
  }

  // ── Preview ───────────────────────────────────────────────────────────────

  private _previewAnnotation(a: AnnotationRecord): void {
    this._previewEl.innerHTML = "";

    const header = document.createElement("div");
    header.className = "dv-preview-header";
    header.innerHTML = `
      <div class="dv-preview-title">${a.filename || a.subject || "(Untitled)"}</div>
      <div class="dv-preview-meta">${a.notetext || ""}</div>
    `;
    this._previewEl.appendChild(header);

    if (!a.documentbody) {
      this._previewEl.innerHTML += `<div class="dv-preview-empty"><span>📝</span><p>Note only — no attachment</p><p class="dv-note-text">${a.notetext || ""}</p></div>`;
      return;
    }

    const mime = a.mimetype || "";
    const dataUri = `data:${mime};base64,${a.documentbody}`;

    if (mime.startsWith("image/")) {
      const img = document.createElement("img");
      img.className = "dv-preview-image";
      img.src = dataUri;
      img.alt = a.filename;
      this._previewEl.appendChild(img);
    } else if (mime === "application/pdf") {
      // Decode base64 to blob for PDF
      try {
        const bytes = atob(a.documentbody);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        const blob = new Blob([arr], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const embed = document.createElement("embed");
        embed.className = "dv-preview-pdf";
        embed.src = url;
        embed.type = "application/pdf";
        this._previewEl.appendChild(embed);
      } catch {
        this._previewEl.innerHTML += `<div class="dv-preview-empty">⚠ Cannot preview this PDF.</div>`;
      }
    } else if (mime.startsWith("text/")) {
      const pre = document.createElement("pre");
      pre.className = "dv-preview-text";
      try { pre.textContent = atob(a.documentbody); } catch { pre.textContent = "(Cannot decode text)"; }
      this._previewEl.appendChild(pre);
    } else {
      const icon = this._fileIcon(mime, a.filename);
      this._previewEl.innerHTML += `
        <div class="dv-preview-empty">
          <span style="font-size:48px">${icon}</span>
          <p>${a.filename}</p>
          <p class="dv-meta-gray">${mime} · ${this._formatSize(a.filesize)}</p>
          <p>Preview not available for this file type.</p>
        </div>`;
    }
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  private async _pickAndUpload(): Promise<void> {
    const uploadBtn = this._root.querySelector("#dv-upload-btn") as HTMLButtonElement;
    try {
      const files = await this._context.device.pickFile({
        accept: "any",
        allowMultipleFiles: false,
        maximumAllowedFileSize: 10485760, // 10 MB
      });

      if (!files || !files.length) return;

      const file = files[0];
      uploadBtn.disabled = true;
      uploadBtn.textContent = "Uploading…";

      const regardingId = this._context.parameters.regardingId.raw || "";
      const regardingEntity = this._context.parameters.regardingEntityName.raw || "account";

      const payload: Record<string, unknown> = {
        subject: file.fileName,
        filename: file.fileName,
        mimetype: file.mimeType || "application/octet-stream",
        documentbody: file.fileContent, // already base64 from pickFile
        isdocument: true,
        filesize: file.fileSize || 0,
        _objectid_value: regardingId,
        [`objectid_${regardingEntity}@odata.bind`]: `/${regardingEntity}s(${regardingId})`,
        objecttypecode: regardingEntity,
      };

      await this._context.webAPI.createRecord("annotation", payload);
      await this._loadAnnotations();
    } catch (err) {
      if (err instanceof Error && err.message !== "cancelled") {
        alert(`Upload failed: ${err.message}`);
      }
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = "📎 Upload File";
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  private async _deleteAnnotation(annotationId: string, el: HTMLDivElement): Promise<void> {
    const btn = el.querySelector(".dv-action-delete") as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = "…";

    try {
      await this._context.webAPI.deleteRecord("annotation", annotationId);
      el.classList.add("dv-item-removing");
      setTimeout(() => el.remove(), 300);
      this._previewEl.innerHTML = `<div class="dv-preview-empty"><span>📄</span><p>File deleted</p></div>`;
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "🗑";
      alert(`Delete failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private _fileIcon(mime: string, filename: string): string {
    if (!mime && filename) {
      const ext = this._getExt(filename);
      if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return "🖼";
      if (ext === "pdf") return "📕";
      if (["doc","docx"].includes(ext)) return "📘";
      if (["xls","xlsx"].includes(ext)) return "📗";
      if (["ppt","pptx"].includes(ext)) return "📙";
      if (["zip","rar","7z"].includes(ext)) return "🗜";
      if (["txt","csv","log"].includes(ext)) return "📄";
    }
    if (mime?.startsWith("image/")) return "🖼";
    if (mime === "application/pdf") return "📕";
    if (mime?.includes("word")) return "📘";
    if (mime?.includes("excel") || mime?.includes("spreadsheet")) return "📗";
    if (mime?.includes("powerpoint") || mime?.includes("presentation")) return "📙";
    if (mime?.startsWith("text/")) return "📄";
    if (mime?.includes("zip") || mime?.includes("compressed")) return "🗜";
    return "📎";
  }

  private _getExt(filename: string): string {
    if (!filename) return "";
    const parts = filename.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  }

  private _formatSize(bytes: number): string {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }
}

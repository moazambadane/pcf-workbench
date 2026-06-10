/**
 * SmartLookupControl — PCF Samples
 * Namespace: PCFSamples
 * Version: 1.0.0
 *
 * Demonstrates:
 *  - context.webAPI.retrieveMultipleRecords with $filter and $select
 *  - Debounced input handling
 *  - Chained API calls (search + preview card detail fetch)
 *  - notifyOutputChanged with entity reference output
 *  - Keyboard navigation (arrow keys, Enter, Escape)
 */

interface SmartLookupParameters {
  entityLogicalName: ComponentFramework.PropertyTypes.StringProperty;
  searchFields: ComponentFramework.PropertyTypes.StringProperty;
  primaryField: ComponentFramework.PropertyTypes.StringProperty;
  selectedId: ComponentFramework.PropertyTypes.StringProperty;
  selectedName: ComponentFramework.PropertyTypes.StringProperty;
}

interface SearchResult {
  id: string;
  name: string;
  subtitle: string;
  raw: Record<string, string>;
}

export class SmartLookupControl
  implements ComponentFramework.StandardControl<SmartLookupParameters, SmartLookupParameters> {

  private _context!: ComponentFramework.Context<SmartLookupParameters>;
  private _notifyOutputChanged!: () => void;
  private _container!: HTMLDivElement;

  private _root!: HTMLDivElement;
  private _input!: HTMLInputElement;
  private _dropdown!: HTMLDivElement;
  private _previewCard!: HTMLDivElement;
  private _selectedTag!: HTMLDivElement;

  private _debounceTimer: number | null = null;
  private _results: SearchResult[] = [];
  private _activeIndex = -1;
  private _selectedId: string | null = null;
  private _selectedName: string | null = null;
  private _previewTimer: number | null = null;
  private _open = false;

  // ── Lifecycle ────────────────────────────────────────────────────────────

  public init(
    context: ComponentFramework.Context<SmartLookupParameters>,
    notifyOutputChanged: () => void,
    _state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this._context = context;
    this._notifyOutputChanged = notifyOutputChanged;
    this._container = container;
    this._buildUI();
  }

  public updateView(context: ComponentFramework.Context<SmartLookupParameters>): void {
    this._context = context;
  }

  public getOutputs(): SmartLookupParameters {
    return {
      entityLogicalName: this._context.parameters.entityLogicalName,
      searchFields: this._context.parameters.searchFields,
      primaryField: this._context.parameters.primaryField,
      selectedId: { raw: this._selectedId } as ComponentFramework.PropertyTypes.StringProperty,
      selectedName: { raw: this._selectedName } as ComponentFramework.PropertyTypes.StringProperty,
    };
  }

  public destroy(): void {
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    if (this._previewTimer) clearTimeout(this._previewTimer);
  }

  // ── UI Build ─────────────────────────────────────────────────────────────

  private _buildUI(): void {
    this._root = document.createElement("div");
    this._root.className = "sl-root";

    // Search input row
    const inputRow = document.createElement("div");
    inputRow.className = "sl-input-row";

    const searchIcon = document.createElement("span");
    searchIcon.className = "sl-search-icon";
    searchIcon.textContent = "⌕";

    this._input = document.createElement("input");
    this._input.type = "text";
    this._input.className = "sl-input";
    this._input.placeholder = "Search records…";
    this._input.setAttribute("autocomplete", "off");
    this._input.addEventListener("input", () => this._onInput());
    this._input.addEventListener("keydown", (e) => this._onKeyDown(e));
    this._input.addEventListener("focus", () => { if (this._results.length) this._showDropdown(); });
    this._input.addEventListener("blur", () => setTimeout(() => this._hideDropdown(), 200));

    const clearBtn = document.createElement("button");
    clearBtn.className = "sl-clear-btn";
    clearBtn.textContent = "✕";
    clearBtn.title = "Clear selection";
    clearBtn.addEventListener("click", () => this._clearSelection());

    inputRow.appendChild(searchIcon);
    inputRow.appendChild(this._input);
    inputRow.appendChild(clearBtn);

    // Selected tag
    this._selectedTag = document.createElement("div");
    this._selectedTag.className = "sl-selected-tag sl-hidden";

    // Dropdown
    this._dropdown = document.createElement("div");
    this._dropdown.className = "sl-dropdown sl-hidden";

    // Preview card
    this._previewCard = document.createElement("div");
    this._previewCard.className = "sl-preview-card sl-hidden";

    this._root.appendChild(inputRow);
    this._root.appendChild(this._selectedTag);
    this._root.appendChild(this._dropdown);
    this._root.appendChild(this._previewCard);
    this._container.appendChild(this._root);

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (!this._root.contains(e.target as Node)) this._hideDropdown();
    });
  }

  // ── Search ────────────────────────────────────────────────────────────────

  private _onInput(): void {
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    const q = this._input.value.trim();
    if (!q) { this._hideDropdown(); return; }
    this._debounceTimer = window.setTimeout(() => this._search(q), 300);
  }

  private async _search(query: string): Promise<void> {
    const entity = this._context.parameters.entityLogicalName.raw || "contact";
    const searchFields = (this._context.parameters.searchFields.raw || "fullname,emailaddress1")
      .split(",").map(f => f.trim()).filter(Boolean);
    const primaryField = this._context.parameters.primaryField.raw || "fullname";

    const entityIdField = `${entity}id`;
    const selectFields = [entityIdField, ...searchFields].join(",");

    // Build OR filter: each search field contains query
    const filterParts = searchFields.map(f => `contains(${f},'${query.replace(/'/g, "''")}')`);
    const filter = filterParts.join(" or ");

    this._setDropdownLoading(true);

    try {
      const result = await this._context.webAPI.retrieveMultipleRecords(
        entity,
        `?$select=${selectFields}&$filter=${filter}&$top=8`
      );

      this._results = result.entities.map((e: Record<string, unknown>) => ({
        id: String(e[entityIdField] || ""),
        name: String(e[primaryField] || "(no name)"),
        subtitle: searchFields
          .filter(f => f !== primaryField && e[f])
          .map(f => String(e[f]))
          .join(" · "),
        raw: e as Record<string, string>,
      }));

      this._renderDropdown();
    } catch (err) {
      this._setDropdownError(`Search failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ── Preview Card ──────────────────────────────────────────────────────────

  private async _loadPreview(result: SearchResult): Promise<void> {
    if (this._previewTimer) clearTimeout(this._previewTimer);
    this._previewTimer = window.setTimeout(async () => {
      const entity = this._context.parameters.entityLogicalName.raw || "contact";
      this._previewCard.className = "sl-preview-card sl-preview-loading";
      this._previewCard.innerHTML = `<div class="sl-preview-spinner">Loading preview…</div>`;

      try {
        // Second API call — fetch richer detail for this specific record
        const detail = await this._context.webAPI.retrieveMultipleRecords(
          entity,
          `?$select=*&$filter=${entity}id eq '${result.id}'&$top=1`
        );
        const rec = detail.entities[0] || result.raw;
        this._renderPreview(rec as Record<string, unknown>, result.name);
      } catch {
        this._renderPreview(result.raw as Record<string, unknown>, result.name);
      }
    }, 400);
  }

  private _renderPreview(rec: Record<string, unknown>, name: string): void {
    const fields = Object.entries(rec)
      .filter(([k]) => !k.startsWith("@") && !k.includes("odata") && !k.endsWith("id"))
      .slice(0, 6);

    this._previewCard.className = "sl-preview-card";
    this._previewCard.innerHTML = `
      <div class="sl-preview-header">
        <div class="sl-preview-avatar">${name.charAt(0).toUpperCase()}</div>
        <div class="sl-preview-title">${name}</div>
      </div>
      <div class="sl-preview-fields">
        ${fields.map(([k, v]) => `
          <div class="sl-preview-row">
            <span class="sl-preview-label">${k}</span>
            <span class="sl-preview-value">${v != null ? String(v) : "—"}</span>
          </div>`).join("")}
      </div>
    `;
  }

  // ── Dropdown Render ───────────────────────────────────────────────────────

  private _renderDropdown(): void {
    this._dropdown.innerHTML = "";
    this._activeIndex = -1;

    if (!this._results.length) {
      this._dropdown.innerHTML = `<div class="sl-no-results">No records found</div>`;
      this._showDropdown();
      return;
    }

    this._results.forEach((r, idx) => {
      const item = document.createElement("div");
      item.className = "sl-item";
      item.dataset.index = String(idx);
      item.innerHTML = `
        <div class="sl-item-avatar">${r.name.charAt(0).toUpperCase()}</div>
        <div class="sl-item-text">
          <div class="sl-item-name">${this._highlight(r.name, this._input.value)}</div>
          ${r.subtitle ? `<div class="sl-item-subtitle">${r.subtitle}</div>` : ""}
        </div>
        <div class="sl-item-arrow">›</div>
      `;
      item.addEventListener("mouseenter", () => {
        this._setActiveIndex(idx);
        this._loadPreview(r);
      });
      item.addEventListener("mouseleave", () => {
        if (this._previewTimer) clearTimeout(this._previewTimer);
      });
      item.addEventListener("click", () => this._selectResult(r));
      this._dropdown.appendChild(item);
    });

    this._showDropdown();
  }

  private _highlight(text: string, query: string): string {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
  }

  private _setDropdownLoading(show: boolean): void {
    if (show) {
      this._dropdown.innerHTML = `<div class="sl-loading"><div class="sl-spinner"></div> Searching…</div>`;
      this._showDropdown();
    }
  }

  private _setDropdownError(msg: string): void {
    this._dropdown.innerHTML = `<div class="sl-error">${msg}</div>`;
    this._showDropdown();
  }

  private _showDropdown(): void {
    this._open = true;
    this._dropdown.classList.remove("sl-hidden");
  }

  private _hideDropdown(): void {
    this._open = false;
    this._dropdown.classList.add("sl-hidden");
    this._previewCard.classList.add("sl-hidden");
    this._previewCard.className = "sl-preview-card sl-hidden";
    if (this._previewTimer) clearTimeout(this._previewTimer);
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  private _selectResult(r: SearchResult): void {
    this._selectedId = r.id;
    this._selectedName = r.name;
    this._input.value = "";
    this._hideDropdown();

    this._selectedTag.className = "sl-selected-tag";
    this._selectedTag.innerHTML = `
      <div class="sl-tag-avatar">${r.name.charAt(0).toUpperCase()}</div>
      <span class="sl-tag-name">${r.name}</span>
      <button class="sl-tag-remove" title="Remove">✕</button>
    `;
    const removeBtn = this._selectedTag.querySelector(".sl-tag-remove");
    removeBtn?.addEventListener("click", () => this._clearSelection());

    this._notifyOutputChanged();
  }

  private _clearSelection(): void {
    this._selectedId = null;
    this._selectedName = null;
    this._selectedTag.className = "sl-selected-tag sl-hidden";
    this._input.value = "";
    this._notifyOutputChanged();
  }

  // ── Keyboard Navigation ───────────────────────────────────────────────────

  private _onKeyDown(e: KeyboardEvent): void {
    if (!this._open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      this._setActiveIndex(Math.min(this._activeIndex + 1, this._results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this._setActiveIndex(Math.max(this._activeIndex - 1, 0));
    } else if (e.key === "Enter" && this._activeIndex >= 0) {
      e.preventDefault();
      this._selectResult(this._results[this._activeIndex]);
    } else if (e.key === "Escape") {
      this._hideDropdown();
    }
  }

  private _setActiveIndex(idx: number): void {
    const items = this._dropdown.querySelectorAll<HTMLDivElement>(".sl-item");
    items.forEach(i => i.classList.remove("sl-item-active"));
    this._activeIndex = idx;
    if (idx >= 0 && items[idx]) {
      items[idx].classList.add("sl-item-active");
      items[idx].scrollIntoView({ block: "nearest" });
    }
  }
}

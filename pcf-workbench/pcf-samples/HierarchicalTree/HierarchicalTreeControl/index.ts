/**
 * HierarchicalTreeControl — PCF Samples
 * Namespace: PCFSamples
 * Version: 1.0.0
 *
 * Demonstrates:
 *  - Recursive context.webAPI.retrieveMultipleRecords with $filter on parent lookup
 *  - Lazy-load children on expand (click node → fetch children on demand)
 *  - Expandable/collapsible tree with loading skeleton per node
 *  - Right-click context menu with:
 *      • Open Record → context.navigation.openForm
 *      • Create Child → context.webAPI.createRecord
 *      • Delete → context.webAPI.deleteRecord
 *  - notifyOutputChanged with selected record id
 *  - Complex tree state management
 */

interface HierarchicalTreeParameters {
  rootRecordId: ComponentFramework.PropertyTypes.StringProperty;
  entityLogicalName: ComponentFramework.PropertyTypes.StringProperty;
  parentField: ComponentFramework.PropertyTypes.StringProperty;
  nameField: ComponentFramework.PropertyTypes.StringProperty;
  selectedRecordId: ComponentFramework.PropertyTypes.StringProperty;
}

interface TreeNode {
  id: string;
  name: string;
  depth: number;
  expanded: boolean;
  loaded: boolean;
  loading: boolean;
  children: TreeNode[];
  el?: HTMLDivElement;
}

export class HierarchicalTreeControl
  implements ComponentFramework.StandardControl<HierarchicalTreeParameters, HierarchicalTreeParameters> {

  private _context!: ComponentFramework.Context<HierarchicalTreeParameters>;
  private _notifyOutputChanged!: () => void;
  private _container!: HTMLDivElement;

  private _root!: HTMLDivElement;
  private _treeEl!: HTMLDivElement;
  private _contextMenu!: HTMLDivElement;
  private _rootNode: TreeNode | null = null;
  private _selectedId: string | null = null;

  // ── Lifecycle ────────────────────────────────────────────────────────────

  public init(
    context: ComponentFramework.Context<HierarchicalTreeParameters>,
    notifyOutputChanged: () => void,
    _state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this._context = context;
    this._notifyOutputChanged = notifyOutputChanged;
    this._container = container;
    this._buildUI();
    this._loadRootNode();
  }

  public updateView(context: ComponentFramework.Context<HierarchicalTreeParameters>): void {
    const prevId = this._context?.parameters?.rootRecordId?.raw;
    this._context = context;
    if (context.parameters.rootRecordId.raw !== prevId) {
      this._loadRootNode();
    }
  }

  public getOutputs(): HierarchicalTreeParameters {
    return {
      rootRecordId: this._context.parameters.rootRecordId,
      entityLogicalName: this._context.parameters.entityLogicalName,
      parentField: this._context.parameters.parentField,
      nameField: this._context.parameters.nameField,
      selectedRecordId: { raw: this._selectedId } as ComponentFramework.PropertyTypes.StringProperty,
    };
  }

  public destroy(): void {
    document.removeEventListener("click", this._hideContextMenu);
  }

  // ── UI Build ─────────────────────────────────────────────────────────────

  private _buildUI(): void {
    this._root = document.createElement("div");
    this._root.className = "ht-root";

    // Header
    const header = document.createElement("div");
    header.className = "ht-header";
    header.innerHTML = `
      <div class="ht-header-left">
        <span class="ht-header-icon">🌳</span>
        <div>
          <div class="ht-header-title">Record Hierarchy</div>
          <div class="ht-header-subtitle" id="ht-subtitle">Loading…</div>
        </div>
      </div>
    `;
    const refreshBtn = document.createElement("button");
    refreshBtn.className = "ht-refresh-btn";
    refreshBtn.textContent = "↻ Refresh";
    refreshBtn.addEventListener("click", () => this._loadRootNode());
    header.appendChild(refreshBtn);

    // Tree container
    this._treeEl = document.createElement("div");
    this._treeEl.className = "ht-tree";

    // Context menu
    this._contextMenu = document.createElement("div");
    this._contextMenu.className = "ht-ctx-menu ht-hidden";

    this._root.appendChild(header);
    this._root.appendChild(this._treeEl);
    this._root.appendChild(this._contextMenu);
    this._container.appendChild(this._root);

    // Close context menu on outside click
    this._hideContextMenu = this._hideContextMenu.bind(this);
    document.addEventListener("click", this._hideContextMenu);
  }

  // ── Data Loading ──────────────────────────────────────────────────────────

  private async _loadRootNode(): Promise<void> {
    this._treeEl.innerHTML = this._skeletonRows(1, 0);
    const rootId = this._context.parameters.rootRecordId.raw || "";
    const entity = this._entityName();
    const nameField = this._nameField();
    const idField = `${entity}id`;

    if (!rootId) {
      this._treeEl.innerHTML = `<div class="ht-empty">No root record ID provided.</div>`;
      return;
    }

    try {
      const res = await this._context.webAPI.retrieveMultipleRecords(
        entity,
        `?$select=${idField},${nameField}&$filter=${idField} eq '${rootId}'&$top=1`
      );

      if (!res.entities.length) {
        this._treeEl.innerHTML = `<div class="ht-empty">Root record not found.</div>`;
        return;
      }

      const rec = res.entities[0];
      this._rootNode = {
        id: String(rec[idField]),
        name: String(rec[nameField] || "(Unnamed)"),
        depth: 0,
        expanded: false,
        loaded: false,
        loading: false,
        children: [],
      };

      const subtitle = this._root.querySelector("#ht-subtitle");
      if (subtitle) subtitle.textContent = `${entity} hierarchy`;

      this._treeEl.innerHTML = "";
      this._renderNode(this._rootNode, this._treeEl);

      // Auto-expand root
      await this._toggleExpand(this._rootNode);
    } catch (err) {
      this._treeEl.innerHTML = `<div class="ht-error">⚠ ${err instanceof Error ? err.message : String(err)}</div>`;
    }
  }

  private async _fetchChildren(parentId: string): Promise<TreeNode[]> {
    const entity = this._entityName();
    const parentField = this._parentField();
    const nameField = this._nameField();
    const idField = `${entity}id`;

    const res = await this._context.webAPI.retrieveMultipleRecords(
      entity,
      `?$select=${idField},${nameField}` +
      `&$filter=_${parentField}_value eq '${parentId}'` +
      `&$orderby=${nameField} asc&$top=100`
    );

    return res.entities.map((e: Record<string, unknown>) => ({
      id: String(e[idField]),
      name: String(e[nameField] || "(Unnamed)"),
      depth: 0, // set by caller
      expanded: false,
      loaded: false,
      loading: false,
      children: [],
    }));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  private _renderNode(node: TreeNode, parentEl: HTMLDivElement): void {
    const row = document.createElement("div");
    row.className = `ht-row ${this._selectedId === node.id ? "ht-row-selected" : ""}`;
    row.style.paddingLeft = `${16 + node.depth * 20}px`;
    row.dataset.id = node.id;
    node.el = row;

    const chevron = document.createElement("span");
    chevron.className = `ht-chevron ${node.expanded ? "ht-chevron-open" : ""}`;
    chevron.textContent = "▶";
    chevron.addEventListener("click", (e) => {
      e.stopPropagation();
      this._toggleExpand(node);
    });

    const icon = document.createElement("span");
    icon.className = "ht-node-icon";
    icon.textContent = node.depth === 0 ? "🏢" : "📁";

    const label = document.createElement("span");
    label.className = "ht-node-label";
    label.textContent = node.name;

    const childCount = document.createElement("span");
    childCount.className = "ht-child-count";
    childCount.id = `ht-count-${node.id}`;
    if (node.loaded && node.children.length) {
      childCount.textContent = `(${node.children.length})`;
    }

    row.appendChild(chevron);
    row.appendChild(icon);
    row.appendChild(label);
    row.appendChild(childCount);

    // Click to select
    row.addEventListener("click", () => this._selectNode(node));

    // Right-click context menu
    row.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this._showContextMenu(e, node);
    });

    parentEl.appendChild(row);

    // Children container
    const childContainer = document.createElement("div");
    childContainer.className = `ht-children ${node.expanded ? "" : "ht-hidden"}`;
    childContainer.id = `ht-children-${node.id}`;
    parentEl.appendChild(childContainer);

    // Render loaded children
    if (node.expanded && node.loaded) {
      node.children.forEach(child => this._renderNode(child, childContainer));
      if (!node.children.length) {
        const empty = document.createElement("div");
        empty.className = "ht-leaf-hint";
        empty.style.paddingLeft = `${36 + node.depth * 20}px`;
        empty.textContent = "— No child records";
        childContainer.appendChild(empty);
      }
    }
  }

  // ── Expand / Collapse ─────────────────────────────────────────────────────

  private async _toggleExpand(node: TreeNode): Promise<void> {
    if (node.expanded) {
      // Collapse
      node.expanded = false;
      const childContainer = this._treeEl.querySelector(`#ht-children-${node.id}`) as HTMLDivElement;
      if (childContainer) childContainer.classList.add("ht-hidden");
      const chevron = node.el?.querySelector(".ht-chevron");
      if (chevron) chevron.classList.remove("ht-chevron-open");
      return;
    }

    // Expand
    node.expanded = true;
    const chevron = node.el?.querySelector(".ht-chevron");
    if (chevron) chevron.classList.add("ht-chevron-open");

    let childContainer = this._treeEl.querySelector(`#ht-children-${node.id}`) as HTMLDivElement;
    if (!childContainer) {
      childContainer = document.createElement("div");
      childContainer.className = "ht-children";
      childContainer.id = `ht-children-${node.id}`;
      node.el?.after(childContainer);
    }
    childContainer.classList.remove("ht-hidden");

    if (!node.loaded) {
      // Show skeleton while loading
      node.loading = true;
      childContainer.innerHTML = this._skeletonRows(3, node.depth + 1);

      try {
        const children = await this._fetchChildren(node.id);
        children.forEach(c => { c.depth = node.depth + 1; });
        node.children = children;
        node.loaded = true;

        // Update count badge
        const countEl = this._treeEl.querySelector(`#ht-count-${node.id}`);
        if (countEl && children.length) countEl.textContent = `(${children.length})`;

        childContainer.innerHTML = "";
        if (children.length) {
          children.forEach(child => this._renderNode(child, childContainer));
        } else {
          const empty = document.createElement("div");
          empty.className = "ht-leaf-hint";
          empty.style.paddingLeft = `${36 + node.depth * 20}px`;
          empty.textContent = "— No child records";
          childContainer.appendChild(empty);
        }
      } catch (err) {
        childContainer.innerHTML = `<div class="ht-error" style="padding-left:${36 + node.depth * 20}px">
          ⚠ Failed to load children: ${err instanceof Error ? err.message : String(err)}</div>`;
      } finally {
        node.loading = false;
      }
    }
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  private _selectNode(node: TreeNode): void {
    this._selectedId = node.id;
    this._treeEl.querySelectorAll<HTMLDivElement>(".ht-row").forEach(r => {
      r.classList.toggle("ht-row-selected", r.dataset.id === node.id);
    });
    this._notifyOutputChanged();
  }

  // ── Context Menu ──────────────────────────────────────────────────────────

  private _showContextMenu(e: MouseEvent, node: TreeNode): void {
    const entity = this._entityName();
    const parentField = this._parentField();

    this._contextMenu.className = "ht-ctx-menu";
    this._contextMenu.style.top = `${e.clientY}px`;
    this._contextMenu.style.left = `${e.clientX}px`;
    this._contextMenu.innerHTML = `
      <button class="ht-ctx-item" data-action="open">📂 Open Record</button>
      <button class="ht-ctx-item" data-action="create">➕ Create Child</button>
      <div class="ht-ctx-divider"></div>
      <button class="ht-ctx-item ht-ctx-danger" data-action="delete">🗑 Delete</button>
    `;

    this._contextMenu.querySelector('[data-action="open"]')?.addEventListener("click", () => {
      this._hideContextMenu();
      this._context.navigation.openForm({
        entityName: entity,
        entityId: node.id,
      });
    });

    this._contextMenu.querySelector('[data-action="create"]')?.addEventListener("click", async () => {
      this._hideContextMenu();
      const name = prompt("Enter name for the new child record:");
      if (!name) return;

      try {
        const payload: Record<string, unknown> = {
          [this._nameField()]: name,
          [`${parentField}@odata.bind`]: `/${entity}s(${node.id})`,
        };
        await this._context.webAPI.createRecord(entity, payload);

        // Reload children
        node.loaded = false;
        node.expanded = false;
        await this._toggleExpand(node);
      } catch (err) {
        alert(`Create failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    });

    this._contextMenu.querySelector('[data-action="delete"]')?.addEventListener("click", async () => {
      this._hideContextMenu();
      if (!confirm(`Delete "${node.name}"? This may affect child records.`)) return;

      try {
        await this._context.webAPI.deleteRecord(entity, node.id);
        // Remove from DOM
        const childContainer = this._treeEl.querySelector(`#ht-children-${node.id}`);
        node.el?.remove();
        childContainer?.remove();
      } catch (err) {
        alert(`Delete failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    });
  }

  private _hideContextMenu(): void {
    this._contextMenu.classList.add("ht-hidden");
  }

  // ── Skeleton ──────────────────────────────────────────────────────────────

  private _skeletonRows(count: number, depth: number): string {
    return Array(count).fill("").map(() =>
      `<div class="ht-row ht-skeleton" style="padding-left:${16 + depth * 20}px">
        <span class="ht-sk-chevron"></span>
        <span class="ht-sk-icon"></span>
        <span class="ht-sk-label"></span>
      </div>`
    ).join("");
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private _entityName(): string {
    return this._context.parameters.entityLogicalName.raw || "account";
  }

  private _parentField(): string {
    return this._context.parameters.parentField.raw || "parentaccountid";
  }

  private _nameField(): string {
    return this._context.parameters.nameField.raw || "name";
  }
}

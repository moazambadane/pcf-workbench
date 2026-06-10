/**
 * TimelineFeedControl — PCF Samples
 * Namespace: PCFSamples
 * Version: 1.0.0
 *
 * Demonstrates:
 *  - context.webAPI.retrieveMultipleRecords across multiple entity types
 *    (task, phonecall, email, annotation) filtered by regardingobjectid
 *  - context.webAPI.createRecord — Add Task dialog
 *  - context.webAPI.updateRecord — Mark task complete
 *  - context.webAPI.deleteRecord — Delete activity
 *  - Real-time list refresh after mutations
 *  - Complex $filter with lookup field (regardingobjectid eq guid)
 *  - Chronological sorting across entity types
 */

interface TimelineFeedParameters {
  regardingId: ComponentFramework.PropertyTypes.StringProperty;
  regardingEntityName: ComponentFramework.PropertyTypes.StringProperty;
  maxItems: ComponentFramework.PropertyTypes.WholeNumberProperty;
}

interface ActivityItem {
  id: string;
  entity: string;
  type: "task" | "phonecall" | "email" | "annotation";
  icon: string;
  subject: string;
  description: string;
  date: Date;
  statecode: number;
  raw: Record<string, unknown>;
}

export class TimelineFeedControl
  implements ComponentFramework.StandardControl<TimelineFeedParameters, TimelineFeedParameters> {

  private _context!: ComponentFramework.Context<TimelineFeedParameters>;
  private _notifyOutputChanged!: () => void;
  private _container!: HTMLDivElement;

  private _root!: HTMLDivElement;
  private _feedList!: HTMLDivElement;
  private _activities: ActivityItem[] = [];
  private _loading = false;

  // ── Lifecycle ────────────────────────────────────────────────────────────

  public init(
    context: ComponentFramework.Context<TimelineFeedParameters>,
    notifyOutputChanged: () => void,
    _state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this._context = context;
    this._notifyOutputChanged = notifyOutputChanged;
    this._container = container;
    this._buildUI();
    this._loadActivities();
  }

  public updateView(context: ComponentFramework.Context<TimelineFeedParameters>): void {
    const prevId = this._context?.parameters?.regardingId?.raw;
    this._context = context;
    if (context.parameters.regardingId.raw !== prevId) {
      this._loadActivities();
    }
  }

  public getOutputs(): TimelineFeedParameters {
    return {} as TimelineFeedParameters;
  }

  public destroy(): void { /* no cleanup needed */ }

  // ── UI Build ─────────────────────────────────────────────────────────────

  private _buildUI(): void {
    this._root = document.createElement("div");
    this._root.className = "tl-root";

    // Header
    const header = document.createElement("div");
    header.className = "tl-header";
    header.innerHTML = `
      <div class="tl-header-left">
        <span class="tl-header-icon">⏱</span>
        <span class="tl-header-title">Activity Timeline</span>
      </div>
    `;
    const addBtn = document.createElement("button");
    addBtn.className = "tl-add-btn";
    addBtn.innerHTML = `<span>+</span> Add Task`;
    addBtn.addEventListener("click", () => this._showAddTaskDialog());
    header.querySelector(".tl-header-left")!.after(addBtn);

    // Filter tabs
    const tabs = document.createElement("div");
    tabs.className = "tl-tabs";
    ["All", "Tasks", "Calls", "Emails", "Notes"].forEach((label, i) => {
      const tab = document.createElement("button");
      tab.className = `tl-tab ${i === 0 ? "tl-tab-active" : ""}`;
      tab.textContent = label;
      tab.dataset.filter = label.toLowerCase();
      tab.addEventListener("click", () => this._filterBy(label.toLowerCase(), tabs));
      tabs.appendChild(tab);
    });

    // Feed list
    this._feedList = document.createElement("div");
    this._feedList.className = "tl-feed";

    this._root.appendChild(header);
    this._root.appendChild(tabs);
    this._root.appendChild(this._feedList);
    this._container.appendChild(this._root);
  }

  // ── Data Loading ──────────────────────────────────────────────────────────

  private async _loadActivities(): Promise<void> {
    if (this._loading) return;
    this._loading = true;
    this._setFeedState("loading");

    const regardingId = this._context.parameters.regardingId.raw || "";
    const maxItems = this._context.parameters.maxItems.raw || 20;

    if (!regardingId) {
      this._setFeedState("empty", "No regarding record ID provided.");
      this._loading = false;
      return;
    }

    try {
      // Fetch all 4 entity types in parallel
      const [tasks, calls, emails, notes] = await Promise.all([
        this._fetchTasks(regardingId, maxItems),
        this._fetchPhoneCalls(regardingId, maxItems),
        this._fetchEmails(regardingId, maxItems),
        this._fetchAnnotations(regardingId, maxItems),
      ]);

      this._activities = [...tasks, ...calls, ...emails, ...notes]
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      this._renderFeed(this._activities);
    } catch (err) {
      this._setFeedState("error", `Failed to load activities: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this._loading = false;
    }
  }

  private async _fetchTasks(regardingId: string, top: number): Promise<ActivityItem[]> {
    const res = await this._context.webAPI.retrieveMultipleRecords(
      "task",
      `?$select=activityid,subject,description,scheduledend,statecode,createdon` +
      `&$filter=_regardingobjectid_value eq '${regardingId}'` +
      `&$top=${top}&$orderby=createdon desc`
    );
    return res.entities.map((e: Record<string, unknown>) => ({
      id: String(e["activityid"] || ""),
      entity: "task",
      type: "task" as const,
      icon: "✓",
      subject: String(e["subject"] || "(No subject)"),
      description: String(e["description"] || ""),
      date: new Date(String(e["createdon"] || e["scheduledend"] || new Date())),
      statecode: Number(e["statecode"] ?? 0),
      raw: e,
    }));
  }

  private async _fetchPhoneCalls(regardingId: string, top: number): Promise<ActivityItem[]> {
    const res = await this._context.webAPI.retrieveMultipleRecords(
      "phonecall",
      `?$select=activityid,subject,description,actualend,statecode,createdon,directioncode` +
      `&$filter=_regardingobjectid_value eq '${regardingId}'` +
      `&$top=${top}&$orderby=createdon desc`
    );
    return res.entities.map((e: Record<string, unknown>) => ({
      id: String(e["activityid"] || ""),
      entity: "phonecall",
      type: "phonecall" as const,
      icon: "☎",
      subject: String(e["subject"] || "(No subject)"),
      description: `${e["directioncode"] ? "Outbound" : "Inbound"} call`,
      date: new Date(String(e["createdon"] || new Date())),
      statecode: Number(e["statecode"] ?? 0),
      raw: e,
    }));
  }

  private async _fetchEmails(regardingId: string, top: number): Promise<ActivityItem[]> {
    const res = await this._context.webAPI.retrieveMultipleRecords(
      "email",
      `?$select=activityid,subject,description,actualend,statecode,createdon,directioncode` +
      `&$filter=_regardingobjectid_value eq '${regardingId}'` +
      `&$top=${top}&$orderby=createdon desc`
    );
    return res.entities.map((e: Record<string, unknown>) => ({
      id: String(e["activityid"] || ""),
      entity: "email",
      type: "email" as const,
      icon: "✉",
      subject: String(e["subject"] || "(No subject)"),
      description: String(e["description"] || ""),
      date: new Date(String(e["createdon"] || new Date())),
      statecode: Number(e["statecode"] ?? 0),
      raw: e,
    }));
  }

  private async _fetchAnnotations(regardingId: string, top: number): Promise<ActivityItem[]> {
    const res = await this._context.webAPI.retrieveMultipleRecords(
      "annotation",
      `?$select=annotationid,subject,notetext,createdon,filename,mimetype` +
      `&$filter=_objectid_value eq '${regardingId}'` +
      `&$top=${top}&$orderby=createdon desc`
    );
    return res.entities.map((e: Record<string, unknown>) => ({
      id: String(e["annotationid"] || ""),
      entity: "annotation",
      type: "annotation" as const,
      icon: "📎",
      subject: String(e["subject"] || "(Note)"),
      description: String(e["notetext"] || ""),
      date: new Date(String(e["createdon"] || new Date())),
      statecode: 0,
      raw: e,
    }));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  private _renderFeed(items: ActivityItem[]): void {
    this._feedList.innerHTML = "";

    if (!items.length) {
      this._setFeedState("empty", "No activities found for this record.");
      return;
    }

    const now = new Date();
    items.forEach(item => {
      const el = document.createElement("div");
      el.className = `tl-item tl-item-${item.type} ${item.statecode === 1 ? "tl-item-completed" : ""}`;
      el.dataset.id = item.id;
      el.dataset.entity = item.entity;

      const timeAgo = this._timeAgo(item.date, now);
      const isTask = item.type === "task";

      el.innerHTML = `
        <div class="tl-item-timeline">
          <div class="tl-item-dot tl-dot-${item.type}">${item.icon}</div>
          <div class="tl-item-line"></div>
        </div>
        <div class="tl-item-body">
          <div class="tl-item-header">
            <span class="tl-item-subject">${item.subject}</span>
            <span class="tl-item-time">${timeAgo}</span>
          </div>
          ${item.description ? `<div class="tl-item-desc">${item.description}</div>` : ""}
          <div class="tl-item-actions">
            ${isTask && item.statecode === 0
              ? `<button class="tl-action-btn tl-btn-complete" data-id="${item.id}">✓ Complete</button>`
              : ""}
            <button class="tl-action-btn tl-btn-delete" data-id="${item.id}" data-entity="${item.entity}">🗑 Delete</button>
          </div>
        </div>
      `;

      // Bind actions
      el.querySelector(".tl-btn-complete")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this._completeTask(item.id, el);
      });
      el.querySelector(".tl-btn-delete")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this._deleteActivity(item.id, item.entity, el);
      });

      this._feedList.appendChild(el);
    });
  }

  private _setFeedState(state: "loading" | "empty" | "error", message?: string): void {
    this._feedList.innerHTML = "";
    if (state === "loading") {
      this._feedList.innerHTML = `
        <div class="tl-state-box">
          <div class="tl-spinner"></div>
          <div class="tl-state-text">Loading activities…</div>
        </div>`;
    } else if (state === "empty") {
      this._feedList.innerHTML = `
        <div class="tl-state-box">
          <div class="tl-state-icon">📭</div>
          <div class="tl-state-text">${message}</div>
        </div>`;
    } else {
      this._feedList.innerHTML = `
        <div class="tl-state-box tl-state-error">
          <div class="tl-state-icon">⚠</div>
          <div class="tl-state-text">${message}</div>
          <button class="tl-retry-btn" id="tl-retry">Retry</button>
        </div>`;
      this._feedList.querySelector("#tl-retry")?.addEventListener("click", () => this._loadActivities());
    }
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  private async _completeTask(taskId: string, el: HTMLDivElement): Promise<void> {
    const btn = el.querySelector(".tl-btn-complete") as HTMLButtonElement;
    if (btn) { btn.disabled = true; btn.textContent = "Updating…"; }

    try {
      await this._context.webAPI.updateRecord("task", taskId, { statecode: 1, statuscode: 5 });
      el.classList.add("tl-item-completed");
      el.querySelector(".tl-item-actions")!.innerHTML = `<span class="tl-completed-badge">✓ Completed</span>`;
    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = "✓ Complete"; }
      alert(`Failed to complete task: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async _deleteActivity(id: string, entity: string, el: HTMLDivElement): Promise<void> {
    const btn = el.querySelector(".tl-btn-delete") as HTMLButtonElement;
    if (btn) { btn.disabled = true; btn.textContent = "Deleting…"; }

    try {
      await this._context.webAPI.deleteRecord(entity, id);
      el.classList.add("tl-item-removing");
      setTimeout(() => el.remove(), 350);
    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = "🗑 Delete"; }
      alert(`Failed to delete: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ── Add Task Dialog ───────────────────────────────────────────────────────

  private _showAddTaskDialog(): void {
    const overlay = document.createElement("div");
    overlay.className = "tl-dialog-overlay";
    overlay.innerHTML = `
      <div class="tl-dialog">
        <div class="tl-dialog-header">
          <span>New Task</span>
          <button class="tl-dialog-close" id="tl-dialog-close">✕</button>
        </div>
        <div class="tl-dialog-body">
          <label class="tl-dialog-label">Subject *</label>
          <input id="tl-task-subject" class="tl-dialog-input" type="text" placeholder="Task subject…" />
          <label class="tl-dialog-label">Description</label>
          <textarea id="tl-task-desc" class="tl-dialog-textarea" placeholder="Optional description…"></textarea>
          <label class="tl-dialog-label">Due Date</label>
          <input id="tl-task-due" class="tl-dialog-input" type="date" />
        </div>
        <div class="tl-dialog-footer">
          <button class="tl-dialog-cancel" id="tl-dialog-cancel">Cancel</button>
          <button class="tl-dialog-submit" id="tl-dialog-submit">Create Task</button>
        </div>
      </div>
    `;

    overlay.querySelector("#tl-dialog-close")?.addEventListener("click", () => overlay.remove());
    overlay.querySelector("#tl-dialog-cancel")?.addEventListener("click", () => overlay.remove());
    overlay.querySelector("#tl-dialog-submit")?.addEventListener("click", async () => {
      const subject = (overlay.querySelector("#tl-task-subject") as HTMLInputElement).value.trim();
      const desc = (overlay.querySelector("#tl-task-desc") as HTMLTextAreaElement).value.trim();
      const due = (overlay.querySelector("#tl-task-due") as HTMLInputElement).value;

      if (!subject) {
        alert("Subject is required.");
        return;
      }

      const submitBtn = overlay.querySelector("#tl-dialog-submit") as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating…";

      try {
        const regardingId = this._context.parameters.regardingId.raw || "";
        const regardingEntity = this._context.parameters.regardingEntityName.raw || "account";

        const payload: Record<string, unknown> = {
          subject,
          description: desc || undefined,
          _regardingobjectid_value: regardingId,
          [`regardingobjectid_${regardingEntity}@odata.bind`]: `/${regardingEntity}s(${regardingId})`,
          statecode: 0,
          statuscode: 2,
        };
        if (due) payload["scheduledend"] = new Date(due).toISOString();

        await this._context.webAPI.createRecord("task", payload);
        overlay.remove();
        await this._loadActivities();
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Task";
        alert(`Failed to create task: ${err instanceof Error ? err.message : String(err)}`);
      }
    });

    this._container.appendChild(overlay);
  }

  // ── Filter ────────────────────────────────────────────────────────────────

  private _filterBy(filter: string, tabs: HTMLDivElement): void {
    tabs.querySelectorAll<HTMLButtonElement>(".tl-tab").forEach(t => {
      t.classList.toggle("tl-tab-active", t.dataset.filter === filter);
    });

    const typeMap: Record<string, string[]> = {
      all: [],
      tasks: ["task"],
      calls: ["phonecall"],
      emails: ["email"],
      notes: ["annotation"],
    };

    const allowed = typeMap[filter] || [];
    const filtered = allowed.length
      ? this._activities.filter(a => allowed.includes(a.type))
      : this._activities;

    this._renderFeed(filtered);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private _timeAgo(date: Date, now: Date): string {
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  }
}

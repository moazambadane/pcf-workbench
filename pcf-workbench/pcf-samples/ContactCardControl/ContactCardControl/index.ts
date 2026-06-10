/**
 * ContactCardControl — Sample PCF Control for PCF Workbench
 * Namespace: PCFSamples
 * Version: 1.2.0
 *
 * Demonstrates:
 *  - context.webAPI.retrieveRecord
 *  - context.webAPI.retrieveMultipleRecords
 *  - context.webAPI.execute (custom action)
 *  - context.utils.getEntityMetadata
 *  - context.navigation.openForm / openUrl
 *  - notifyOutputChanged
 *  - context.mode.trackContainerResize
 */

interface ContactCardParameters {
  contactId: { raw: string | null };
  showRelatedCases: { raw: boolean };
  maxCasesToShow: { raw: number };
  selectedContactId: { raw: string | null };
  cardTheme: { raw: number };
}

interface ContactRecord {
  contactid?: string;
  fullname?: string;
  firstname?: string;
  lastname?: string;
  emailaddress1?: string;
  telephone1?: string;
  jobtitle?: string;
  "parentcustomerid_account@Microsoft.Dynamics.CRM.associatednavigationproperty"?: string;
  "_parentcustomerid_value@OData.Community.Display.V1.FormattedValue"?: string;
  [key: string]: unknown;
}

interface IncidentRecord {
  incidentid?: string;
  title?: string;
  ticketnumber?: string;
  statecode?: number;
  createdon?: string;
  [key: string]: unknown;
}

interface TaskRecord {
  activityid?: string;
  subject?: string;
  scheduledend?: string;
  statecode?: number;
  [key: string]: unknown;
}

export class ContactCardControl {
  private _context!: any;
  private _notifyOutputChanged!: () => void;
  private _container!: HTMLDivElement;
  private _currentContactId: string | null = null;
  private _isLoading = false;

  private _contact: ContactRecord | null = null;
  private _cases: IncidentRecord[] = [];
  private _tasks: TaskRecord[] = [];
  private _enrichment: Record<string, unknown> | null = null;
  private _metadata: Record<string, string> = {};

  public init(
    context: any,
    notifyOutputChanged: () => void,
    _state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this._context = context;
    this._notifyOutputChanged = notifyOutputChanged;
    this._container = container;
    this._container.style.fontFamily = "inherit";
    this._container.style.width = "100%";
    this._container.style.minHeight = "200px";
    context.mode.trackContainerResize(true);
  }

  public updateView(context: any): void {
    this._context = context;
    const contactId = context.parameters.contactId?.raw as string | null;
    const theme = context.parameters.cardTheme?.raw ?? 0;
    const themeNames: Record<number, string> = { 0: "light", 1: "dark", 2: "compact" };
    const themeName = themeNames[theme] ?? "light";

    if (!contactId) {
      this._renderEmpty(themeName);
      return;
    }

    if (contactId !== this._currentContactId) {
      this._currentContactId = contactId;
      this._loadData(contactId, context, themeName);
    } else {
      this._render(themeName, context);
    }
  }

  private async _loadData(contactId: string, context: any, theme: string): Promise<void> {
    this._isLoading = true;
    this._contact = null;
    this._cases = [];
    this._tasks = [];
    this._enrichment = null;
    this._renderLoading(theme);

    try {
      // 1. Retrieve contact record
      const contact = await context.webAPI.retrieveRecord(
        "contact",
        contactId,
        "?$select=fullname,firstname,lastname,emailaddress1,telephone1,jobtitle,createdon"
      );
      this._contact = contact as ContactRecord;

      // 2. Retrieve related cases
      const showCases = context.parameters.showRelatedCases?.raw !== false;
      const maxCases = context.parameters.maxCasesToShow?.raw ?? 5;

      if (showCases) {
        try {
          const casesResp = await context.webAPI.retrieveMultipleRecords(
            "incident",
            `?$filter=customerid eq '${contactId}'&$select=title,ticketnumber,statecode,createdon&$top=${maxCases}`
          );
          this._cases = (casesResp.entities || []) as IncidentRecord[];
        } catch (_e) {
          // Cases may not exist for this contact
          this._cases = [];
        }
      }

      // 3. Retrieve tasks via FetchXML
      try {
        const tasksFetchXml = [
          `<fetch top="3">`,
          `  <entity name="task">`,
          `    <attribute name="subject" />`,
          `    <attribute name="scheduledend" />`,
          `    <attribute name="statecode" />`,
          `    <filter>`,
          `      <condition attribute="regardingobjectid" operator="eq" value="${contactId}" />`,
          `    </filter>`,
          `    <order attribute="scheduledend" descending="false" />`,
          `  </entity>`,
          `</fetch>`,
        ].join("");
        const tasksResp = await context.webAPI.retrieveMultipleRecords(
          "task",
          `?fetchXml=${encodeURIComponent(tasksFetchXml)}`
        );
        this._tasks = (tasksResp.entities || []) as TaskRecord[];
      } catch (_e) {
        this._tasks = [];
      }

      // 4. Execute custom enrichment action
      try {
        const enrichResult = await context.webAPI.execute({
          RequestName: "new_GetContactEnrichment",
          LogicalName: "contact",
          contactId: { entityType: "contact", id: contactId },
        });
        this._enrichment = enrichResult as Record<string, unknown>;
      } catch (_e) {
        this._enrichment = null;
      }

      // 5. Get entity metadata
      try {
        const meta: any = await context.utils.getEntityMetadata("contact", [
          "fullname", "emailaddress1", "telephone1", "jobtitle",
        ]);
        if (meta && meta.Attributes) {
          for (const attr of meta.Attributes) {
            this._metadata[attr.LogicalName] = attr.DisplayName;
          }
        }
      } catch (_e) {
        // Metadata optional
      }

      this._isLoading = false;
      this._render(theme, context);

      // 6. Emit output
      this._notifyOutputChanged();
    } catch (err) {
      this._isLoading = false;
      this._renderError(theme, err instanceof Error ? err.message : String(err));
    }
  }

  private _renderLoading(theme: string): void {
    this._container.setAttribute("data-theme", theme);
    this._container.innerHTML = `
      <div class="cc-container">
        <div class="cc-loading">
          <div class="cc-spinner"></div>
          <div>Loading contact data...</div>
        </div>
      </div>
    `;
    this._injectStyles();
  }

  private _renderEmpty(theme: string): void {
    this._container.setAttribute("data-theme", theme);
    this._container.innerHTML = `
      <div class="cc-container">
        <div class="cc-loading">
          <div style="font-size:32px;margin-bottom:12px;">👤</div>
          <div>Enter a Contact ID to load the contact card</div>
        </div>
      </div>
    `;
    this._injectStyles();
  }

  private _renderError(theme: string, message: string): void {
    this._container.setAttribute("data-theme", theme);
    this._container.innerHTML = `
      <div class="cc-container">
        <div class="cc-error">
          <span style="font-size:18px">⚠️</span>
          <div>
            <strong>Error loading contact</strong><br>
            <span style="font-size:11px">${this._escape(message)}</span>
          </div>
        </div>
      </div>
    `;
    this._injectStyles();
  }

  private _render(theme: string, context: any): void {
    this._container.setAttribute("data-theme", theme);
    const c = this._contact;
    if (!c) { this._renderEmpty(theme); return; }

    const initials = this._getInitials(c.fullname || "?");
    const isCompact = theme === "compact";
    const showCases = context.parameters.showRelatedCases?.raw !== false;

    const casesHtml = showCases ? this._renderCases() : "";
    const tasksHtml = this._renderTasks();
    const enrichmentHtml = this._renderEnrichment();
    const metaHtml = this._renderMetadata();

    this._container.innerHTML = `
      <div class="cc-container">
        <!-- Header -->
        <div class="cc-header">
          <div class="cc-avatar">${this._escape(initials)}</div>
          <div class="cc-header-info">
            <h2 class="cc-name">${this._escape(c.fullname || "Unknown")}</h2>
            ${c.jobtitle ? `<p class="cc-jobtitle">${this._escape(c.jobtitle)}</p>` : ""}
          </div>
          <button class="cc-btn cc-btn-primary" id="cc-refresh-btn">↻ Refresh</button>
        </div>

        <!-- Contact Details -->
        <div class="cc-body">
          ${c.emailaddress1 ? `
            <div class="cc-contact-row">
              <div class="cc-contact-icon">✉</div>
              <a class="cc-contact-link" href="mailto:${this._escape(c.emailaddress1)}">${this._escape(c.emailaddress1)}</a>
            </div>` : ""}
          ${c.telephone1 ? `
            <div class="cc-contact-row">
              <div class="cc-contact-icon">☎</div>
              <a class="cc-contact-link" id="cc-call-link" href="tel:${this._escape(c.telephone1)}">${this._escape(c.telephone1)}</a>
            </div>` : ""}

          ${casesHtml}
          ${tasksHtml}
          ${enrichmentHtml}
          ${metaHtml}
        </div>

        <!-- Actions -->
        <div class="cc-actions">
          <button class="cc-btn" id="cc-openform-btn">📋 Open Form</button>
          ${c.telephone1 ? `<button class="cc-btn" id="cc-call-btn">📞 Call</button>` : ""}
          <button class="cc-btn" id="cc-navigate-btn">🔗 View Record</button>
        </div>
      </div>
    `;

    this._injectStyles();
    this._attachEvents(context, c);
  }

  private _renderCases(): string {
    if (this._cases.length === 0) {
      return `
        <div class="cc-section">
          <div class="cc-section-header">Related Cases <span class="cc-section-badge">0</span></div>
          <div class="cc-no-data">No related cases found</div>
        </div>`;
    }
    const rows = this._cases.map((c) => `
      <div class="cc-record-item">
        <div style="flex:1;min-width:0">
          <div class="cc-record-title">${this._escape(c.title || "Case")}</div>
          <div class="cc-record-meta">
            ${c.ticketnumber ? `#${this._escape(c.ticketnumber)} · ` : ""}
            ${c.createdon ? new Date(c.createdon).toLocaleDateString() : ""}
          </div>
        </div>
        <span class="cc-status-badge ${c.statecode === 0 ? "cc-status-active" : c.statecode === 1 ? "cc-status-resolved" : "cc-status-inactive"}">
          ${c.statecode === 0 ? "Active" : c.statecode === 1 ? "Resolved" : "Cancelled"}
        </span>
      </div>`).join("");
    return `
      <div class="cc-section">
        <div class="cc-section-header">Related Cases <span class="cc-section-badge">${this._cases.length}</span></div>
        ${rows}
      </div>`;
  }

  private _renderTasks(): string {
    if (this._tasks.length === 0) {
      return `
        <div class="cc-section">
          <div class="cc-section-header">Tasks <span class="cc-section-badge">0</span></div>
          <div class="cc-no-data">No tasks found</div>
        </div>`;
    }
    const rows = this._tasks.map((t) => `
      <div class="cc-record-item">
        <div style="flex:1;min-width:0">
          <div class="cc-record-title">${this._escape(t.subject || "Task")}</div>
          <div class="cc-record-meta">
            Due: ${t.scheduledend ? new Date(t.scheduledend).toLocaleDateString() : "—"}
          </div>
        </div>
        <span class="cc-status-badge ${t.statecode === 0 ? "cc-status-active" : "cc-status-resolved"}">
          ${t.statecode === 0 ? "Open" : "Completed"}
        </span>
      </div>`).join("");
    return `
      <div class="cc-section">
        <div class="cc-section-header">Tasks <span class="cc-section-badge">${this._tasks.length}</span></div>
        ${rows}
      </div>`;
  }

  private _renderEnrichment(): string {
    if (!this._enrichment) return "";
    const items = Object.entries(this._enrichment)
      .filter(([k]) => !["@odata.context"].includes(k))
      .slice(0, 6);
    if (items.length === 0) return "";
    const rows = items.map(([k, v]) => `
      <div class="cc-enrichment-item">
        <div class="cc-enrichment-label">${this._escape(this._camelToLabel(k))}</div>
        <div class="cc-enrichment-value">${this._escape(this._formatValue(v))}</div>
      </div>`).join("");
    return `
      <div class="cc-section" style="margin-top:16px">
        <div class="cc-section-header">Enrichment Data</div>
        <div class="cc-enrichment-grid">${rows}</div>
      </div>`;
  }

  private _renderMetadata(): string {
    const entries = Object.entries(this._metadata).slice(0, 4);
    if (entries.length === 0) return "";
    const rows = entries.map(([logicalName, displayName]) => `
      <div class="cc-record-item">
        <div class="cc-record-meta" style="min-width:120px">${this._escape(logicalName)}</div>
        <div class="cc-record-title">${this._escape(displayName)}</div>
      </div>`).join("");
    return `
      <div class="cc-section" style="margin-top:16px">
        <div class="cc-section-header">Entity Metadata</div>
        ${rows}
      </div>`;
  }

  private _attachEvents(context: any, contact: ContactRecord): void {
    const refreshBtn = this._container.querySelector<HTMLButtonElement>("#cc-refresh-btn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        const id = this._currentContactId;
        if (id) { this._currentContactId = null; this._loadData(id, context, this._getThemeName(context)); }
      });
    }

    const openFormBtn = this._container.querySelector<HTMLButtonElement>("#cc-openform-btn");
    if (openFormBtn) {
      openFormBtn.addEventListener("click", () => {
        if (this._currentContactId) {
          context.navigation.openForm({
            entityName: "contact",
            entityId: this._currentContactId,
          });
        }
      });
    }

    const callBtn = this._container.querySelector<HTMLButtonElement>("#cc-call-btn");
    if (callBtn && contact.telephone1) {
      callBtn.addEventListener("click", () => {
        context.navigation.openUrl(`tel:${contact.telephone1}`);
      });
    }

    const navBtn = this._container.querySelector<HTMLButtonElement>("#cc-navigate-btn");
    if (navBtn) {
      navBtn.addEventListener("click", () => {
        if (this._currentContactId) {
          context.navigation.navigateTo({
            pageType: "entityrecord",
            entityName: "contact",
            entityId: this._currentContactId,
          });
        }
      });
    }
  }

  private _injectStyles(): void {
    if (document.getElementById("cc-styles")) return;
    const link = document.createElement("link");
    link.id = "cc-styles";
    link.rel = "stylesheet";
    link.href = "css/ContactCard.css";
    document.head.appendChild(link);
  }

  private _getThemeName(context: any): string {
    const themeMap: Record<number, string> = { 0: "light", 1: "dark", 2: "compact" };
    return themeMap[context.parameters.cardTheme?.raw ?? 0] ?? "light";
  }

  private _getInitials(fullname: string): string {
    const parts = fullname.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  private _escape(str: unknown): string {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  private _camelToLabel(key: string): string {
    return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
  }

  private _formatValue(v: unknown): string {
    if (v === null || v === undefined) return "—";
    if (typeof v === "string" && v.includes("T") && !isNaN(Date.parse(v))) {
      return new Date(v).toLocaleDateString();
    }
    if (Array.isArray(v)) return v.join(", ");
    return String(v);
  }

  public getOutputs(): Pick<ContactCardParameters, "selectedContactId"> {
    return {
      selectedContactId: { raw: this._currentContactId },
    };
  }

  public destroy(): void {
    while (this._container.firstChild) {
      this._container.removeChild(this._container.firstChild);
    }
  }
}

// Register on window so the PCF Workbench iframe bootstrap can find it
(window as any)["PCFSamples"] = (window as any)["PCFSamples"] || {};
(window as any)["PCFSamples"]["ContactCardControl"] = ContactCardControl;

export default ContactCardControl;

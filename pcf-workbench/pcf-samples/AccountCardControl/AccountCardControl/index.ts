/**
 * AccountCardControl — Sample Virtual PCF Control for PCF Workbench
 * Namespace: PCFSamples
 * Version: 1.0.0
 *
 * Demonstrates:
 *  - control-type="virtual" (React-based rendering — updateView returns React.ReactElement)
 *  - context.webAPI.retrieveRecord
 *  - context.webAPI.retrieveMultipleRecords
 *  - context.webAPI.execute (custom action)
 *  - context.utils.getEntityMetadata
 *  - context.navigation.openForm / navigateTo / openUrl
 *  - notifyOutputChanged
 *  - context.mode.trackContainerResize
 */

import { IInputs, IOutputs } from "./generated/ManifestTypes";

interface AccountRecord {
  accountid?: string;
  name?: string;
  accountnumber?: string;
  telephone1?: string;
  emailaddress1?: string;
  websiteurl?: string;
  address1_city?: string;
  address1_country?: string;
  revenue?: number;
  numberofemployees?: number;
  industrycode?: number;
  _parentaccountid_value?: string | null;
  statecode?: number;
  createdon?: string;
  [key: string]: unknown;
}

interface ContactRecord {
  contactid?: string;
  fullname?: string;
  jobtitle?: string;
  emailaddress1?: string;
  telephone1?: string;
  statecode?: number;
  [key: string]: unknown;
}

interface OpportunityRecord {
  opportunityid?: string;
  name?: string;
  estimatedvalue?: number;
  estimatedclosedate?: string;
  stepname?: string;
  statecode?: number;
  [key: string]: unknown;
}

export class AccountCardControl
  implements ComponentFramework.ReactControl<IInputs, IOutputs>
{
  private _context!: ComponentFramework.Context<IInputs>;
  private _notifyOutputChanged!: () => void;
  private _currentAccountId: string | null = null;
  private _isLoading = false;

  private _account: AccountRecord | null = null;
  private _contacts: ContactRecord[] = [];
  private _opportunities: OpportunityRecord[] = [];
  private _parentAccount: AccountRecord | null = null;
  private _enrichment: Record<string, unknown> | null = null;
  private _metadata: Record<string, string> = {};

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    _state: ComponentFramework.Dictionary
  ): void {
    this._context = context;
    this._notifyOutputChanged = notifyOutputChanged;
    context.mode.trackContainerResize(true);
  }

  public updateView(
    context: ComponentFramework.Context<IInputs>
  ): React.ReactElement {
    this._context = context;
    const params = context.parameters as unknown as Record<string, { raw: unknown }>;
    const accountId = params.accountId?.raw as string | null;
    const theme = (params.cardTheme?.raw as number) ?? 0;
    const themeNames: Record<number, string> = { 0: "light", 1: "dark", 2: "compact" };
    const themeName = themeNames[theme] ?? "light";

    if (!accountId) {
      return this._buildEmptyPrompt(themeName);
    }

    if (accountId !== this._currentAccountId && !this._isLoading) {
      this._currentAccountId = accountId;
      this._loadData(accountId, context, themeName);
    }

    return this._buildCard(themeName, context);
  }

  private async _loadData(
    accountId: string,
    context: ComponentFramework.Context<IInputs>,
    theme: string
  ): Promise<void> {
    this._isLoading = true;
    this._account = null;
    this._contacts = [];
    this._opportunities = [];
    this._parentAccount = null;
    this._enrichment = null;

    const webAPI = context.webAPI as unknown as Record<
      string,
      (...args: unknown[]) => Promise<unknown>
    >;
    const params = context.parameters as unknown as Record<string, { raw: unknown }>;

    try {
      // 1. Retrieve the account record
      const account = (await webAPI.retrieveRecord(
        "account",
        accountId,
        "?$select=name,accountnumber,telephone1,emailaddress1,websiteurl,address1_city,address1_country,revenue,numberofemployees,industrycode,statecode,createdon,_parentaccountid_value"
      )) as AccountRecord;
      this._account = account;

      // 2. Retrieve parent account when available
      if (this._account._parentaccountid_value) {
        try {
          this._parentAccount = (await webAPI.retrieveRecord(
            "account",
            this._account._parentaccountid_value,
            "?$select=name,accountnumber"
          )) as AccountRecord;
        } catch {
          this._parentAccount = null;
        }
      }

      // 3. Retrieve related contacts
      const showContacts = params.showRelatedContacts?.raw !== false;
      const maxItems = (params.maxItemsToShow?.raw as number) ?? 5;
      if (showContacts) {
        try {
          const resp = (await webAPI.retrieveMultipleRecords(
            "contact",
            `?$filter=_parentcustomerid_value eq '${accountId}'&$select=fullname,jobtitle,emailaddress1,telephone1,statecode&$top=${maxItems}`
          )) as { entities: ContactRecord[] };
          this._contacts = resp.entities || [];
        } catch {
          this._contacts = [];
        }
      }

      // 4. Retrieve related opportunities
      const showOpps = params.showRelatedOpportunities?.raw !== false;
      if (showOpps) {
        try {
          const resp = (await webAPI.retrieveMultipleRecords(
            "opportunity",
            `?$filter=parentaccountid eq '${accountId}'&$select=name,estimatedvalue,estimatedclosedate,stepname,statecode&$top=${maxItems}`
          )) as { entities: OpportunityRecord[] };
          this._opportunities = resp.entities || [];
        } catch {
          this._opportunities = [];
        }
      }

      // 5. Execute custom enrichment action
      try {
        this._enrichment = (await (
          context.webAPI as unknown as {
            execute: (req: unknown) => Promise<Record<string, unknown>>;
          }
        ).execute({
          RequestName: "new_GetAccountEnrichment",
          LogicalName: "account",
          accountId: { entityType: "account", id: accountId },
        })) as Record<string, unknown>;
      } catch {
        this._enrichment = null;
      }

      // 6. Get entity metadata
      try {
        const utils = context.utils as unknown as {
          getEntityMetadata: (
            name: string,
            attrs: string[]
          ) => Promise<{ Attributes: { LogicalName: string; DisplayName: string }[] }>;
        };
        const meta = await utils.getEntityMetadata("account", [
          "name",
          "telephone1",
          "emailaddress1",
          "websiteurl",
        ]);
        if (meta?.Attributes) {
          for (const attr of meta.Attributes) {
            this._metadata[attr.LogicalName] = attr.DisplayName;
          }
        }
      } catch {
        // Metadata is optional
      }

      this._isLoading = false;
      this._notifyOutputChanged();
    } catch (err) {
      this._isLoading = false;
      console.error(
        "AccountCardControl load error:",
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  // ── React element builders ────────────────────────────────────────────────

  private _buildCard(
    theme: string,
    context: ComponentFramework.Context<IInputs>
  ): React.ReactElement {
    const React = (window as unknown as { React: typeof import("react") }).React;
    const params = context.parameters as unknown as Record<string, { raw: unknown }>;

    if (this._isLoading) {
      return React.createElement(
        "div",
        { "data-theme": theme },
        React.createElement(
          "div",
          { className: "ac-container" },
          React.createElement(
            "div",
            { className: "ac-loading" },
            React.createElement("div", { className: "ac-spinner" }),
            React.createElement("div", null, "Loading account data…")
          )
        )
      );
    }

    const a = this._account;
    if (!a) {
      return React.createElement(
        "div",
        { "data-theme": theme },
        React.createElement(
          "div",
          { className: "ac-container" },
          React.createElement(
            "div",
            { className: "ac-loading" },
            React.createElement(
              "div",
              { style: { fontSize: "32px", marginBottom: "12px" } },
              "🏢"
            ),
            React.createElement("div", null, "No account data loaded")
          )
        )
      );
    }

    const showContacts = params.showRelatedContacts?.raw !== false;
    const showOpps = params.showRelatedOpportunities?.raw !== false;
    const initials = this._getInitials(a.name || "?");

    return React.createElement(
      "div",
      { "data-theme": theme, style: { width: "100%" } },
      React.createElement(
        "div",
        { className: "ac-container" },

        // ── Header ──
        React.createElement(
          "div",
          { className: "ac-header" },
          React.createElement("div", { className: "ac-logo" }, initials),
          React.createElement(
            "div",
            { className: "ac-header-info" },
            React.createElement("h2", { className: "ac-name" }, this._esc(a.name || "Unknown")),
            a.accountnumber
              ? React.createElement(
                  "p",
                  { className: "ac-accountnumber" },
                  `# ${this._esc(a.accountnumber)}`
                )
              : null,
            this._parentAccount
              ? React.createElement(
                  "p",
                  { className: "ac-parent" },
                  `↑ ${this._esc(this._parentAccount.name || "")}`
                )
              : null
          ),
          React.createElement(
            "button",
            {
              className: "ac-btn ac-btn-primary",
              onClick: () => {
                const id = this._currentAccountId;
                if (id) {
                  this._currentAccountId = null;
                  this._loadData(id, context, theme);
                }
              },
            },
            "↻ Refresh"
          )
        ),

        // ── Body ──
        React.createElement(
          "div",
          { className: "ac-body" },
          this._detailRow(React, "🏙", a.address1_city || null),
          this._detailRow(
            React,
            "☎",
            a.telephone1 || null,
            a.telephone1 ? `tel:${a.telephone1}` : undefined
          ),
          this._detailRow(
            React,
            "✉",
            a.emailaddress1 || null,
            a.emailaddress1 ? `mailto:${a.emailaddress1}` : undefined
          ),
          a.websiteurl
            ? this._detailRow(React, "🌐", a.websiteurl, a.websiteurl)
            : null,
          a.numberofemployees != null
            ? this._detailRow(
                React,
                "👥",
                `${Number(a.numberofemployees).toLocaleString()} employees`
              )
            : null,
          a.revenue != null
            ? this._detailRow(
                React,
                "💰",
                `$${Number(a.revenue).toLocaleString()} annual revenue`
              )
            : null,

          // Contacts section
          showContacts ? this._contactsSection(React) : null,

          // Opportunities section
          showOpps ? this._opportunitiesSection(React) : null,

          // Enrichment section
          this._enrichment ? this._enrichmentSection(React) : null
        ),

        // ── Actions ──
        React.createElement(
          "div",
          { className: "ac-actions" },
          React.createElement(
            "button",
            {
              className: "ac-btn",
              onClick: () => {
                if (this._currentAccountId) {
                  (
                    context.navigation as unknown as {
                      openForm: (opts: unknown) => void;
                    }
                  ).openForm({
                    entityName: "account",
                    entityId: this._currentAccountId,
                  });
                }
              },
            },
            "📋 Open Form"
          ),
          a.websiteurl
            ? React.createElement(
                "button",
                {
                  className: "ac-btn",
                  onClick: () =>
                    (
                      context.navigation as unknown as {
                        openUrl: (url: string) => void;
                      }
                    ).openUrl(a.websiteurl as string),
                },
                "🌐 Website"
              )
            : null,
          React.createElement(
            "button",
            {
              className: "ac-btn",
              onClick: () => {
                if (this._currentAccountId) {
                  (
                    context.navigation as unknown as {
                      navigateTo: (opts: unknown) => void;
                    }
                  ).navigateTo({
                    pageType: "entityrecord",
                    entityName: "account",
                    entityId: this._currentAccountId,
                  });
                }
              },
            },
            "🔗 View Record"
          )
        )
      )
    );
  }

  private _detailRow(
    React: typeof import("react"),
    icon: string,
    text: string | null,
    href?: string
  ): React.ReactElement | null {
    if (!text) return null;
    return React.createElement(
      "div",
      { className: "ac-detail-row", key: icon },
      React.createElement("div", { className: "ac-detail-icon" }, icon),
      href
        ? React.createElement(
            "a",
            {
              className: "ac-detail-link",
              href,
              target: href.startsWith("http") ? "_blank" : undefined,
              rel: href.startsWith("http") ? "noopener noreferrer" : undefined,
            },
            this._esc(text)
          )
        : React.createElement(
            "span",
            { className: "ac-detail-text" },
            this._esc(text)
          )
    );
  }

  private _contactsSection(React: typeof import("react")): React.ReactElement {
    const items = this._contacts;
    return React.createElement(
      "div",
      { className: "ac-section", key: "contacts" },
      React.createElement(
        "div",
        { className: "ac-section-header" },
        "Contacts",
        React.createElement(
          "span",
          { className: "ac-section-badge" },
          String(items.length)
        )
      ),
      items.length === 0
        ? React.createElement(
            "div",
            { className: "ac-no-data" },
            "No related contacts found"
          )
        : items.map((c) =>
            React.createElement(
              "div",
              { className: "ac-record-item", key: c.contactid || c.fullname },
              React.createElement(
                "div",
                { style: { flex: 1, minWidth: 0 } },
                React.createElement(
                  "div",
                  { className: "ac-record-title" },
                  this._esc(c.fullname || "Contact")
                ),
                React.createElement(
                  "div",
                  { className: "ac-record-meta" },
                  this._esc(c.jobtitle || c.emailaddress1 || "—")
                )
              ),
              React.createElement(
                "span",
                {
                  className: `ac-status-badge ${
                    c.statecode === 0 ? "ac-status-active" : "ac-status-inactive"
                  }`,
                },
                c.statecode === 0 ? "Active" : "Inactive"
              )
            )
          )
    );
  }

  private _opportunitiesSection(React: typeof import("react")): React.ReactElement {
    const items = this._opportunities;
    return React.createElement(
      "div",
      { className: "ac-section", key: "opportunities" },
      React.createElement(
        "div",
        { className: "ac-section-header" },
        "Opportunities",
        React.createElement(
          "span",
          { className: "ac-section-badge" },
          String(items.length)
        )
      ),
      items.length === 0
        ? React.createElement(
            "div",
            { className: "ac-no-data" },
            "No related opportunities found"
          )
        : items.map((o) =>
            React.createElement(
              "div",
              {
                className: "ac-record-item",
                key: o.opportunityid || o.name,
              },
              React.createElement(
                "div",
                { style: { flex: 1, minWidth: 0 } },
                React.createElement(
                  "div",
                  { className: "ac-record-title" },
                  this._esc(o.name || "Opportunity")
                ),
                React.createElement(
                  "div",
                  { className: "ac-record-meta" },
                  [
                    o.stepname ? this._esc(o.stepname) : null,
                    o.estimatedclosedate
                      ? `Close: ${new Date(o.estimatedclosedate).toLocaleDateString()}`
                      : null,
                    o.estimatedvalue != null
                      ? `$${Number(o.estimatedvalue).toLocaleString()}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                )
              ),
              React.createElement(
                "span",
                {
                  className: `ac-status-badge ${
                    o.statecode === 0
                      ? "ac-status-active"
                      : o.statecode === 1
                      ? "ac-status-resolved"
                      : "ac-status-inactive"
                  }`,
                },
                o.statecode === 0 ? "Open" : o.statecode === 1 ? "Won" : "Lost"
              )
            )
          )
    );
  }

  private _enrichmentSection(React: typeof import("react")): React.ReactElement {
    const items = Object.entries(this._enrichment!)
      .filter(([k]) => k !== "@odata.context")
      .slice(0, 8);
    if (items.length === 0) return React.createElement("span", null);
    return React.createElement(
      "div",
      { className: "ac-section", key: "enrichment", style: { marginTop: "16px" } },
      React.createElement(
        "div",
        { className: "ac-section-header" },
        "Enrichment Data"
      ),
      React.createElement(
        "div",
        { className: "ac-enrichment-grid" },
        items.map(([k, v]) =>
          React.createElement(
            "div",
            { className: "ac-enrichment-item", key: k },
            React.createElement(
              "div",
              { className: "ac-enrichment-label" },
              this._esc(this._camelToLabel(k))
            ),
            React.createElement(
              "div",
              { className: "ac-enrichment-value" },
              this._esc(this._formatValue(v))
            )
          )
        )
      )
    );
  }

  private _buildEmptyPrompt(theme: string): React.ReactElement {
    const React = (window as unknown as { React: typeof import("react") }).React;
    return React.createElement(
      "div",
      { "data-theme": theme, style: { width: "100%" } },
      React.createElement(
        "div",
        { className: "ac-container" },
        React.createElement(
          "div",
          { className: "ac-loading" },
          React.createElement(
            "div",
            { style: { fontSize: "32px", marginBottom: "12px" } },
            "🏢"
          ),
          React.createElement(
            "div",
            null,
            "Enter an Account ID to load the account card"
          )
        )
      )
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private _getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  private _esc(str: unknown): string {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  private _camelToLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase());
  }

  private _formatValue(v: unknown): string {
    if (v === null || v === undefined) return "—";
    if (
      typeof v === "string" &&
      v.includes("T") &&
      !isNaN(Date.parse(v))
    ) {
      return new Date(v).toLocaleDateString();
    }
    if (Array.isArray(v)) return v.join(", ");
    return String(v);
  }

  public getOutputs(): IOutputs {
    return {
      selectedAccountId: this._currentAccountId ?? undefined,
    };
  }

  public destroy(): void {
    // Virtual controls do not own a DOM container — nothing to tear down
  }
}

// Register on window so the PCF Workbench iframe bootstrap can find it
(window as unknown as Record<string, unknown>)["PCFSamples"] =
  (window as unknown as Record<string, unknown>)["PCFSamples"] || {};
(
  (window as unknown as Record<string, unknown>)["PCFSamples"] as Record<
    string,
    unknown
  >
)["AccountCardControl"] = AccountCardControl;

export default AccountCardControl;

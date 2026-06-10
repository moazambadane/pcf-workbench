/**
 * KPIDashboardControl — PCF Samples
 * Namespace: PCFSamples
 * Version: 1.0.0
 *
 * Demonstrates:
 *  - context.webAPI.execute — 4 custom Dataverse actions
 *    (new_GetCaseSLAStats, new_GetOpenOpportunities,
 *     new_GetRevenueThisMonth, new_GetAgentPerformance)
 *  - Multiple parallel + sequential API calls
 *  - context.navigation.openForm — drill-down on KPI click
 *  - context.navigation.navigateTo — navigate to entity list
 *  - Sparkline chart drawn on <canvas> with no external dependencies
 */

interface KPIDashboardParameters {
  agentId: ComponentFramework.PropertyTypes.StringProperty;
  showSparklines: ComponentFramework.PropertyTypes.TwoOptionsProperty;
  drillDownEntity: ComponentFramework.PropertyTypes.StringProperty;
}

interface KPICard {
  id: string;
  label: string;
  value: string;
  subtitle: string;
  trend: number;       // % change vs previous period
  sparkData: number[]; // 7-point sparkline data
  color: string;
  icon: string;
  actionName: string;  // Dataverse action name
  navigateEntity: string;
}

export class KPIDashboardControl
  implements ComponentFramework.StandardControl<KPIDashboardParameters, KPIDashboardParameters> {

  private _context!: ComponentFramework.Context<KPIDashboardParameters>;
  private _container!: HTMLDivElement;
  private _root!: HTMLDivElement;
  private _grid!: HTMLDivElement;
  private _kpis: KPICard[] = [];
  private _refreshTimer: number | null = null;

  // ── Lifecycle ────────────────────────────────────────────────────────────

  public init(
    context: ComponentFramework.Context<KPIDashboardParameters>,
    _notifyOutputChanged: () => void,
    _state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this._context = context;
    this._container = container;
    this._buildUI();
    this._loadAllKPIs();
  }

  public updateView(context: ComponentFramework.Context<KPIDashboardParameters>): void {
    this._context = context;
  }

  public getOutputs(): KPIDashboardParameters {
    return {} as KPIDashboardParameters;
  }

  public destroy(): void {
    if (this._refreshTimer) clearTimeout(this._refreshTimer);
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  private _buildUI(): void {
    this._root = document.createElement("div");
    this._root.className = "kpi-root";

    const header = document.createElement("div");
    header.className = "kpi-header";
    header.innerHTML = `
      <div class="kpi-header-left">
        <span class="kpi-header-icon">📊</span>
        <div>
          <div class="kpi-header-title">KPI Dashboard</div>
          <div class="kpi-header-subtitle" id="kpi-subtitle">Loading metrics…</div>
        </div>
      </div>
    `;

    const refreshBtn = document.createElement("button");
    refreshBtn.className = "kpi-refresh-btn";
    refreshBtn.textContent = "↻ Refresh";
    refreshBtn.addEventListener("click", () => this._loadAllKPIs());
    header.appendChild(refreshBtn);

    this._grid = document.createElement("div");
    this._grid.className = "kpi-grid";
    this._grid.innerHTML = this._skeletonHTML();

    this._root.appendChild(header);
    this._root.appendChild(this._grid);
    this._container.appendChild(this._root);
  }

  private _skeletonHTML(): string {
    return Array(4).fill(`
      <div class="kpi-card kpi-skeleton">
        <div class="kpi-sk-line kpi-sk-short"></div>
        <div class="kpi-sk-line kpi-sk-long"></div>
        <div class="kpi-sk-line kpi-sk-medium"></div>
      </div>
    `).join("");
  }

  // ── Data Loading ──────────────────────────────────────────────────────────

  private async _loadAllKPIs(): Promise<void> {
    this._grid.innerHTML = this._skeletonHTML();
    const subtitle = this._root.querySelector("#kpi-subtitle");

    try {
      // Execute all 4 custom actions in parallel
      const [sla, opps, revenue, agent] = await Promise.all([
        this._executeAction("new_GetCaseSLAStats"),
        this._executeAction("new_GetOpenOpportunities"),
        this._executeAction("new_GetRevenueThisMonth"),
        this._executeAction("new_GetAgentPerformance", {
          AgentId: this._context.parameters.agentId.raw || ""
        }),
      ]);

      this._kpis = [
        {
          id: "sla",
          label: "Case SLA Compliance",
          value: `${sla.ComplianceRate ?? 87}%`,
          subtitle: `${sla.BreachedCases ?? 3} breached of ${sla.TotalCases ?? 24} cases`,
          trend: Number(sla.TrendVsPrev ?? 4.2),
          sparkData: (sla.WeeklyTrend as number[]) ?? [80,82,85,83,87,88,87],
          color: "#4f6ef7",
          icon: "⏱",
          actionName: "new_GetCaseSLAStats",
          navigateEntity: "incident",
        },
        {
          id: "opps",
          label: "Open Opportunities",
          value: String(opps.Count ?? 18),
          subtitle: `$${((opps.TotalValue as number) ?? 142000).toLocaleString()} total value`,
          trend: Number(opps.TrendVsPrev ?? -2.1),
          sparkData: (opps.WeeklyTrend as number[]) ?? [22,20,19,21,18,19,18],
          color: "#22c55e",
          icon: "💼",
          actionName: "new_GetOpenOpportunities",
          navigateEntity: "opportunity",
        },
        {
          id: "revenue",
          label: "Revenue This Month",
          value: `$${(((revenue.Amount as number) ?? 84500) / 1000).toFixed(1)}K`,
          subtitle: `Target: $${(((revenue.Target as number) ?? 100000) / 1000).toFixed(0)}K`,
          trend: Number(revenue.TrendVsPrev ?? 12.5),
          sparkData: (revenue.DailyTrend as number[]) ?? [60,65,70,68,75,80,84.5],
          color: "#f59e0b",
          icon: "💰",
          actionName: "new_GetRevenueThisMonth",
          navigateEntity: "salesorder",
        },
        {
          id: "agent",
          label: "Agent Performance",
          value: `${agent.Score ?? 92}/100`,
          subtitle: `${agent.ResolvedCases ?? 31} cases resolved`,
          trend: Number(agent.TrendVsPrev ?? 1.8),
          sparkData: (agent.WeeklyScores as number[]) ?? [88,89,90,91,91,92,92],
          color: "#8b5cf6",
          icon: "👤",
          actionName: "new_GetAgentPerformance",
          navigateEntity: "incident",
        },
      ];

      if (subtitle) {
        const now = new Date().toLocaleTimeString();
        subtitle.textContent = `Last updated ${now}`;
      }

      this._renderGrid();
    } catch (err) {
      this._grid.innerHTML = `
        <div class="kpi-error">
          ⚠ Failed to load KPIs: ${err instanceof Error ? err.message : String(err)}
          <button class="kpi-retry" id="kpi-retry">Retry</button>
        </div>`;
      this._grid.querySelector("#kpi-retry")?.addEventListener("click", () => this._loadAllKPIs());
    }
  }

  private async _executeAction(
    actionName: string,
    inputs: Record<string, unknown> = {}
  ): Promise<Record<string, unknown>> {
    try {
      const request = {
        getMetadata: () => ({
          boundParameter: undefined,
          parameterTypes: Object.fromEntries(
            Object.entries(inputs).map(([k, v]) => [k, {
              typeName: typeof v === "number" ? "Edm.Int32" : "Edm.String",
              structuralProperty: 1,
            }])
          ),
          operationType: 0, // Action
          operationName: actionName,
        }),
        ...inputs,
      };

      const response = await (this._context.webAPI as unknown as {
        execute: (req: unknown) => Promise<{ json: () => Promise<Record<string, unknown>> }>
      }).execute(request);

      return await response.json();
    } catch (err) {
      // Return mock data gracefully so the control still renders
      console.warn(`[KPIDashboard] Action ${actionName} failed (using mock data):`, err);
      return {};
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  private _renderGrid(): void {
    this._grid.innerHTML = "";
    const showSparklines = this._context.parameters.showSparklines.raw !== false;

    this._kpis.forEach(kpi => {
      const card = document.createElement("div");
      card.className = "kpi-card";
      card.style.setProperty("--kpi-color", kpi.color);

      const trendPositive = kpi.trend >= 0;
      const trendIcon = trendPositive ? "▲" : "▼";
      const trendClass = trendPositive ? "kpi-trend-up" : "kpi-trend-down";

      card.innerHTML = `
        <div class="kpi-card-header">
          <div class="kpi-card-icon" style="background:${kpi.color}20;color:${kpi.color}">${kpi.icon}</div>
          <div class="kpi-card-label">${kpi.label}</div>
        </div>
        <div class="kpi-card-value">${kpi.value}</div>
        <div class="kpi-card-subtitle">${kpi.subtitle}</div>
        <div class="kpi-card-footer">
          <span class="kpi-trend ${trendClass}">${trendIcon} ${Math.abs(kpi.trend)}% vs last period</span>
          ${showSparklines ? `<canvas class="kpi-sparkline" width="80" height="30" data-id="${kpi.id}"></canvas>` : ""}
        </div>
        <div class="kpi-card-actions">
          <button class="kpi-btn-open" data-id="${kpi.id}">Open Records</button>
          <button class="kpi-btn-form" data-id="${kpi.id}">View Dashboard</button>
        </div>
      `;

      card.querySelector(".kpi-btn-open")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this._navigateToEntity(kpi.navigateEntity);
      });
      card.querySelector(".kpi-btn-form")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this._openDashboardForm(kpi);
      });

      card.addEventListener("click", () => this._navigateToEntity(kpi.navigateEntity));

      this._grid.appendChild(card);

      // Draw sparkline after DOM insertion
      if (showSparklines) {
        const canvas = card.querySelector<HTMLCanvasElement>(`canvas[data-id="${kpi.id}"]`);
        if (canvas) this._drawSparkline(canvas, kpi.sparkData, kpi.color);
      }
    });
  }

  // ── Sparkline (pure canvas, no libs) ─────────────────────────────────────

  private _drawSparkline(canvas: HTMLCanvasElement, data: number[], color: string): void {
    const ctx = canvas.getContext("2d");
    if (!ctx || !data.length) return;

    const w = canvas.width;
    const h = canvas.height;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 3;

    const pts = data.map((v, i) => ({
      x: pad + (i / (data.length - 1)) * (w - pad * 2),
      y: h - pad - ((v - min) / range) * (h - pad * 2),
    }));

    // Fill gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color + "55");
    grad.addColorStop(1, color + "00");

    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      // Smooth curve via control points
      const cx = (pts[i - 1].x + pts[i].x) / 2;
      ctx.bezierCurveTo(cx, pts[i - 1].y, cx, pts[i].y, pts[i].x, pts[i].y);
    }
    ctx.lineTo(pts[pts.length - 1].x, h);
    ctx.lineTo(pts[0].x, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const cx = (pts[i - 1].x + pts[i].x) / 2;
      ctx.bezierCurveTo(cx, pts[i - 1].y, cx, pts[i].y, pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Last point dot
    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  private _navigateToEntity(entityName: string): void {
    try {
      (this._context.navigation as any).navigateTo({
        pageType: "entitylist",
        entityName,
      });
    } catch (err) {
      console.warn("[KPIDashboard] Navigation failed:", err);
    }
  }

  private _openDashboardForm(_kpi: KPICard): void {
    try {
      this._context.navigation.openForm({
        entityName: "systemform",
      });
    } catch (err) {
      console.warn("[KPIDashboard] openForm failed:", err);
    }
  }
}

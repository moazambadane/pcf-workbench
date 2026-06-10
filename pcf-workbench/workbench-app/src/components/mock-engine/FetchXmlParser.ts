import type { Entity, RetrieveMultipleResponse } from "../../types/mock.types";

export interface FetchXmlResult extends RetrieveMultipleResponse {
  totalRecordCount?: number;
}

type FilterOperator =
  | "eq" | "ne" | "lt" | "le" | "gt" | "ge"
  | "like" | "not-like"
  | "begins-with" | "not-begin-with"
  | "ends-with" | "not-end-with"
  | "contains" | "not-contain"
  | "null" | "not-null"
  | "in" | "not-in"
  | "eq-userid" | "ne-userid"
  | "between" | "not-between";

interface Condition {
  attribute: string;
  operator: FilterOperator;
  value?: string;
  values?: string[];
  entityname?: string;
}

interface Filter {
  type: "and" | "or";
  conditions: Condition[];
  filters: Filter[];
}

interface OrderClause {
  attribute: string;
  descending: boolean;
  alias?: string;
}

interface AttributeSpec {
  name: string;
  alias?: string;
}

interface LinkEntity {
  name: string;
  from: string;
  to: string;
  alias?: string;
  type: "inner" | "outer";
  attributes: AttributeSpec[];
  filters: Filter[];
  orders: OrderClause[];
  links: LinkEntity[];
}

interface FetchSpec {
  top?: number;
  distinct?: boolean;
  entityName: string;
  attributes: AttributeSpec[];
  allAttributes: boolean;
  filters: Filter[];
  orders: OrderClause[];
  links: LinkEntity[];
}

function parseFilter(el: Element): Filter {
  const type = (el.getAttribute("type") || "and") as "and" | "or";
  const conditions: Condition[] = [];
  const filters: Filter[] = [];

  for (const child of Array.from(el.children)) {
    if (child.tagName === "condition") {
      const attribute = child.getAttribute("attribute") || "";
      const operator = (child.getAttribute("operator") || "eq") as FilterOperator;
      const value = child.getAttribute("value") ?? undefined;
      const entityname = child.getAttribute("entityname") ?? undefined;
      const valueEls = Array.from(child.getElementsByTagName("value"));
      const values = valueEls.length > 0 ? valueEls.map((v) => v.textContent || "") : undefined;
      conditions.push({ attribute, operator, value, values, entityname });
    } else if (child.tagName === "filter") {
      filters.push(parseFilter(child));
    }
  }

  return { type, conditions, filters };
}

function parseLinkEntity(el: Element): LinkEntity {
  const name = el.getAttribute("name") || "";
  const from = el.getAttribute("from") || "";
  const to = el.getAttribute("to") || "";
  const alias = el.getAttribute("alias") ?? undefined;
  const linkType = (el.getAttribute("link-type") || "inner") as "inner" | "outer";

  const attributes: AttributeSpec[] = [];
  const filters: Filter[] = [];
  const orders: OrderClause[] = [];
  const links: LinkEntity[] = [];

  for (const child of Array.from(el.children)) {
    if (child.tagName === "attribute") {
      attributes.push({ name: child.getAttribute("name") || "", alias: child.getAttribute("alias") ?? undefined });
    } else if (child.tagName === "filter") {
      filters.push(parseFilter(child));
    } else if (child.tagName === "order") {
      orders.push({
        attribute: child.getAttribute("attribute") || "",
        descending: child.getAttribute("descending") === "true",
        alias: child.getAttribute("alias") ?? undefined,
      });
    } else if (child.tagName === "link-entity") {
      links.push(parseLinkEntity(child));
    }
  }

  return { name, from, to, alias, type: linkType, attributes, filters, orders, links };
}

function parseFetchXml(xml: string): FetchSpec | null {
  try {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const fetchEl = doc.querySelector("fetch");
    if (!fetchEl) return null;

    const entityEl = fetchEl.querySelector(":scope > entity");
    if (!entityEl) return null;

    const entityName = entityEl.getAttribute("name") || "";
    const topAttr = fetchEl.getAttribute("top") || fetchEl.getAttribute("count");
    const top = topAttr ? parseInt(topAttr, 10) : undefined;
    const distinct = fetchEl.getAttribute("distinct") === "true";

    const attributes: AttributeSpec[] = [];
    let allAttributes = false;
    const filters: Filter[] = [];
    const orders: OrderClause[] = [];
    const links: LinkEntity[] = [];

    for (const child of Array.from(entityEl.children)) {
      if (child.tagName === "attribute") {
        attributes.push({ name: child.getAttribute("name") || "", alias: child.getAttribute("alias") ?? undefined });
      } else if (child.tagName === "all-attributes") {
        allAttributes = true;
      } else if (child.tagName === "filter") {
        filters.push(parseFilter(child));
      } else if (child.tagName === "order") {
        orders.push({
          attribute: child.getAttribute("attribute") || "",
          descending: child.getAttribute("descending") === "true",
          alias: child.getAttribute("alias") ?? undefined,
        });
      } else if (child.tagName === "link-entity") {
        links.push(parseLinkEntity(child));
      }
    }

    return { top, distinct, entityName, attributes, allAttributes, filters, orders, links };
  } catch {
    return null;
  }
}

function evaluateCondition(record: Entity, cond: Condition, currentUserId: string): boolean {
  const rawVal = record[cond.attribute];
  const recStr = String(rawVal ?? "").toLowerCase();
  const condVal = (cond.value ?? "").toLowerCase();

  switch (cond.operator) {
    case "eq":
    case "eq-userid":
      return recStr === (cond.operator === "eq-userid" ? currentUserId.toLowerCase() : condVal);
    case "ne":
    case "ne-userid":
      return recStr !== (cond.operator === "ne-userid" ? currentUserId.toLowerCase() : condVal);
    case "lt": return parseFloat(recStr) < parseFloat(condVal);
    case "le": return parseFloat(recStr) <= parseFloat(condVal);
    case "gt": return parseFloat(recStr) > parseFloat(condVal);
    case "ge": return parseFloat(recStr) >= parseFloat(condVal);
    case "like":
    case "contains":
      return recStr.includes(condVal.replace(/%/g, ""));
    case "not-like":
    case "not-contain":
      return !recStr.includes(condVal.replace(/%/g, ""));
    case "begins-with": return recStr.startsWith(condVal.replace(/%/g, ""));
    case "not-begin-with": return !recStr.startsWith(condVal.replace(/%/g, ""));
    case "ends-with": return recStr.endsWith(condVal.replace(/%/g, ""));
    case "not-end-with": return !recStr.endsWith(condVal.replace(/%/g, ""));
    case "null": return rawVal === null || rawVal === undefined || rawVal === "";
    case "not-null": return rawVal !== null && rawVal !== undefined && rawVal !== "";
    case "in": return (cond.values ?? [cond.value ?? ""]).map((v) => v.toLowerCase()).includes(recStr);
    case "not-in": return !(cond.values ?? [cond.value ?? ""]).map((v) => v.toLowerCase()).includes(recStr);
    case "between": {
      const vals = cond.values ?? [];
      if (vals.length < 2) return true;
      const n = parseFloat(recStr);
      return n >= parseFloat(vals[0]) && n <= parseFloat(vals[1]);
    }
    case "not-between": {
      const vals = cond.values ?? [];
      if (vals.length < 2) return true;
      const n = parseFloat(recStr);
      return n < parseFloat(vals[0]) || n > parseFloat(vals[1]);
    }
    default: return true;
  }
}

function evaluateFilter(record: Entity, filter: Filter, currentUserId: string): boolean {
  const condResults = filter.conditions.map((c) => evaluateCondition(record, c, currentUserId));
  const filterResults = filter.filters.map((f) => evaluateFilter(record, f, currentUserId));
  const all = [...condResults, ...filterResults];
  if (all.length === 0) return true;
  return filter.type === "and" ? all.every(Boolean) : all.some(Boolean);
}

function applyFilters(records: Entity[], filters: Filter[], currentUserId: string): Entity[] {
  if (filters.length === 0) return records;
  return records.filter((r) => filters.every((f) => evaluateFilter(r, f, currentUserId)));
}

function applyOrders(records: Entity[], orders: OrderClause[]): Entity[] {
  if (orders.length === 0) return records;
  return [...records].sort((a, b) => {
    for (const order of orders) {
      const key = order.alias ?? order.attribute;
      const av = String(a[key] ?? "");
      const bv = String(b[key] ?? "");
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      if (cmp !== 0) return order.descending ? -cmp : cmp;
    }
    return 0;
  });
}

function applyLinkEntity(
  records: Entity[],
  link: LinkEntity,
  allEntities: Record<string, Entity[]>,
  currentUserId: string
): Entity[] {
  const linkedRecords = allEntities[link.name] || [];
  const alias = link.alias || link.name;
  const result: Entity[] = [];

  for (const record of records) {
    const fromVal = String(record[link.to] ?? "");
    const matches = linkedRecords.filter((lr) => String(lr[link.from] ?? "") === fromVal);
    const filtered = applyFilters(matches, link.filters, currentUserId);

    if (filtered.length === 0) {
      if (link.type === "outer") {
        const merged = { ...record };
        if (link.attributes.length > 0) {
          for (const attr of link.attributes) {
            const key = attr.alias ? attr.alias : `${alias}.${attr.name}`;
            merged[key] = null;
          }
        }
        result.push(merged);
      }
    } else {
      for (const lr of filtered) {
        const merged = { ...record };
        if (link.attributes.length > 0) {
          for (const attr of link.attributes) {
            const key = attr.alias ? attr.alias : `${alias}.${attr.name}`;
            merged[key] = lr[attr.name];
          }
        } else {
          for (const [k, v] of Object.entries(lr)) {
            merged[`${alias}.${k}`] = v;
          }
        }
        result.push(merged);
      }
    }
  }

  return result;
}

function projectAttributes(records: Entity[], spec: FetchSpec): Entity[] {
  if (spec.allAttributes && spec.links.length === 0) return records;

  const baseAttrs = spec.attributes.map((a) => a.name);

  const idField = spec.entityName + "id";
  if (!baseAttrs.includes(idField)) baseAttrs.unshift(idField);

  return records.map((r) => {
    if (spec.allAttributes) return r;

    const projected: Entity = {};

    for (const attr of spec.attributes) {
      const key = attr.alias ?? attr.name;
      projected[key] = r[attr.name];
    }

    // Include aliased link-entity fields already merged
    for (const [k, v] of Object.entries(r)) {
      if (k.includes(".") || (spec.links.some((l) => k.startsWith((l.alias || l.name) + ".")))) {
        projected[k] = v;
      }
    }

    // Always include id
    if (!(idField in projected)) projected[idField] = r[idField];

    return projected;
  });
}

export function applyFetchXml(
  xml: string,
  allEntities: Record<string, Entity[]>,
  currentUserId: string
): FetchXmlResult {
  const spec = parseFetchXml(xml);
  if (!spec) return { entities: [] };

  let records: Entity[] = allEntities[spec.entityName] || [];

  // Apply root filters
  records = applyFilters(records, spec.filters, currentUserId);

  // Apply link-entities (joins)
  for (const link of spec.links) {
    records = applyLinkEntity(records, link, allEntities, currentUserId);
  }

  // Apply ordering
  records = applyOrders(records, spec.orders);

  // Apply top/count
  if (spec.top !== undefined && spec.top > 0) {
    records = records.slice(0, spec.top);
  }

  // Project attributes
  records = projectAttributes(records, spec);

  // Apply distinct
  if (spec.distinct) {
    const seen = new Set<string>();
    records = records.filter((r) => {
      const key = JSON.stringify(r);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return { entities: records.map((r) => structuredClone(r)), totalRecordCount: records.length };
}

export function extractFetchXmlFromOptions(options?: string): string | null {
  if (!options) return null;
  const match = /[?&]fetchXml=([^&]+)/i.exec(options);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

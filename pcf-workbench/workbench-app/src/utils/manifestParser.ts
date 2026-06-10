import type { ParsedManifest, PCFProperty, PCFResource, PCFOptionSetValue } from "../types/pcf.types";

export class ManifestParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManifestParseError";
  }
}

function getAttr(el: Element, name: string): string {
  return el.getAttribute(name) ?? "";
}

function parseProperties(doc: Document): PCFProperty[] {
  const props: PCFProperty[] = [];
  const propertyEls = doc.querySelectorAll("control > property");
  propertyEls.forEach((el) => {
    const ofType = getAttr(el, "of-type");
    const usage = getAttr(el, "usage");
    let type: PCFProperty["type"] = "input";
    if (usage === "output") type = "output";
    else if (usage === "bound") type = "bound";
    else if (usage === "input-output") type = "input-output";

    // Parse inline optionset
    const options: PCFOptionSetValue[] = [];
    const optEls = el.querySelectorAll("optionset > options > option");
    optEls.forEach((opt) => {
      options.push({
        value: parseInt(getAttr(opt, "value"), 10),
        displayName: getAttr(opt, "display-name-key"),
      });
    });

    props.push({
      name: getAttr(el, "name"),
      ofType,
      type,
      usage,
      required: getAttr(el, "required") === "true",
      defaultValue: getAttr(el, "default-value") || undefined,
      displayName: getAttr(el, "display-name-key"),
      description: getAttr(el, "description-key"),
      options: options.length > 0 ? options : undefined,
    });
  });
  return props;
}

function parseResources(doc: Document): PCFResource[] {
  const resources: PCFResource[] = [];

  doc.querySelectorAll("resources > code").forEach((el) => {
    resources.push({
      type: "code",
      path: getAttr(el, "path"),
      order: parseInt(getAttr(el, "order") || "1", 10),
    });
  });

  doc.querySelectorAll("resources > css").forEach((el) => {
    resources.push({
      type: "css",
      path: getAttr(el, "path"),
      order: parseInt(getAttr(el, "order") || "1", 10),
    });
  });

  doc.querySelectorAll("resources > img").forEach((el) => {
    resources.push({ type: "img", path: getAttr(el, "path") });
  });

  doc.querySelectorAll("resources > resx").forEach((el) => {
    resources.push({
      type: "resx",
      path: getAttr(el, "path"),
      version: getAttr(el, "version"),
    });
  });

  doc.querySelectorAll('resources > platform-library').forEach((el) => {
    resources.push({
      type: "platform-library",
      name: getAttr(el, "name"),
      version: getAttr(el, "version"),
    });
  });

  return resources;
}

function parseFeatures(doc: Document): string[] {
  const features: string[] = [];
  doc.querySelectorAll("feature-usage > uses-feature").forEach((el) => {
    features.push(getAttr(el, "name"));
  });
  return features;
}

export function parseManifest(xmlContent: string): ParsedManifest {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, "text/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new ManifestParseError(`XML parse error: ${parseError.textContent}`);
  }

  const controlEl = doc.querySelector("manifest > control");
  if (!controlEl) {
    throw new ManifestParseError("No <control> element found in manifest");
  }

  const controlType = (getAttr(controlEl, "control-type") || "standard") as ParsedManifest["controlType"];

  return {
    namespace: getAttr(controlEl, "namespace"),
    constructor: getAttr(controlEl, "constructor"),
    version: getAttr(controlEl, "version"),
    displayName: getAttr(controlEl, "display-name-key"),
    description: getAttr(controlEl, "description-key"),
    controlType: ["standard", "virtual", "react"].includes(controlType) ? controlType : "standard",
    properties: parseProperties(doc),
    resources: parseResources(doc),
    features: parseFeatures(doc),
  };
}

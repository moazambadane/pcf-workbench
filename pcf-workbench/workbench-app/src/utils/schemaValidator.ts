import type { MockConfig } from "../types/mock.types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateMockConfig(config: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof config !== "object" || config === null) {
    return { valid: false, errors: ["Root must be an object"] };
  }

  const cfg = config as Record<string, unknown>;

  if (cfg.entities !== undefined) {
    if (typeof cfg.entities !== "object" || cfg.entities === null || Array.isArray(cfg.entities)) {
      errors.push("'entities' must be an object mapping entity names to arrays");
    } else {
      for (const [key, val] of Object.entries(cfg.entities as Record<string, unknown>)) {
        if (!Array.isArray(val)) {
          errors.push(`entities['${key}'] must be an array`);
        }
      }
    }
  }

  if (cfg.customActions !== undefined) {
    if (!Array.isArray(cfg.customActions)) {
      errors.push("'customActions' must be an array");
    } else {
      (cfg.customActions as unknown[]).forEach((action, i) => {
        if (typeof action !== "object" || action === null) {
          errors.push(`customActions[${i}] must be an object`);
          return;
        }
        const a = action as Record<string, unknown>;
        if (!a.actionName) errors.push(`customActions[${i}].actionName is required`);
        if (a.mockResponse === undefined) errors.push(`customActions[${i}].mockResponse is required`);
        if (a.delay !== undefined && typeof a.delay !== "number") errors.push(`customActions[${i}].delay must be a number`);
        if (a.errorCode !== undefined && typeof a.errorCode !== "number") errors.push(`customActions[${i}].errorCode must be a number`);
      });
    }
  }

  if (cfg.settings !== undefined) {
    if (typeof cfg.settings !== "object" || cfg.settings === null) {
      errors.push("'settings' must be an object");
    } else {
      const s = cfg.settings as Record<string, unknown>;
      if (s.defaultDelay !== undefined && typeof s.defaultDelay !== "number") errors.push("settings.defaultDelay must be a number");
      if (s.errorRate !== undefined) {
        if (typeof s.errorRate !== "number") errors.push("settings.errorRate must be a number");
        else if ((s.errorRate as number) < 0 || (s.errorRate as number) > 1) errors.push("settings.errorRate must be between 0 and 1");
      }
      if (s.isOffline !== undefined && typeof s.isOffline !== "boolean") errors.push("settings.isOffline must be a boolean");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function parseMockConfigJson(json: string): { config?: MockConfig; error?: string } {
  try {
    const parsed = JSON.parse(json) as unknown;
    const result = validateMockConfig(parsed);
    if (!result.valid) {
      return { error: `Validation errors:\n${result.errors.join("\n")}` };
    }
    return { config: parsed as MockConfig };
  } catch (e) {
    return { error: `JSON parse error: ${e instanceof Error ? e.message : String(e)}` };
  }
}

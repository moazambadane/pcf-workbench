export const MOCK_CONFIG_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "PCF Workbench Mock Config",
  type: "object",
  properties: {
    entities: {
      type: "object",
      description: "Entity logical name -> array of record objects",
      additionalProperties: {
        type: "array",
        items: { type: "object" },
      },
    },
    customActions: {
      type: "array",
      items: {
        type: "object",
        required: ["actionName", "mockResponse"],
        properties: {
          actionName: { type: "string" },
          boundEntityName: { type: "string" },
          boundEntityId: { type: "string" },
          mockResponse: { type: "object" },
          delay: { type: "number", default: 100 },
          errorCode: { type: "number" },
          errorMessage: { type: "string" },
        },
      },
    },
    globalOptionSets: {
      type: "object",
      additionalProperties: {
        type: "array",
        items: {
          type: "object",
          properties: {
            value: { type: "number" },
            label: { type: "string" },
          },
        },
      },
    },
    settings: {
      type: "object",
      properties: {
        defaultDelay: { type: "number", default: 100 },
        errorRate: { type: "number", minimum: 0, maximum: 1, default: 0 },
        isOffline: { type: "boolean", default: false },
        userId: { type: "string" },
        userName: { type: "string" },
        organizationName: { type: "string" },
        languageId: { type: "number", default: 1033 },
      },
    },
  },
};

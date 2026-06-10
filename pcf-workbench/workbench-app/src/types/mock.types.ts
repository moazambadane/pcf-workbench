// Mock Engine Type Definitions

export interface Entity {
  [key: string]: unknown;
}

export interface EntityReference {
  entityType: string;
  id: string;
  name?: string;
}

export interface RetrieveMultipleResponse {
  entities: Entity[];
  nextLink?: string;
}

export interface OptionSetValue {
  value: number;
  label: string;
  color?: string;
}

export interface EntityMetadata {
  LogicalName: string;
  DisplayName: string;
  DisplayCollectionName: string;
  PrimaryIdAttribute: string;
  PrimaryNameAttribute: string;
  Attributes: AttributeMetadata[];
}

export interface AttributeMetadata {
  LogicalName: string;
  DisplayName: string;
  AttributeType: string;
  RequiredLevel: string;
  MaxLength?: number;
  MinValue?: number;
  MaxValue?: number;
  OptionSet?: OptionSetValue[];
}

export interface MockDataStoreState {
  entities: Record<string, Entity[]>;
  customActions: Record<string, CustomActionMock>;
  globalOptionSets: Record<string, OptionSetValue[]>;
  metadata: Record<string, EntityMetadata>;
  httpMocks: HttpMock[];
  fetchXmlMocks: FetchXmlMock[];
}

export interface ConditionalResponse {
  matchFields: Record<string, unknown>;
  response: unknown;
  label?: string;
}

export interface CustomActionMock {
  actionName: string;
  boundEntityName?: string;
  boundEntityId?: string;
  mockResponse: unknown;
  conditionalResponses?: ConditionalResponse[];
  delay?: number;
  errorCode?: number;
  errorMessage?: string;
}

export interface FetchXmlMock {
  id: string;
  entityName: string;
  xmlContains?: string;
  mockResponse: Entity[];
  delay?: number;
  errorCode?: number;
  errorMessage?: string;
  enabled: boolean;
}

export type HttpMockMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "ANY";

export interface HttpMock {
  id: string;
  urlPattern: string;
  matchType: "contains" | "exact" | "startsWith";
  method: HttpMockMethod;
  statusCode: number;
  responseBody: unknown;
  responseHeaders?: Record<string, string>;
  delay?: number;
  enabled: boolean;
}

export interface MockSettings {
  defaultDelay: number;
  errorRate: number;
  isOffline: boolean;
  userId: string;
  userName: string;
  organizationName: string;
  languageId: number;
}

export interface MockConfig {
  entities?: Record<string, Entity[]>;
  customActions?: CustomActionMock[];
  globalOptionSets?: Record<string, OptionSetValue[]>;
  httpMocks?: HttpMock[];
  fetchXmlMocks?: FetchXmlMock[];
  settings?: Partial<MockSettings>;
}

export interface DynamicsError {
  errorCode: number;
  message: string;
  name: string;
  stack?: string;
}

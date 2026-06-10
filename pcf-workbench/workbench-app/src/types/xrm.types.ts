// Xrm / Dynamics 365 Type Definitions for Mock Engine

export interface XrmWebApiOnline {
  retrieveMultipleRecords(entityLogicalName: string, options?: string, maxPageSize?: number): Promise<XrmRetrieveMultipleResponse>;
  retrieveRecord(entityLogicalName: string, id: string, options?: string): Promise<XrmEntity>;
  createRecord(entityLogicalName: string, data: object): Promise<XrmEntityReference>;
  updateRecord(entityLogicalName: string, id: string, data: object): Promise<XrmEntityReference>;
  deleteRecord(entityLogicalName: string, id: string): Promise<XrmEntityReference>;
  execute(request: object): Promise<unknown>;
  executeMultiple(requests: object[]): Promise<unknown[]>;
}

export interface XrmWebApi extends XrmWebApiOnline {
  online: XrmWebApiOnline;
  offline: XrmWebApiOnline;
  isAvailableOffline(entityLogicalName: string): boolean;
}

export interface XrmRetrieveMultipleResponse {
  entities: XrmEntity[];
  nextLink?: string;
}

export interface XrmEntity {
  [key: string]: unknown;
}

export interface XrmEntityReference {
  entityType: string;
  id: string;
  name?: string;
}

export interface XrmNavigationOpenFormOptions {
  entityName: string;
  entityId?: string;
  formId?: string;
}

export interface XrmNavigation {
  openForm(formInput: XrmNavigationOpenFormOptions, formOptions?: object): Promise<{ savedEntityReference: XrmEntityReference[] }>;
  openUrl(url: string, openUrlOptions?: object): void;
  openAlertDialog(alertStrings: object, alertOptions?: object): Promise<void>;
  openConfirmDialog(confirmStrings: object, confirmOptions?: object): Promise<{ confirmed: boolean }>;
  openErrorDialog(errorOptions: object): Promise<void>;
  openFile(file: object, openFileOptions?: number): void;
  openWebResource(webResourceName: string, windowOptions?: object, data?: string): void;
  navigateTo(pageInput: object, navigationOptions?: object): Promise<void>;
  goBack(): void;
}

export interface XrmUtility {
  getEntityMetadata(entityLogicalName: string, attributes?: string[]): Promise<unknown>;
  getGlobalContext(): XrmGlobalContext;
  showProgressIndicator(message: string): void;
  closeProgressIndicator(): void;
  lookupObjects(lookupOptions: object): Promise<XrmEntityReference[]>;
  refreshParentGrid(lookupOptions: object): void;
  requestFile(fileOptions: object): Promise<XrmFileData>;
}

export interface XrmGlobalContext {
  getClientUrl(): string;
  getVersion(): string;
  isOnPremises(): boolean;
  getOrganizationSettings(): object;
  getAdvancedConfigSetting(setting: string): unknown;
  getCurrentAppUrl(): string;
  getCurrentAppName(): Promise<string>;
  getUserName(): string;
  getUserId(): string;
  getUserRoles(): Array<{ id: string; name: string }>;
  getDateTimeFormat(): object;
  getNumberFormat(): object;
  getTimeZoneOffsetMinutes(): number;
  prependOrgName(path: string): string;
}

export interface XrmFileData {
  fileContent: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface XrmMockObject {
  WebApi: XrmWebApi;
  App: XrmApp;
  Navigation: XrmNavigation;
  Utility: XrmUtility;
  Page: XrmPage;
  Device: XrmDevice;
  Encoding: XrmEncoding;
}

export interface XrmApp {
  addGlobalNotification(notification: object): Promise<number>;
  clearGlobalNotification(id: number): Promise<void>;
  getEnvironment(): object;
  getSidePanes(): object;
}

export interface XrmPage {
  data: {
    entity: {
      getId(): string;
      getEntityName(): string;
      attributes: { get(name: string): unknown };
      save(saveOption?: object): Promise<void>;
    };
    process: object;
    refresh(save: boolean): Promise<void>;
    save(saveOptions?: object): Promise<void>;
  };
  context: object;
  ui: {
    getFormType(): number;
    controls: { get(): unknown[] };
    tabs: { get(): unknown[] };
    setFormNotification(message: string, level: string, id: string): void;
    clearFormNotification(id: string): void;
    addOnLoad(fn: () => void): void;
    removeOnLoad(fn: () => void): void;
    close(): void;
  };
}

export interface XrmDevice {
  captureAudio(): Promise<XrmFileData>;
  captureImage(imageOptions?: object): Promise<XrmFileData>;
  captureVideo(): Promise<XrmFileData>;
  getBarcodeValue(): Promise<string>;
  getCurrentPosition(): Promise<GeolocationPosition>;
  pickFile(pickFileOptions?: object): Promise<XrmFileData[]>;
}

export interface XrmEncoding {
  getBase64EncodedValue(value: string): string;
  htmlAttributeEncode(value: string): string;
  htmlDecode(value: string): string;
  htmlEncode(value: string): string;
  xmlAttributeEncode(value: string): string;
  xmlEncode(value: string): string;
}

import { useLogStore } from "../../store/logStore";
import { useWorkbenchStore } from "../../store/workbenchStore";
import { useMockDataStore } from "../../store/mockDataStore";
import { createWebApiMock } from "./WebApiMock";
import type { XrmMockObject } from "../../types/xrm.types";

function logNav(method: string, args: unknown): void {
  useLogStore.getState().addApiCall({
    method: "ACTION",
    entity: `Navigation.${method}`,
    options: JSON.stringify(args),
    status: "success",
    duration: 0,
    responseData: null,
  });
}

export function createXrmMock(): XrmMockObject {
  const storeState = useMockDataStore.getState;
  const workbenchState = useWorkbenchStore.getState;

  const WebApi = createWebApiMock(
    () => storeState().entities,
    (name, records) => useMockDataStore.getState().setEntityRecords(name, records),
    (name, record) => useMockDataStore.getState().addRecord(name, record),
    () => storeState().customActions,
    () => storeState().fetchXmlMocks
  );

  const Navigation = {
    openForm: (formInput: object, formOptions?: object) => {
      logNav("openForm", { formInput, formOptions });
      return Promise.resolve({ savedEntityReference: [] });
    },
    openUrl: (url: string, openUrlOptions?: object) => {
      logNav("openUrl", { url, openUrlOptions });
      window.open(url, "_blank");
    },
    openAlertDialog: (alertStrings: object, alertOptions?: object) => {
      logNav("openAlertDialog", { alertStrings, alertOptions });
      return Promise.resolve();
    },
    openConfirmDialog: (confirmStrings: object, confirmOptions?: object) => {
      logNav("openConfirmDialog", { confirmStrings, confirmOptions });
      return Promise.resolve({ confirmed: true });
    },
    openErrorDialog: (errorOptions: object) => {
      logNav("openErrorDialog", errorOptions);
      return Promise.resolve();
    },
    openFile: (file: object, openFileOptions?: number) => {
      logNav("openFile", { file, openFileOptions });
    },
    openWebResource: (webResourceName: string, windowOptions?: object, data?: string) => {
      logNav("openWebResource", { webResourceName, windowOptions, data });
    },
    navigateTo: (pageInput: object, navigationOptions?: object) => {
      logNav("navigateTo", { pageInput, navigationOptions });
      return Promise.resolve();
    },
    goBack: () => { logNav("goBack", {}); },
  };

  function getMockLookupResults(lookupOptions: Record<string, unknown>) {
    const entityTypes = (lookupOptions.entityTypes as string[]) || ["contact"];
    const entities = storeState().entities;
    const results = [];
    for (const et of entityTypes) {
      const records = entities[et] || [];
      const idField = et + "id";
      const nameField = et === "account" ? "name" : et === "incident" ? "title" : "fullname";
      for (const r of records.slice(0, 5)) {
        results.push({ entityType: et, id: r[idField] as string, name: r[nameField] as string || "Unknown" });
      }
    }
    return results;
  }

  const Utility = {
    getEntityMetadata: (entityLogicalName: string, _attributes?: string[]) => {
      const meta = storeState().metadata[entityLogicalName];
      if (meta) return Promise.resolve(meta);
      return Promise.resolve({
        LogicalName: entityLogicalName,
        DisplayName: entityLogicalName,
        DisplayCollectionName: entityLogicalName + "s",
        PrimaryIdAttribute: entityLogicalName + "id",
        PrimaryNameAttribute: "name",
        Attributes: [],
      });
    },
    getGlobalContext: () => {
      const s = workbenchState().mockSettings;
      return {
        getClientUrl: () => `https://${s.organizationName.toLowerCase().replace(/\s+/g, "")}.crm.dynamics.com`,
        getVersion: () => "9.2.23043.00148",
        isOnPremises: () => false,
        getOrganizationSettings: () => ({
          attributes: {},
          baseCurrencyId: "USD",
          defaultCountryCode: "US",
          isAutoSaveEnabled: true,
          languageId: s.languageId,
          organizationId: "mock-org-id-00000001",
          uniqueName: s.organizationName.toLowerCase().replace(/\s+/g, ""),
          useSkypeProtocol: false,
        }),
        getAdvancedConfigSetting: (_setting: string) => null,
        getCurrentAppUrl: () => `https://${s.organizationName.toLowerCase().replace(/\s+/g, "")}.crm.dynamics.com/main.aspx`,
        getCurrentAppName: () => Promise.resolve("PCF Workbench Mock App"),
        getUserName: () => s.userName,
        getUserId: () => s.userId,
        getUserRoles: () => [{ id: "mock-role-id-sysadmin", name: "System Administrator" }],
        getDateTimeFormat: () => ({ FirstDayOfWeek: 0, LongDatePattern: "dddd, MMMM d, yyyy", ShortDatePattern: "M/d/yyyy" }),
        getNumberFormat: () => ({ CurrencyDecimalDigits: 2, CurrencySymbol: "$", NumberDecimalSeparator: "." }),
        getTimeZoneOffsetMinutes: () => -300,
        prependOrgName: (path: string) => `/${s.organizationName.toLowerCase().replace(/\s+/g, "")}${path}`,
      };
    },
    showProgressIndicator: (message: string) => {
      useLogStore.getState().addConsoleEntry("info", [`[Progress]: ${message}`]);
    },
    closeProgressIndicator: () => {},
    lookupObjects: (lookupOptions: object) => {
      logNav("lookupObjects", lookupOptions);
      return Promise.resolve(getMockLookupResults(lookupOptions as Record<string, unknown>));
    },
    refreshParentGrid: (_lookupOptions: object) => {},
    requestFile: (_fileOptions: object) =>
      Promise.resolve({ fileContent: "bW9jaw==", fileName: "mock.txt", fileSize: 4, mimeType: "text/plain" }),
  };

  const App = {
    addGlobalNotification: (notification: object) => {
      logNav("addGlobalNotification", notification);
      return Promise.resolve(Date.now());
    },
    clearGlobalNotification: (id: number) => {
      logNav("clearGlobalNotification", { id });
      return Promise.resolve();
    },
    getEnvironment: () => ({
      appId: "mock-app-id-00000001",
      displayName: workbenchState().mockSettings.organizationName,
      uniqueName: workbenchState().mockSettings.organizationName.toLowerCase().replace(/\s+/g, ""),
      version: "9.2.0",
    }),
    getSidePanes: () => ({ getPane: () => null }),
    sidePanes: { createPane: (_props: object) => Promise.resolve({ paneId: "mock-pane-" + Date.now() }) },
  };

  function getMockAttribute(name: string) {
    return {
      getValue: () => name.includes("id") ? "{mock-id}" : `mock-${name}`,
      setValue: (_v: unknown) => {},
      getName: () => name,
      getAttributeType: () => "string",
      getIsDirty: () => false,
      setSubmitMode: () => {},
    };
  }

  const Page = {
    data: {
      entity: {
        getId: () => "{mock-entity-id-00000001}",
        getEntityName: () => "contact",
        attributes: { get: (name: string) => getMockAttribute(name) },
        save: (_saveOption?: object) => { logNav("entity.save", {}); return Promise.resolve(); },
      },
      process: {},
      refresh: (_save: boolean) => Promise.resolve(),
      save: (_saveOptions?: object) => Promise.resolve(),
    },
    context: {},
    ui: {
      getFormType: () => 2,
      controls: { get: () => [] },
      tabs: { get: () => [] },
      setFormNotification: (message: string, level: string, id: string) => {
        logNav("setFormNotification", { message, level, id });
      },
      clearFormNotification: (id: string) => { logNav("clearFormNotification", { id }); },
      addOnLoad: (_fn: () => void) => {},
      removeOnLoad: (_fn: () => void) => {},
      close: () => {},
    },
  };

  const Device = {
    captureAudio: () => Promise.resolve({ fileContent: "", fileName: "audio.wav", fileSize: 0, mimeType: "audio/wav" }),
    captureImage: (_imageOptions?: object) =>
      Promise.resolve({ fileContent: "", fileName: "photo.jpg", fileSize: 0, mimeType: "image/jpeg" }),
    captureVideo: () => Promise.resolve({ fileContent: "", fileName: "video.mp4", fileSize: 0, mimeType: "video/mp4" }),
    getBarcodeValue: () => Promise.resolve("MOCK-BARCODE-12345"),
    getCurrentPosition: () =>
      Promise.resolve({
        coords: { latitude: 37.7749, longitude: -122.4194, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
        timestamp: Date.now(),
      } as unknown as GeolocationPosition),
    pickFile: (_pickFileOptions?: object) =>
      Promise.resolve([{ fileContent: "bW9jaw==", fileName: "mockfile.pdf", fileSize: 4, mimeType: "application/pdf" }]),
  };

  const Encoding = {
    getBase64EncodedValue: (value: string) => btoa(value),
    htmlAttributeEncode: (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
    htmlDecode: (value: string) => value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
    htmlEncode: (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
    xmlAttributeEncode: (value: string) => value,
    xmlEncode: (value: string) => value,
  };

  return { WebApi, App, Navigation, Utility, Page, Device, Encoding };
}

// Serializable version for iframe injection
export function serializeXrmForIframe(): string {
  const settings = useWorkbenchStore.getState().mockSettings;
  return `
(function() {
  'use strict';
  var _pendingCalls = {};
  var _callIdCounter = 0;

  function _proxyCall(method, entity, options, data) {
    return new Promise(function(resolve, reject) {
      var requestId = 'req_' + (++_callIdCounter) + '_' + Date.now();
      _pendingCalls[requestId] = { resolve: resolve, reject: reject };
      window.parent.postMessage({
        type: 'api_call',
        requestId: requestId,
        method: method,
        entity: entity,
        options: options,
        data: data
      }, '*');
      setTimeout(function() {
        if (_pendingCalls[requestId]) {
          delete _pendingCalls[requestId];
          reject(new Error('Timeout waiting for mock response'));
        }
      }, 10000);
    });
  }

  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'api_response') {
      var pending = _pendingCalls[event.data.requestId];
      if (pending) {
        delete _pendingCalls[event.data.requestId];
        if (event.data.error) {
          var err = new Error(event.data.error.message || 'API Error');
          err.errorCode = event.data.error.errorCode;
          pending.reject(err);
        } else {
          pending.resolve(event.data.data);
        }
      }
    }
  });

  var _orgName = '${settings.organizationName.toLowerCase().replace(/\s+/g, '')}';
  var _userId = '${settings.userId}';
  var _userName = '${settings.userName}';
  var _orgUrl = 'https://' + _orgName + '.crm.dynamics.com';

  var WebApiProxy = {
    isAvailableOffline: function() { return false; },
    retrieveMultipleRecords: function(entity, options, maxPageSize) {
      return _proxyCall('retrieveMultipleRecords', entity, options, { maxPageSize: maxPageSize });
    },
    retrieveRecord: function(entity, id, options) {
      return _proxyCall('retrieveRecord', entity, null, { id: id, options: options });
    },
    createRecord: function(entity, data) {
      return _proxyCall('createRecord', entity, null, data);
    },
    updateRecord: function(entity, id, data) {
      return _proxyCall('updateRecord', entity, null, { id: id, data: data });
    },
    deleteRecord: function(entity, id) {
      return _proxyCall('deleteRecord', entity, null, { id: id });
    },
    execute: function(request) {
      return _proxyCall('execute', request.RequestName || request.LogicalName || 'Action', null, request);
    },
    executeMultiple: function(requests) {
      return _proxyCall('executeMultiple', 'Multiple', null, requests);
    }
  };
  WebApiProxy.online = WebApiProxy;
  WebApiProxy.offline = WebApiProxy;

  var NavigationProxy = {
    openForm: function(fi, fo) {
      return _proxyCall('navigation.openForm', null, null, { formInput: fi, formOptions: fo });
    },
    openUrl: function(url, opts) {
      window.open(url, '_blank');
      _proxyCall('navigation.openUrl', null, null, { url: url, opts: opts });
    },
    openAlertDialog: function(s, o) { return _proxyCall('navigation.openAlertDialog', null, null, { s: s, o: o }); },
    openConfirmDialog: function(s, o) { return _proxyCall('navigation.openConfirmDialog', null, null, { s: s, o: o }).then(function() { return { confirmed: true }; }); },
    openErrorDialog: function(o) { return _proxyCall('navigation.openErrorDialog', null, null, o); },
    openFile: function(f, o) { _proxyCall('navigation.openFile', null, null, { f: f, o: o }); },
    openWebResource: function(n, w, d) { _proxyCall('navigation.openWebResource', null, null, { n: n, w: w, d: d }); },
    navigateTo: function(p, n) { return _proxyCall('navigation.navigateTo', null, null, { p: p, n: n }); },
    goBack: function() { _proxyCall('navigation.goBack', null, null, {}); }
  };

  var UtilityProxy = {
    getEntityMetadata: function(name, attrs) {
      return _proxyCall('utility.getEntityMetadata', name, null, { attributes: attrs });
    },
    getGlobalContext: function() {
      return {
        getClientUrl: function() { return _orgUrl; },
        getVersion: function() { return '9.2.23043.00148'; },
        isOnPremises: function() { return false; },
        getOrganizationSettings: function() { return { organizationId: 'mock-org-id', uniqueName: _orgName, languageId: ${settings.languageId} }; },
        getAdvancedConfigSetting: function() { return null; },
        getCurrentAppUrl: function() { return _orgUrl + '/main.aspx'; },
        getCurrentAppName: function() { return Promise.resolve('PCF Workbench'); },
        getUserName: function() { return '${settings.userName}'; },
        getUserId: function() { return '${settings.userId}'; },
        getUserRoles: function() { return [{ id: 'mock-role-id', name: 'System Administrator' }]; },
        getDateTimeFormat: function() { return { FirstDayOfWeek: 0, LongDatePattern: 'dddd, MMMM d, yyyy' }; },
        getNumberFormat: function() { return { CurrencyDecimalDigits: 2, CurrencySymbol: '$' }; },
        getTimeZoneOffsetMinutes: function() { return -300; },
        prependOrgName: function(p) { return '/' + _orgName + p; }
      };
    },
    showProgressIndicator: function(msg) { console.info('[Progress]: ' + msg); },
    closeProgressIndicator: function() {},
    lookupObjects: function(opts) { return _proxyCall('utility.lookupObjects', null, null, opts); },
    refreshParentGrid: function() {},
    requestFile: function(opts) { return _proxyCall('utility.requestFile', null, null, opts); }
  };

  window.Xrm = {
    WebApi: WebApiProxy,
    Navigation: NavigationProxy,
    Utility: UtilityProxy,
    App: {
      addGlobalNotification: function(n) { return Promise.resolve(1); },
      clearGlobalNotification: function() { return Promise.resolve(); },
      getEnvironment: function() { return { appId: 'mock-app-id', displayName: 'PCF Workbench', uniqueName: _orgName }; },
      getSidePanes: function() { return { getPane: function() { return null; } }; }
    },
    Device: {
      captureAudio: function() { return Promise.resolve({ fileContent: '', fileName: 'audio.wav', fileSize: 0, mimeType: 'audio/wav' }); },
      captureImage: function() { return Promise.resolve({ fileContent: '', fileName: 'photo.jpg', fileSize: 0, mimeType: 'image/jpeg' }); },
      captureVideo: function() { return Promise.resolve({ fileContent: '', fileName: 'video.mp4', fileSize: 0, mimeType: 'video/mp4' }); },
      getBarcodeValue: function() { return Promise.resolve('MOCK-BARCODE-12345'); },
      getCurrentPosition: function() { return Promise.resolve({ coords: { latitude: 37.7749, longitude: -122.4194, accuracy: 10 }, timestamp: Date.now() }); },
      pickFile: function() { return Promise.resolve([{ fileContent: 'bW9jaw==', fileName: 'mockfile.pdf', fileSize: 4, mimeType: 'application/pdf' }]); }
    },
    Encoding: {
      getBase64EncodedValue: function(v) { return btoa(v); },
      htmlAttributeEncode: function(v) { return v.replace(/&/g,'&amp;').replace(/</g,'&lt;'); },
      htmlDecode: function(v) { return v; },
      htmlEncode: function(v) { return v.replace(/&/g,'&amp;').replace(/</g,'&lt;'); },
      xmlAttributeEncode: function(v) { return v; },
      xmlEncode: function(v) { return v; }
    },
    Page: {
      data: {
        entity: {
          getId: function() { return '{mock-entity-id-00000001}'; },
          getEntityName: function() { return 'contact'; },
          attributes: { get: function(n) { return { getValue: function() { return null; }, setValue: function() {}, getName: function() { return n; } }; } },
          save: function() { return Promise.resolve(); }
        },
        process: {},
        refresh: function() { return Promise.resolve(); },
        save: function() { return Promise.resolve(); }
      },
      context: {},
      ui: {
        getFormType: function() { return 2; },
        controls: { get: function() { return []; } },
        tabs: { get: function() { return []; } },
        setFormNotification: function() {},
        clearFormNotification: function() {},
        addOnLoad: function() {},
        removeOnLoad: function() {},
        close: function() {}
      }
    }
  };

  // Override console to relay to workbench
  var _oc = window.console;
  function _relay(level, args) {
    try { window.parent.postMessage({ type: 'console', level: level, args: Array.from(args).map(function(a) { try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch(e) { return String(a); } }) }, '*'); } catch(e) {}
    return args;
  }
  window.console = {
    log: function() { _oc.log.apply(_oc, arguments); _relay('log', arguments); },
    warn: function() { _oc.warn.apply(_oc, arguments); _relay('warn', arguments); },
    error: function() { _oc.error.apply(_oc, arguments); _relay('error', arguments); },
    info: function() { _oc.info.apply(_oc, arguments); _relay('info', arguments); },
    debug: function() { _oc.debug.apply(_oc, arguments); _relay('debug', arguments); }
  };

  window.onerror = function(msg, src, line, col, err) {
    window.parent.postMessage({ type: 'console', level: 'error', args: [String(msg) + ' (' + src + ':' + line + ':' + col + ')', err ? String(err.stack || err) : ''] }, '*');
  };

  window.parent.postMessage({ type: 'console', level: 'info', args: ['[PCF Workbench] Xrm mock ready'] }, '*');
  window.dispatchEvent(new MessageEvent('message', { data: { type: 'xrm_ready' } }));
})();
`;
}

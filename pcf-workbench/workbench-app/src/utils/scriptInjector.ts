import type { ParsedManifest } from "../types/pcf.types";
import { serializeXrmForIframe } from "../components/mock-engine/XrmMock";
import { useWorkbenchStore } from "../store/workbenchStore";
import { useMockDataStore } from "../store/mockDataStore";

export interface InjectionOptions {
  manifest: ParsedManifest;
  bundleContent: string;
  cssContents?: string[];  // inline CSS to embed in the srcdoc
  canvasBackground?: string;
  propertyBagJson?: string;
  allocatedWidth?: number;
  allocatedHeight?: number;
}

export function buildIframeSrcdoc(options: InjectionOptions): string {
  const {
    manifest,
    bundleContent,
    cssContents = [],
    canvasBackground = "#ffffff",
    propertyBagJson = "{}",
    allocatedWidth = 600,
    allocatedHeight = 400,
  } = options;

  const settings = useWorkbenchStore.getState().mockSettings;
  const httpMocks = useMockDataStore.getState().httpMocks.filter((m) => m.enabled);
  const xrmScript = serializeXrmForIframe();

  const httpMockScript = httpMocks.length > 0 ? `
(function() {
  'use strict';
  var _httpMocks = ${JSON.stringify(httpMocks)};
  var _originalFetch = window.fetch;

  function _matchUrl(url, pattern, matchType) {
    if (matchType === 'exact') return url === pattern;
    if (matchType === 'startsWith') return url.indexOf(pattern) === 0;
    return url.indexOf(pattern) !== -1; // contains
  }

  function _findMock(url, method) {
    for (var i = 0; i < _httpMocks.length; i++) {
      var m = _httpMocks[i];
      if (!_matchUrl(url, m.urlPattern, m.matchType)) continue;
      if (m.method !== 'ANY' && m.method !== method.toUpperCase()) continue;
      return m;
    }
    return null;
  }

  window.fetch = function(input, init) {
    var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
    var method = (init && init.method) ? init.method : 'GET';
    var mock = _findMock(url, method);
    if (!mock) return _originalFetch.apply(window, arguments);

    window.parent.postMessage({
      type: 'http_mock_hit',
      url: url,
      method: method,
      mockId: mock.id,
      urlPattern: mock.urlPattern
    }, '*');

    return new Promise(function(resolve) {
      setTimeout(function() {
        var body = typeof mock.responseBody === 'string' ? mock.responseBody : JSON.stringify(mock.responseBody);
        var headers = mock.responseHeaders || { 'Content-Type': 'application/json' };
        resolve(new Response(body, {
          status: mock.statusCode,
          statusText: mock.statusCode === 200 ? 'OK' : 'Mock Status',
          headers: new Headers(headers)
        }));
      }, mock.delay || 0);
    });
  };

  var _OrigXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    var xhr = new _OrigXHR();
    var _open = xhr.open;
    var _url = '';
    var _method = 'GET';
    xhr.open = function(method, url) {
      _url = url;
      _method = method;
      return _open.apply(xhr, arguments);
    };
    var _send = xhr.send;
    xhr.send = function(body) {
      var mock = _findMock(_url, _method);
      if (!mock) return _send.apply(xhr, arguments);

      window.parent.postMessage({
        type: 'http_mock_hit',
        url: _url,
        method: _method,
        mockId: mock.id,
        urlPattern: mock.urlPattern
      }, '*');

      setTimeout(function() {
        var responseText = typeof mock.responseBody === 'string' ? mock.responseBody : JSON.stringify(mock.responseBody);
        Object.defineProperty(xhr, 'readyState', { writable: true, value: 4 });
        Object.defineProperty(xhr, 'status', { writable: true, value: mock.statusCode });
        Object.defineProperty(xhr, 'statusText', { writable: true, value: mock.statusCode === 200 ? 'OK' : 'Mock Status' });
        Object.defineProperty(xhr, 'responseText', { writable: true, value: responseText });
        Object.defineProperty(xhr, 'response', { writable: true, value: responseText });
        if (typeof xhr.onreadystatechange === 'function') xhr.onreadystatechange();
        if (typeof xhr.onload === 'function') xhr.onload();
      }, mock.delay || 0);
    };
    return xhr;
  };
})();
` : "";

  const bootstrapScript = `
(function() {
  'use strict';
  var _control = null;
  var _notifyOutputChangedCb = null;
  var _container = document.getElementById('pcf-container');

  function _notifyOutputChanged() {
    try {
      if (_control && typeof _control.getOutputs === 'function') {
        var outputs = _control.getOutputs();
        window.parent.postMessage({ type: 'output_changed', outputs: outputs }, '*');
      }
    } catch(e) {
      console.error('notifyOutputChanged error:', e);
    }
  }

  function _buildPropertyBag(raw) {
    var bag = {};
    var props = raw || {};
    Object.keys(props).forEach(function(k) {
      bag[k] = {
        raw: props[k] && props[k].raw !== undefined ? props[k].raw : props[k],
        formatted: props[k] && props[k].formatted ? props[k].formatted : String(props[k] && props[k].raw !== undefined ? props[k].raw : props[k]),
        type: props[k] && props[k].type ? props[k].type : 'string',
        attributes: {}
      };
    });
    return bag;
  }

  function _buildContext(propertyBag) {
    return {
      parameters: propertyBag,
      updatedProperties: Object.keys(propertyBag),
      mode: {
        allocatedHeight: ${allocatedHeight},
        allocatedWidth: ${allocatedWidth},
        isControlDisabled: false,
        isVisible: true,
        label: 'PCF Control',
        setControlState: function() {},
        setFullScreen: function() {},
        trackContainerResize: function(v) { if (v) { window.parent.postMessage({ type: 'resize', width: ${allocatedWidth}, height: ${allocatedHeight} }, '*'); } }
      },
      client: {
        getClient: function() { return 'Web'; },
        getFormFactor: function() { return 1; },
        isNetworkAvailable: function() { return ${!settings.isOffline}; },
        isOffline: function() { return ${settings.isOffline}; }
      },
      userSettings: {
        dateFormattingInfo: { FirstDayOfWeek: 0, LongDatePattern: 'dddd, MMMM d, yyyy', ShortDatePattern: 'M/d/yyyy' },
        isRTL: false,
        languageId: ${settings.languageId},
        numberFormattingInfo: { CurrencyDecimalDigits: 2, CurrencySymbol: '$', NumberDecimalSeparator: '.' },
        securityRoles: ['System Administrator'],
        timeZoneOffsetMinutes: -300,
        userId: '${settings.userId}',
        userName: '${settings.userName}',
        getTimeZoneOffsetMinutes: function() { return -300; }
      },
      formatting: {
        formatCurrency: function(v, p, s) { return (s || '$') + Number(v).toFixed(p || 2); },
        formatDateAsFilterStringInUTC: function(v) { return new Date(v).toISOString(); },
        formatDateLong: function(v) { return new Date(v).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); },
        formatDateLongAbbreviated: function(v) { return new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); },
        formatDateShort: function(v) { return new Date(v).toLocaleDateString('en-US'); },
        formatDateYearMonth: function(v) { return new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }); },
        formatDecimal: function(v, p) { return Number(v).toFixed(p || 2); },
        formatInteger: function(v) { return Math.round(v).toString(); },
        formatLanguage: function(v) { return 'Language(' + v + ')'; },
        formatTime: function(v) { return new Date(v).toLocaleTimeString('en-US'); },
        getWeekOfYear: function(v) { var d = new Date(v); var s = new Date(d.getFullYear(), 0, 1); return Math.ceil(((d - s) / 86400000 + s.getDay() + 1) / 7); },
        parseDateFromInput: function(v) { var d = new Date(v); return isNaN(d.getTime()) ? null : d; }
      },
      navigation: window.Xrm.Navigation,
      webAPI: window.Xrm.WebApi,
      resources: {
        getResource: function(id, success) { setTimeout(function() { success(''); }, 50); },
        getString: function(id) { return id; }
      },
      utils: {
        lookupObjects: function(opts) { return window.Xrm.Utility.lookupObjects(opts); },
        getEntityMetadata: function(name, attrs) { return window.Xrm.Utility.getEntityMetadata(name, attrs); },
        hasEntityPrivilege: function() { return true; }
      },
      device: {
        captureAudio: function() { return window.Xrm.Device.captureAudio(); },
        captureImage: function(opts) { return window.Xrm.Device.captureImage(opts); },
        captureVideo: function() { return window.Xrm.Device.captureVideo(); },
        getBarcodeValue: function() { return window.Xrm.Device.getBarcodeValue(); },
        getCurrentPosition: function() { return window.Xrm.Device.getCurrentPosition(); },
        pickFile: function(opts) {
          return new Promise(function(resolve, reject) {
            var input = document.createElement('input');
            input.type = 'file';
            if (opts && opts.allowMultipleFiles) input.multiple = true;
            if (opts && opts.accept && opts.accept !== 'any') input.accept = opts.accept;
            input.style.display = 'none';
            input.addEventListener('change', function() {
              var files = Array.from(input.files || []);
              if (!files.length) { reject(new Error('cancelled')); return; }
              Promise.all(files.map(function(f) {
                return new Promise(function(res, rej) {
                  var reader = new FileReader();
                  reader.onload = function() {
                    var base64 = (reader.result || '').toString().split(',')[1] || '';
                    res({ fileName: f.name, fileSize: f.size, mimeType: f.type || 'application/octet-stream', fileContent: base64 });
                  };
                  reader.onerror = function() { rej(new Error('Failed to read file')); };
                  reader.readAsDataURL(f);
                });
              })).then(resolve).catch(reject);
              input.remove();
            });
            document.body.appendChild(input);
            input.click();
          });
        }
      },
      diagnostics: {
        getSessionDiagnostics: function() { return {}; },
        getSystemDiagnostics: function() { return {}; }
      },
      factory: {
        createElement: function(t, p, c) { return { type: t, props: p, children: c }; },
        getPopupService: function() { return { createPopup: function() {}, openPopup: function() {}, closePopup: function() {}, deletePopup: function() {} }; },
        requestRender: function() {}
      },
      events: { getEventArgs: function() { return {}; } },
      page: { appId: 'mock-app-id', entityId: '{mock-entity-id}', entityTypeName: 'contact', id: 'mock-page-id', isPageReadOnly: false }
    };
  }

  window.addEventListener('message', function(event) {
    if (!event.data) return;
    if (event.data.type === 'update_view') {
      if (_control) {
        try {
          var newBag = _buildPropertyBag(event.data.parameters);
          var ctx = _buildContext(newBag);
          var start = performance.now();
          _control.updateView(ctx);
          var dur = Math.round(performance.now() - start);
          window.parent.postMessage({ type: 'perf', event: 'updateView', duration: dur }, '*');
        } catch(e) {
          console.error('updateView error:', e);
          window.parent.postMessage({ type: 'error', message: String(e), stack: e && e.stack ? e.stack : '' }, '*');
        }
      }
    }
    if (event.data.type === 'destroy_control') {
      if (_control && typeof _control.destroy === 'function') {
        try { _control.destroy(); } catch(e) { console.warn('destroy error:', e); }
        _control = null;
      }
    }
  });

  // XrmMock script dispatches a local 'message' event with type 'xrm_ready'
  // when Xrm is set up. Listen for it, with a direct-init fallback.
  var _initialized = false;
  function _tryInit() {
    if (_initialized) return;
    _initialized = true;
    initControl();
  }

  window.addEventListener('message', function onReady(event) {
    if (!event.data || event.data.type !== 'xrm_ready') return;
    window.removeEventListener('message', onReady);
    _tryInit();
  });

  // Fallback: if xrm_ready was already fired synchronously before this listener attached
  if (window.Xrm) {
    _tryInit();
  }

  function initControl() {
    try {
      // Get control constructor
      var ns = '${manifest.namespace}';
      var ctor = '${manifest.constructor}';
      var CtorFn = null;
      try {
        CtorFn = ns ? window[ns][ctor] : window[ctor];
      } catch(e) {
        // Try flat namespace
        CtorFn = window[ctor] || window[ns + '.' + ctor];
      }
      if (!CtorFn) {
        // Search all window keys for the constructor
        var keys = Object.keys(window);
        for (var i = 0; i < keys.length; i++) {
          var val = window[keys[i]];
          if (val && typeof val === 'object' && val[ctor]) { CtorFn = val[ctor]; break; }
          if (val && typeof val === 'function' && keys[i] === ctor) { CtorFn = val; break; }
        }
      }
      if (!CtorFn) {
        throw new Error('Control constructor not found: ' + ns + '.' + ctor + '. Make sure bundle.js exports the control correctly.');
      }

      var rawBag = ${propertyBagJson};
      var bag = _buildPropertyBag(rawBag);
      var ctx = _buildContext(bag);

      _control = new CtorFn();
      var start = performance.now();
      _control.init(ctx, _notifyOutputChanged, {}, _container);
      var initDur = Math.round(performance.now() - start);
      window.parent.postMessage({ type: 'perf', event: 'init', duration: initDur }, '*');

      var start2 = performance.now();
      _control.updateView(ctx);
      var uvDur = Math.round(performance.now() - start2);
      window.parent.postMessage({ type: 'perf', event: 'updateView', duration: uvDur }, '*');

      window.parent.postMessage({ type: 'init_complete', namespace: ns, constructor: ctor }, '*');
    } catch(e) {
      console.error('PCF init error:', e);
      window.parent.postMessage({ type: 'error', message: String(e), stack: e && e.stack ? e.stack : '' }, '*');
      _container.innerHTML = '<div style="color:#ef4444;padding:16px;font-family:monospace;"><strong>PCF Init Error:</strong><br>' + String(e) + (e && e.stack ? '<br><pre style=\\"font-size:11px;margin-top:8px\\">' + e.stack + '</pre>' : '') + '</div>';
    }
  }
})();
`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PCF Control</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: auto; background: ${canvasBackground}; }
    #pcf-container { width: 100%; height: 100%; min-height: 100px; }
  </style>${cssContents.length > 0 ? "\n  <style>\n" + cssContents.join("\n") + "\n  </style>" : ""}
</head>
<body>
  <div id="pcf-container"></div>${httpMockScript ? `
  <script>
${httpMockScript}
  </script>` : ""}
  <script>
${xrmScript}
  </script>
  <script>
${bundleContent}
  </script>
  <script>
${bootstrapScript}
  </script>
</body>
</html>`;
}

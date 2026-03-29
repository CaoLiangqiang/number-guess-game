(function (global) {
  function ensureJsExtension(path) {
    return /\.[a-z0-9]+$/i.test(path) ? path : path + '.js';
  }

  function dirname(path) {
    const normalized = path.replace(/\\/g, '/');
    const index = normalized.lastIndexOf('/');
    return index <= 0 ? '/' : normalized.slice(0, index);
  }

  function normalizePath(path) {
    const parts = path.replace(/\\/g, '/').split('/');
    const stack = [];

    for (const part of parts) {
      if (!part || part === '.') continue;
      if (part === '..') {
        stack.pop();
        continue;
      }
      stack.push(part);
    }

    return '/' + stack.join('/');
  }

  function resolveRequest(request, parentUrl) {
    if (request.startsWith('/')) {
      return normalizePath(ensureJsExtension(request));
    }

    if (request.startsWith('.')) {
      return normalizePath(ensureJsExtension(dirname(parentUrl) + '/' + request));
    }

    return normalizePath(ensureJsExtension('/' + request));
  }

  function defaultFetchText(url) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);

    if (xhr.status >= 200 && xhr.status < 300) {
      return xhr.responseText;
    }

    if (xhr.status === 0 && xhr.responseText) {
      return xhr.responseText;
    }

    throw new Error('Failed to load module: ' + url);
  }

  function createBrowserModuleLoader(options) {
    const settings = options || {};
    const fetchText = settings.fetchText || defaultFetchText;
    const cache = new Map();

    function requireModule(request, parentUrl) {
      const resolvedUrl = parentUrl ? resolveRequest(request, parentUrl) : resolveRequest(request, '/');

      if (cache.has(resolvedUrl)) {
        return cache.get(resolvedUrl).exports;
      }

      const module = { exports: {} };
      cache.set(resolvedUrl, module);

      const source = fetchText(resolvedUrl);
      const wrappedSource = `${source}\n//# sourceURL=${resolvedUrl}`;
      const factory = new Function('require', 'module', 'exports', '__filename', '__dirname', wrappedSource);
      factory(function (childRequest) {
        return requireModule(childRequest, resolvedUrl);
      }, module, module.exports, resolvedUrl, dirname(resolvedUrl));

      return module.exports;
    }

    return {
      cache: cache,
      require: function (request) {
        return requireModule(request, '/');
      },
      resolve: function (request, parentUrl) {
        return resolveRequest(request, parentUrl || '/');
      }
    };
  }

  const api = {
    createBrowserModuleLoader: createBrowserModuleLoader
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.MiniprogramPreviewLoader = api;
})(typeof window !== 'undefined' ? window : globalThis);

'use strict';

const vm = require('node:vm');
const esprima = require('esprima');

function createNoopProxy() {
  const fn = function noopProxy() {
    return fn;
  };
  return new Proxy(fn, {
    get(target, prop) {
      if (prop === Symbol.toPrimitive) return () => '';
      if (prop === 'toString') return () => '';
      if (prop === 'valueOf') return () => 0;
      return target;
    },
    apply() {
      return fn;
    },
    construct() {
      return fn;
    },
  });
}

const NOOP_PROXY = createNoopProxy();

function createStorageStub() {
  const store = new Map();
  return {
    getItem(key) {
      const k = String(key || '');
      return store.has(k) ? store.get(k) : null;
    },
    setItem(key, value) {
      store.set(String(key || ''), String(value || ''));
    },
    removeItem(key) {
      store.delete(String(key || ''));
    },
    clear() {
      store.clear();
    },
  };
}

function createElementStub() {
  return {
    style: {},
    dataset: {},
    value: '',
    innerHTML: '',
    textContent: '',
    className: '',
    href: '',
    src: '',
    setAttribute() {},
    getAttribute() {
      return '';
    },
    removeAttribute() {},
    appendChild() {},
    removeChild() {},
    addEventListener() {},
    removeEventListener() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    getContext() {
      return NOOP_PROXY;
    },
    click() {},
    submit() {},
    focus() {},
    blur() {},
  };
}

function buildSandbox(seed) {
  const localStorage = createStorageStub();
  const sessionStorage = createStorageStub();
  const location = {
    href: 'https://ctf.local/',
    origin: 'https://ctf.local',
    host: 'ctf.local',
    hostname: 'ctf.local',
    protocol: 'https:',
    pathname: '/',
    search: '',
    hash: '',
    assign() {},
    replace() {},
    reload() {},
    toString() {
      return this.href;
    },
  };
  const document = {
    cookie: '',
    referrer: '',
    title: '',
    location,
    body: createElementStub(),
    head: createElementStub(),
    documentElement: createElementStub(),
    readyState: 'complete',
    createElement() {
      return createElementStub();
    },
    createTextNode(text) {
      return { nodeValue: String(text || '') };
    },
    getElementById() {
      return createElementStub();
    },
    getElementsByClassName() {
      return [];
    },
    getElementsByTagName() {
      return [];
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {},
    removeEventListener() {},
    write() {},
    writeln() {},
  };
  const navigator = {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    platform: 'Win32',
    language: 'zh-CN',
    languages: ['zh-CN', 'zh', 'en-US', 'en'],
    webdriver: false,
  };

  const sandbox = {
    console: {
      log() {},
      info() {},
      warn() {},
      error() {},
      debug() {},
    },
    Buffer,
    URL,
    URLSearchParams,
    atob(s) {
      return Buffer.from(String(s || ''), 'base64').toString('binary');
    },
    btoa(s) {
      return Buffer.from(String(s || ''), 'binary').toString('base64');
    },
    encodeURIComponent,
    decodeURIComponent,
    escape,
    unescape,
    parseInt,
    parseFloat,
    isNaN,
    Math,
    Date,
    JSON,
    RegExp,
    String,
    Number,
    Boolean,
    Array,
    Object,
    Promise,
    setTimeout(fn) {
      if (typeof fn === 'function') {
        try {
          fn();
        } catch (_) {}
      }
      return 1;
    },
    clearTimeout() {},
    setInterval() {
      return 1;
    },
    clearInterval() {},
    setImmediate(fn) {
      if (typeof fn === 'function') {
        try {
          fn();
        } catch (_) {}
      }
      return 1;
    },
    clearImmediate() {},
    fetch: async () => ({
      ok: true,
      status: 200,
      text: async () => '',
      json: async () => ({}),
      headers: { get: () => '' },
    }),
    XMLHttpRequest: class {
      open() {}
      setRequestHeader() {}
      send() {
        this.readyState = 4;
        this.status = 200;
        this.responseText = '';
        if (typeof this.onreadystatechange === 'function') {
          this.onreadystatechange();
        }
      }
      abort() {}
    },
    localStorage,
    sessionStorage,
    location,
    navigator,
    document,
    history: {
      pushState() {},
      replaceState() {},
      back() {},
      forward() {},
      go() {},
    },
  };

  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.global = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.top = sandbox;
  sandbox.parent = sandbox;

  const jqueryLike = function jqueryLike() {
    return NOOP_PROXY;
  };
  jqueryLike.ajax = () => Promise.resolve({});
  jqueryLike.get = () => Promise.resolve({});
  jqueryLike.post = () => Promise.resolve({});
  jqueryLike.extend = Object.assign;
  sandbox.$ = jqueryLike;
  sandbox.jQuery = jqueryLike;

  return Object.assign(sandbox, seed || {});
}

function extractInlineScripts(html) {
  const src = String(html || '');
  const out = [];
  const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(src)) !== null) {
    const code = String(m[1] || '').trim();
    if (!code) continue;
    out.push(code);
  }
  if (!out.length && src.trim()) {
    out.push(src);
  }
  return out;
}

function walkAst(node, visitor) {
  if (!node || typeof node !== 'object') return;
  visitor(node);
  for (const key of Object.keys(node)) {
    const child = node[key];
    if (!child) continue;
    if (Array.isArray(child)) {
      for (const one of child) {
        if (one && typeof one === 'object') walkAst(one, visitor);
      }
      continue;
    }
    if (child && typeof child.type === 'string') {
      walkAst(child, visitor);
    }
  }
}

function parseScriptAst(code) {
  try {
    return esprima.parseScript(code, {
      range: true,
      tolerant: true,
    });
  } catch (_) {
    return null;
  }
}

function getMemberPropertyName(node) {
  if (!node || node.type !== 'MemberExpression') return '';
  if (!node.computed && node.property && node.property.type === 'Identifier') {
    return node.property.name;
  }
  if (
    node.computed &&
    node.property &&
    node.property.type === 'Literal' &&
    (typeof node.property.value === 'string' || typeof node.property.value === 'number')
  ) {
    return String(node.property.value);
  }
  return '';
}

function getLeftWriteTarget(left) {
  if (!left || typeof left !== 'object') return null;
  if (left.type === 'Identifier') {
    return { name: left.name, property: '' };
  }
  if (left.type === 'MemberExpression') {
    const prop = getMemberPropertyName(left);
    if (!prop) return null;

    const obj = left.object;
    if (obj && obj.type === 'Identifier') {
      if (obj.name === 'window' || obj.name === 'globalThis' || obj.name === 'self') {
        return { name: prop, property: '' };
      }
      return { name: obj.name, property: prop };
    }
  }
  return null;
}

function hasTargetWrite(ast, targetNames) {
  let found = false;
  walkAst(ast, (node) => {
    if (found) return;
    if (node.type === 'VariableDeclarator' && node.id && node.id.type === 'Identifier') {
      if (targetNames.has(node.id.name)) {
        found = true;
      }
      return;
    }
    if (node.type === 'AssignmentExpression') {
      const left = getLeftWriteTarget(node.left);
      if (left && targetNames.has(left.name)) {
        found = true;
      }
    }
  });
  return found;
}

function collectTargetAssignments(ast, code, targetNames) {
  const out = [];
  walkAst(ast, (node) => {
    if (node.type === 'VariableDeclarator') {
      const id = node.id;
      const init = node.init;
      if (!id || id.type !== 'Identifier' || !init || !Array.isArray(init.range)) return;
      if (!targetNames.has(id.name)) return;
      out.push({
        name: id.name,
        property: '',
        expr: code.slice(init.range[0], init.range[1]),
      });
      return;
    }

    if (node.type === 'AssignmentExpression') {
      const left = getLeftWriteTarget(node.left);
      if (!left || !targetNames.has(left.name) || !node.right || !Array.isArray(node.right.range)) {
        return;
      }
      out.push({
        name: left.name,
        property: left.property,
        expr: code.slice(node.right.range[0], node.right.range[1]),
      });
    }
  });
  return out;
}

function readValueFromContext(context, name) {
  if (!context || !name) return undefined;
  if (Object.prototype.hasOwnProperty.call(context, name) && context[name] !== undefined) {
    return context[name];
  }
  if (context.window && context.window[name] !== undefined) {
    return context.window[name];
  }
  if (context.globalThis && context.globalThis[name] !== undefined) {
    return context.globalThis[name];
  }
  return undefined;
}

function evalExpression(expr, context, timeoutMs) {
  if (!expr) return { ok: false, value: undefined };
  try {
    const value = vm.runInContext(`(${expr})`, context, {
      timeout: timeoutMs,
    });
    return { ok: true, value };
  } catch (_) {}

  try {
    const value = vm.runInContext(expr, context, {
      timeout: timeoutMs,
    });
    return { ok: true, value };
  } catch (_) {}

  return { ok: false, value: undefined };
}

function sanitizeValue(value) {
  if (value === undefined) return undefined;
  if (typeof value === 'function') return undefined;
  if (typeof value === 'symbol') return undefined;
  return value;
}

function extractVariablesFromHtml(html, variableNames, options) {
  const names = (Array.isArray(variableNames) ? variableNames : [])
    .map((x) => String(x || '').trim())
    .filter(Boolean);
  const targetNames = new Set(names);
  const timeoutMs = Math.max(20, Number(options && options.timeoutMs) || 120);
  const scripts = extractInlineScripts(html);
  const context = vm.createContext(buildSandbox((options && options.patch) || {}));

  const values = {};
  const assignments = [];
  const errors = [];

  const syncValues = () => {
    for (const name of names) {
      const got = sanitizeValue(readValueFromContext(context, name));
      if (got !== undefined) {
        values[name] = got;
      }
    }
  };

  for (let i = 0; i < scripts.length; i += 1) {
    const code = scripts[i];
    const ast = parseScriptAst(code);
    if (ast) {
      assignments.push(...collectTargetAssignments(ast, code, targetNames));
    }

    const shouldRun = !ast || hasTargetWrite(ast, targetNames);
    if (!shouldRun) continue;

    try {
      vm.runInContext(code, context, {
        timeout: timeoutMs,
        filename: `ast_env_${i}.js`,
      });
      syncValues();
    } catch (e) {
      errors.push(String((e && e.message) || e));
    }
  }

  for (const one of assignments) {
    if (!one || !one.name || !one.expr) continue;
    const already = values[one.name];
    if (already !== undefined && !one.property) continue;

    const evaluated = evalExpression(one.expr, context, timeoutMs);
    if (!evaluated.ok) continue;
    if (!one.property) {
      if (evaluated.value !== undefined) {
        context[one.name] = evaluated.value;
      }
      continue;
    }

    const base = readValueFromContext(context, one.name);
    if (!base || typeof base !== 'object') {
      context[one.name] = {};
    }
    if (context[one.name] && typeof context[one.name] === 'object') {
      context[one.name][one.property] = evaluated.value;
    }
  }

  syncValues();

  const foundNames = names.filter((name) => values[name] !== undefined);
  const missingNames = names.filter((name) => values[name] === undefined);

  return {
    values,
    foundNames,
    missingNames,
    errors,
  };
}

function extractSingleVariableFromHtml(html, variableName, options) {
  const key = String(variableName || '').trim();
  if (!key) return undefined;
  const out = extractVariablesFromHtml(html, [key], options);
  return out.values[key];
}

function stringifyObjectLiteral(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return null;
    if (s.startsWith('{') || s.startsWith('[')) return s;
    return JSON.stringify(value);
  }
  if (typeof value !== 'object' && typeof value !== 'number' && typeof value !== 'boolean') {
    return null;
  }

  const seen = new WeakSet();
  try {
    return JSON.stringify(value, (key, val) => {
      if (typeof val === 'function' || typeof val === 'symbol') return undefined;
      if (val && typeof val === 'object') {
        if (seen.has(val)) return undefined;
        seen.add(val);
      }
      return val;
    });
  } catch (_) {
    return null;
  }
}

module.exports = {
  extractVariablesFromHtml,
  extractSingleVariableFromHtml,
  stringifyObjectLiteral,
};

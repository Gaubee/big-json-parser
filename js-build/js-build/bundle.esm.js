var __toBinary = false ? (base64) => new Uint8Array(Buffer.from(base64, "base64")) : /* @__PURE__ */ (() => {
  var table = new Uint8Array(128);
  for (var i = 0; i < 64; i++)
    table[i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i * 4 - 205] = i;
  return (base64) => {
    var n = base64.length, bytes = new Uint8Array((n - (base64[n - 1] == "=") - (base64[n - 2] == "=")) * 3 / 4 | 0);
    for (var i2 = 0, j = 0; i2 < n; ) {
      var c0 = table[base64.charCodeAt(i2++)], c1 = table[base64.charCodeAt(i2++)];
      var c2 = table[base64.charCodeAt(i2++)], c3 = table[base64.charCodeAt(i2++)];
      bytes[j++] = c0 << 2 | c1 >> 4;
      bytes[j++] = c1 << 4 | c2 >> 2;
      bytes[j++] = c2 << 6 | c3;
    }
    return bytes;
  };
})();

// wasm-binary:D:\dev\tmp\big-json-parser\js-build\wasm\main.wasm

// wasm-stub:D:\dev\tmp\big-json-parser\js-build\wasm\main.wasm
var main_default2 = (imports) => WebAssembly.instantiate(main_default, imports);

// ts-src/index.ts
var GO_PKG_NAME = "gaubee.com/json-stream-reader";
function JsonStreamParserFactory(go) {
  const JSR = go.constructor[GO_PKG_NAME];
  if (JSR === void 0) {
    throw new TypeError(`no found go pkg "${GO_PKG_NAME}"`);
  }
  class JsonStreamParser {
    constructor(data) {
      this._totalLength = 0;
      this._id = JSR.createJsonStream(data);
    }
    get totalLength() {
      return this._totalLength;
    }
    get walkLength() {
      return this._walkLength ??= JSR.getJsonStreamWalkedLength(this._id);
    }
    write(data) {
      this._totalLength = JSR.writeJsonStream(this._id, data);
    }
    read(op) {
      this._walkLength = void 0;
      return JSR.walkJsonStream(this._id, op);
    }
  }
  JsonStreamParser.WALK_OP = JSR.JsonStreamWalkOperator;
  JsonStreamParser.DELIM = JSR.JsonStreamDelimEnum;
  JsonStreamParser.PAUSE_SIGN = JSR.JsonStreamPauseSignEnum;
  return JsonStreamParser;
}

// ts-src/bundle.ts
async function JsonStreamParserBuilder() {
  const go = new Go();
  const result = await main_default2(go.importObject);
  go.run(result.instance).then(() => WebAssembly.instantiate(result.module, go.importObject));
  const checkModuleReady = () => typeof Go["gaubee.com/json-stream-reader"] !== "undefined";
  do {
    if (checkModuleReady()) {
      break;
    }
    await new Promise((cb) => setTimeout(cb, 1));
  } while (true);
  return JsonStreamParserFactory(go);
}
export {
  JsonStreamParserBuilder
};

import { createHotContext as $w_h$ } from '/_wmr.js'; $w_h$(import.meta.url);
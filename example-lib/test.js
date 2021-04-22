//@ts-check
import { JsonStreamParserFactory } from "../js-build/esm/index.js";

export async function doTest(go) {
  const JsonStreamParser = JsonStreamParserFactory(go);
  const tests = { test1, test2 };
  for (const test in tests) {
    console.group(test);
    try {
      await tests[test](JsonStreamParser);
      console.log("%ctest done", "color:green");
    } catch (err) {
      console.error("%cend test", "color:read", err);
    }
    console.groupEnd();
  }
}

/**
 *
 * @param {JsonStream.ParserCtor} JsonStreamParser
 */
function test1(JsonStreamParser) {
  const jsp = new JsonStreamParser(`{"a1":1,"a2":[3,{"b":1.1}],"a3"`);
  jsp.write(`:4,"done":true}`);
  console.log(jsp.readObject());
}
const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 *
 * @param {JsonStream.ParserCtor} JsonStreamParser
 */
function test2(JsonStreamParser) {
  const jsp = new JsonStreamParser(`[{"a":1},{"b":2},{"c":[3]},`);
  {
    const readed = jsp.readSymbol();
    console.assert(
      readed === JsonStreamParser.DELIM.ARRAY_OPEN,
      "array-open-symbol",
      readed
    );
  }
  {
    const readed = jsp.readObject();
    console.assert(deepEqual(readed, { a: 1 }), "read json-item a", readed);
  }
  {
    const readed = jsp.readObject();
    console.assert(deepEqual(readed, { b: 2 }), "read json-item b", readed);
  }
  {
    const readed = jsp.readObject();
    console.assert(deepEqual(readed, { c: [3] }), "read json-item c", readed);
  }
  {
    const readed = jsp.readObject();
    console.assert(
      readed === JsonStreamParser.PAUSE_SIGN.NEED_WRITE,
      `eof by symbol ',' , need write data.`,
      readed
    );
  }
  {
    jsp.write(`{"x":false}`);
    const readed = jsp.readObject();
    console.assert(deepEqual(readed, { x: false }), "read json-item x", readed); //@todo add HAS_ITEM sign
  }
  {
    const readed = jsp.readObject();
    console.assert(
      readed === JsonStreamParser.PAUSE_SIGN.WRITE_OR_CLOSE,
      `readed x, with array-end-symbol, or push more data.`,
      readed
    );
  }
  jsp.write(`]`);
  {
    const readed = jsp.readObject();
    console.assert(
      readed === JsonStreamParser.PAUSE_SIGN.NEED_CLOSE,
      `got array-end-symbol, no more item, should be close.`,
      readed
    );
  }
  {
    const readed = jsp.readSymbol();
    console.assert(
      readed === JsonStreamParser.DELIM.ARRAY_CLOSE,
      "array-close-symbol",
      readed
    );
  }
}

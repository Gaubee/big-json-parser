import load from "../js-build/wasm/json-stream.wasm";
// import "../example-lib/wasm_exec";
import { JsonStreamParserFactory } from "./index";
export async function JsonStreamParserBuilder() {
  const go = new Go();
  const result = await load(go.importObject);
  /// 开始运行，并挂载释放的回调
  go.run(result.instance).then(
    // reset instance
    () => WebAssembly.instantiate(result.module, go.importObject)
  );
  const checkModuleReady = () =>
    typeof Go["gaubee.com/json-stream-reader"] !== "undefined";

  do {
    if (checkModuleReady()) {
      break;
    }
    await new Promise((cb) => setTimeout(cb, 1));
  } while (true);
  return JsonStreamParserFactory(go);
}

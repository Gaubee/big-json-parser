importScripts("./wasm_exec.js");

if (!WebAssembly.instantiateStreaming) {
  // polyfill
  WebAssembly.instantiateStreaming = async (resp, importObject) => {
    const source = await (await resp).arrayBuffer();
    return await WebAssembly.instantiate(source, importObject);
  };
}

const go = new Go();
let mod, inst;
WebAssembly.instantiateStreaming(
  fetch("/js-build/wasm/main.wasm"),
  go.importObject
)
  .then((result) => {
    mod = result.module;
    inst = result.instance;
    self.postMessage("ready");
  })
  .catch((err) => {
    console.error(err);
  });

async function run() {
  console.clear();
  await go.run(inst);
  inst = await WebAssembly.instantiate(mod, go.importObject); // reset instance
}

onmessage = (e) => {
  if (e.data === "run") {
    run();
  }
};

async function readData() {
  try {
    const dataRes = await fetch("http://localhost:8301/data.json");
    const reader = dataRes.body.getReader();
    do {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      console.log(value);
    } while (true);
  } catch (err) {
    console.warn("???", err);
  }
}

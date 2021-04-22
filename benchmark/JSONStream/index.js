// @ts-check
const fetch = require("node-fetch");
const JSONStream = require("JSONStream");

async function bigParse() {
  const endHeight = 200000;
  const startTime = Date.now();
  await fetch(`http://localhost:8301/cp.json?s=1&e=${endHeight}`).then((res) =>
    res.json()
  );
  const endTime = Date.now();
  console.log(`总消耗时间: ${((endTime - startTime) / 1000).toFixed(4)}s`);
}
// bigParse();

async function streamParse() {
  const endHeight = 200000;
  const startTime = Date.now();
  const streamParser = JSONStream.parse("blocks.*");
  (async () => {
    const res = await fetch(`http://localhost:8301/cp.json?s=1&e=${endHeight}`);
    for await (const chunk of res.body) {
      streamParser.write(chunk);
    }
    streamParser.end();
  })();
  streamParser.on("data", (block) => {
    if (block.height % 10000 === 0) {
      console.log(
        `block: ${block.height} ${(
          (Date.now() - startTime) /
          block.height
        ).toFixed(4)}ms/block`
      );
    }
  });
  await new Promise((resolve) => {
    streamParser.on("end", resolve);
  });
  const endTime = Date.now();
  console.log(`总消耗时间: ${((endTime - startTime) / 1000).toFixed(4)}s`);
}
streamParse();

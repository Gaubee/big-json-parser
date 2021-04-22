//@ts-check
const http = require("http");
const sleep = (ms) => new Promise((cb) => setTimeout(cb, ms));

function* genJson(startHeight, endHeight) {
  yield `{
    "version":1,
    "startHeight":${startHeight},"endHeight":${endHeight},
    "blocks": [`;
  for (let height = startHeight; height <= endHeight; ++height) {
    yield `{"_id":"5f34f4811e21e214dc6b718d","version":1,"height":${height},"blockSize":1045,"generatorPublicKey":"fb88a09e5fd84d4b019461cfa12cf22a41e11342538658f44119faa5648b759a","generatorSecondPublicKey":null,"generatorEquity":"0","numberOfTransactions":1,"payloadHash":"d9ddbfd68aab9a225fd9da4faa4aa558af4fa3930eaa940d0390220fd0d4296f","payloadLength":409,"previousBlockSignature":"db011bcb4b962a485b2d03081a4e2b27dc6624e8caf6f6816049bf47d3a6b19435884ddea12c456c9fb6a0ff6466282479ff767df15718b476e21b49c64f3405","timestamp":256,"totalAmount":"1696697008111515","totalFee":"200","reward":"0","magic":"SEVEJ","remark":{"info":"","debug":"BFT_win32_v3.5.33_P10_DP1_P4992_T35_C1_A35.00 UNTRS_B0_E1_TIME0 LOST 0"},"asset":{},"statisticInfo":{"totalFee":"200","totalAsset":"1696697008111515","totalChainAsset":"1696697008111515","totalAccount":2,"assetStatisticHashMap":{"0":{"magic":"SEVEJ","assetType":"BFT","index":0,"typeStatisticHashMap":{"AST-01":{"changeCount":3,"transactionCount":1,"changeAmount":"3393394016222830","moveAmount":"1696697008111515"}},"total":{"changeAmount":"3393394016222830","changeCount":3,"moveAmount":"1696697008111515","transactionCount":1}}}},"roundOfflineGeneratersHashMap":{},"blockParticipation":"8483485040557575001","signature":"cab6a96ac55daf28ae608ba7722fc8aae2e183acef4ab5e18af301d87a7c27d61f52f2dd1986d8db1b47d899854319dfb91df6934d2fd25e73a08f3e23bfc502","signSignature":null,"dateCreated":1597305985001.1143}${
      height === endHeight ? "\n]\n" : ",\n"
    }`;
  }

  yield "}";
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  console.log(req.url, url);
  const startHeight = parseInt(url.searchParams.get("s")) || 1;
  const endHeight = parseInt(url.searchParams.get("e")) || startHeight;
  const pauseMs = parseInt(url.searchParams.get("p")) || 0;
  res.setHeader("Access-Control-Allow-Origin", "*");
  //   res.setHeader("Transfer-Encoding", "chunked");

  {
    for (const chunk of genJson(startHeight, endHeight /* 157263 */)) {
      pauseMs && (await sleep(pauseMs));
      res.write(chunk);
    }
    res.end();
  }
  {
    // res.write("{\n");
    // for (let i = 0; i < 100; i++) {
    //   res.write(`"a${i}":${i},\n`);
    //   await sleep(100);
    // }
    // res.write(`"end":true\n}`);
    // res.end();
  }
});
server.listen(8301);

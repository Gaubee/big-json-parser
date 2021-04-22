var request = require("request"),
  JSONStream = require("JSONStream"),
  es = require("event-stream");
debugger;
const startTime = Date.now();
request({ url: "http://localhost:8301/cp.json" })
  .pipe(JSONStream.parse("blocks.*"))
  .pipe(
    es.mapSync(function (data) {
      if (data.height % 100 === 0) {
        console.log(
          `block: ${data.height} ${(
            (Date.now() - startTime) /
            data.height
          ).toFixed(4)}ms/block`
        );
      }
      //   console.clear();
      return data;
    })
  );

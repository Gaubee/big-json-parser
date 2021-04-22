//@ts-check
import { JsonStreamParserFactory } from "../js-build/esm/index.js";

class PromiseOut {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
/**
 * @type {any}
 */
const globalNsp = self;

globalNsp.stopper = undefined;
globalNsp.stopCp = () => {
  if (!globalNsp.stopper) {
    globalNsp.stopper = new PromiseOut();
  }
};
globalNsp.remuseCp = () => {
  if (globalNsp.stopper) {
    globalNsp.stopper.resolve();
    globalNsp.stopper = undefined;
  }
};
globalNsp.PromiseOut = PromiseOut;

function getEleTxt(id) {
  const ele = document.getElementById(id);
  const eleTxt = document.createTextNode("");
  ele.appendChild(eleTxt);
  return eleTxt;
}
/**
 *
 * @param {GoWasm.Go} go
 */
export async function readCp(go) {
  globalNsp.go = go;
  const JsonStreamParser = JsonStreamParserFactory(go);
  const jsp = new JsonStreamParser();
  const startTime = performance.now();

  /**
   * 等待数据量下载下来写入
   * @type {PromiseOut|undefined}
   */
  let fetchWaiter; // = new PromiseOut();
  /**
   * 等待数据解析完成
   * @type {PromiseOut|undefined}
   */
  let walkWaiter; // = new PromiseOut();
  /// 持续读取数据流
  (async () => {
    /**
     *
     * type BigData struct {
     * 	version     int
     * 	startHeight int
     * 	endHeight   int
     * 	blocks      []BigDataBlock
     * }
     * type BigDataBlock struct {
     * 	version            int
     * 	height             int
     * 	blockSize          int
     * 	generatorPublicKey string
     * 	signature          string
     * }
     * type BigDataAccount struct {
     * 	address   string
     * 	publicKey string
     * }
     *
     * type TestData struct {
     * 	a1   int
     * 	a2   int
     * 	a3   int
     * 	done bool
     * }
     */
    const res = await fetch("http://localhost:8301/cp.json");
    const jsonReader = res.body.getReader();
    const eleTxt = getEleTxt("dl-process");
    do {
      const chunk = await jsonReader.read();
      if (chunk.done) {
        break;
      }

      jsp.write(chunk.value);
      const { totalLength, walkLength } = jsp;
      eleTxt.textContent = `check size:${
        chunk.value.length
      }, totalSize: ${totalLength}, walkedSize: ${walkLength}; speed:${(
        walkLength /
        1024 /
        ((performance.now() - startTime) / 1000)
      ).toFixed(4)}kb/s`;
      //   console.log(
      //     "write data",
      //     chunk.value.length,
      //     jsp.totalLength,
      //     jsp.walkLength
      //   );

      /// 释放锁与等待锁
      if (fetchWaiter) {
        fetchWaiter.resolve();
      }
      walkWaiter = new PromiseOut();
      await walkWaiter.promise;
    } while (true);
  })();

  /// 持续解析数据
  /**
   * 状态机
   * -1 = 结束
   * 0 = 还没开始
   * 1 = 在解析头部的key
   * 2 = 在解析头部的value
   *
   * 3 = 获取到blocks这个头了
   * 4 = 在解析blocks
   * 5 = blocks结束了
   *
   * 6 = 获取到accounts这个头了
   * 7 = 在解析accounts
   * 8 = accounts结束了
   */
  let status = 0;
  const isPauseSigns = (sign) => {
    return (
      sign === JsonStreamParser.PAUSE_SIGN.WRITE_OR_CLOSE ||
      sign === JsonStreamParser.PAUSE_SIGN.NEED_CLOSE ||
      sign === JsonStreamParser.PAUSE_SIGN.NEED_WRITE
    );
  };
  const read = (op) => {
    const res =
      op === 1
        ? jsp.readSymbol()
        : op === 2
        ? jsp.readObject()
        : op === 3
        ? jsp.readArray()
        : undefined;
    if (isPauseSigns(res)) {
      throw res;
    }
    return res;
  };
  const eleTxt = getEleTxt("cp-process");
  let count = 0;

  do {
    try {
      switch (status) {
        case -1: {
          console.log("finish:", read(1));
          throw new Error(
            (eleTxt.textContent = `完成解析,用时:${
              (performance.now() - startTime) / 1000
            }s`)
          );
          break;
        }
        case 0: {
          console.log("start:", read(1));
          status = 1;
          break;
        }
        case 1: {
          const field = read(1);
          console.log("field:", field);
          if (field === "blocks") {
            status = 3;
          } else if (field === "accounts") {
            status = 6;
          } else {
            status = 2;
          }
          break;
        }
        case 2: {
          const value = read(1);
          console.log("value:", value);
          status = 1;
          break;
        }
        case 3: {
          console.log("blockStart:", read(1));
          status = 4;
          break;
        }
        case 4: {
          /**
           * @type {any}
           */
          read(2);
          const block = { height: ++count };
          if (block.height % 100 === 0) {
            eleTxt.nodeValue = `block:${block.height} ${(
              (performance.now() - startTime) /
              block.height
            ).toFixed(4)}ms/block`;
          }
          break;
        }
        case 5: {
          console.log("finish block:", read(1));
          status = 1;
          break;
        }
        case 6: {
          console.log("accountStart:", read(1));
          status = 7;
          break;
        }
        case 7: {
          /**
           * @type {any}
           */
          const account = read(2);
          eleTxt.nodeValue = `account:${account.address} ${(
            (performance.now() - startTime) /
            ++count
          ).toFixed(4)}ms`;
          break;
        }
        case 8: {
          console.log("finish account:", read(1));
          status = -1;
          break;
        }
        default:
          throw new TypeError();
      }
    } catch (err) {
      if (isPauseSigns(err)) {
        if (err === JsonStreamParser.PAUSE_SIGN.NEED_CLOSE) {
          if (status === 4) {
            status = 5;
            continue;
          } else if (status == 7) {
            status = 8;
          }
        } else {
          if (walkWaiter) {
            walkWaiter.resolve();
          }
          fetchWaiter = new PromiseOut();
          await fetchWaiter.promise;
        }
      } else {
        throw err;
      }
    }
    if (globalNsp.stopper) {
      await globalNsp.stopper.promise;
    }
  } while (true);
}

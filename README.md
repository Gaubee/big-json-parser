这是一个学习项目。
尝试使用 go 来编写一个基于 wasm 的 json-stream 。并对比热门高性能 nodejs 的实现。

因为目前 wasm 的特性，是很难超越高性能 js 的实现。
所以该项目的目的是研究 go-wasm，将性能尽可能逼近 pure-js。

## TIP

1. 这个项目对 golang 源码进行了一些改动，一部分是改进不成熟的 wasm 相关的实现。还有一部分是对官方 encoding/json 的改动

   > 项目地址： https://github.com/Gaubee/go
   > commit:736a02826389faf431dba2cab47b64f8fef307bc

   1. encoding/json 是官方提供的流处理 json 的实现，出了名的性能差，但至少能用。要对其进行改动是因为 wasm 目前不完全支持 sync，所以对于数据流中的暂停没有支持，因此只能做一些魔改
   2. wasm 相关的改动主要是两部分：性能提升与自定义异常抛出。
      1. go-wasm 中直接抛出异常是直接结束整个 GoRuntime，所以我定义了一个 jsRuntimeError，来模拟 js-throw 的特性。
      1. 性能方面，主要是在 Bytes 转 Utf8 的实现。TextDecoder 很快，但在处理少量数据时（大概少于 200），会比 pure-js 实现来得慢，猜测是 js 与 native 之间的转换成本。毕竟每一次调用 native 都有一个基础的调用成本，

2. 项目用到了 typescript 来编写 js 部分的工作。
3. 用 esbuild 来将 js 与 wasm 两部分的文件进行组合打包
4. 用 wmr 来提供文件服务（可以实时处理 typescript-esm 的输出）
5. jsonreader.js 这个文件是 nodejs 程序，提供一个动态的 json 数据包。数据包模拟了区块链数据。
   > http://localhost:8301/?s=10&e=20
   1. **s** 为 startHeigth
   1. **e** 为 endHeigth

## Benchmark

解析 200_0000 条数据：下载数据+解析数据

1. 直接使用 fetch.response.json() 来作为最基准的性能
   1. 浏览器~= 6.1560s
   1. nodejs~= 2.5330s
1. 使用流处理的模式来解析数据
   1. browser/wasm/go-json-stream ~= 23.3318s
   1. nodejs/js/JSONStream ~= 8.3680s

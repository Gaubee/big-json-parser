const { performance } = require("perf_hooks");
class TextDecoderJs {
  decode(octets) {
    let string = "";
    let i = 0;
    while (i < octets.length) {
      let octet = octets[i];
      let bytesNeeded = 0;
      let codePoint = 0;
      if (octet <= 0x7f) {
        bytesNeeded = 0;
        codePoint = octet & 0xff;
      } else if (octet <= 0xdf) {
        bytesNeeded = 1;
        codePoint = octet & 0x1f;
      } else if (octet <= 0xef) {
        bytesNeeded = 2;
        codePoint = octet & 0x0f;
      } else if (octet <= 0xf4) {
        bytesNeeded = 3;
        codePoint = octet & 0x07;
      }
      if (octets.length - i - bytesNeeded > 0) {
        let k = 0;
        while (k < bytesNeeded) {
          octet = octets[i + k + 1];
          codePoint = (codePoint << 6) | (octet & 0x3f);
          k += 1;
        }
      } else {
        codePoint = 0xfffd;
        bytesNeeded = octets.length - i;
      }
      string += String.fromCodePoint(codePoint);
      i += bytesNeeded + 1;
    }
    return string;
  }
}
const decode = (octets, start, end) => {
  let string = "";
  let octet = 0;
  let bytesNeeded = 0;
  let codePoint = 0;
  // const end = octets.length;
  for (let i = start; i < end; ) {
    octet = octets[i];
    bytesNeeded = 0;
    codePoint = 0;
    if (octet <= 0x7f) {
      bytesNeeded = 0;
      codePoint = octet & 0xff;
    } else if (octet <= 0xdf) {
      bytesNeeded = 1;
      codePoint = octet & 0x1f;
    } else if (octet <= 0xef) {
      bytesNeeded = 2;
      codePoint = octet & 0x0f;
    } else if (octet <= 0xf4) {
      bytesNeeded = 3;
      codePoint = octet & 0x07;
    }
    if (octets.length - i - bytesNeeded > 0) {
      let k = 0;
      while (k < bytesNeeded) {
        octet = octets[i + k + 1];
        codePoint = (codePoint << 6) | (octet & 0x3f);
        k += 1;
      }
    } else {
      codePoint = 0xfffd;
      bytesNeeded = octets.length - i;
    }
    string += String.fromCodePoint(codePoint);
    i += bytesNeeded + 1;
  }
  return string;
};
const decode2 = (octets, start, end) => {
  let string = "";
  let octet = 0;
  let codePoint = 0;
  const lastOffset1 = end - 1;
  const lastOffset2 = end - 2;
  const lastOffset3 = end - 3;
  for (let i = start; i < end; ++i) {
    octet = octets[i];
    codePoint = 0;
    if (octet <= 0x7f) {
      codePoint = octet & 0xff;
    } else if (octet <= 0xdf) {
      if (lastOffset1 - i > 0) {
        codePoint = ((octet & 0x1f) << 6) | (octets[++i] & 0x3f);
      } else {
        codePoint = 0xfffd;
        i = end;
      }
    } else if (octet <= 0xef) {
      if (lastOffset2 - i > 0) {
        codePoint =
          ((octet & 0x0f) << 12) |
          ((octets[++i] & 0x3f) << 6) |
          (octets[++i] & 0x3f);
      } else {
        codePoint = 0xfffd;
        i = end;
      }
    } else if (octet <= 0xf4) {
      if (lastOffset3 - i > 0) {
        codePoint =
          ((octet & 0x07) << 18) |
          ((octets[++i] & 0x3f) << 12) |
          ((octets[++i] & 0x3f) << 6) |
          octets[++i];
      } else {
        codePoint = 0xfffd;
        i = end;
      }
    }

    string += String.fromCodePoint(codePoint);
  }
  return string;
};
// const codepointCacheLen = 255;

// const codepointCache = Function(
//   "p",
//   `let res;
//   switch(p) {
//     ${Array.from(
//       { length: codepointCacheLen },
//       (_, codePoint) =>
//         `case ${codePoint}: res = "\\u${("000" + codePoint).slice(-4)}";break;`
//     ).join("\n")}
//   };
//   return res;`
// );

// const codepointCache = Function("p", `return 'h'`);

const TIME = (10000 / 2) * 100;

const decoder = new TextDecoder();
const jsDecoder = new TextDecoderJs();
const encoder = new TextEncoder();
const txtString = Array.from({ length: 200 }, (_, i) =>
  String.fromCodePoint(i+1000)
).join("");
const txtBytes = encoder.encode(txtString);
let TEST_ID = 0;
let res;
{
  const s = performance.now();
  for (let i = 0; i < TIME; i++) {
    res = decoder.decode(
      new Uint8Array(txtBytes.buffer, txtBytes.byteOffset, txtBytes.byteLength)
    );
  }
  console.log(++TEST_ID, performance.now() - s, res === txtString);
}
{
  const s = performance.now();
  for (let i = 0; i < TIME; i++) {
    res = jsDecoder.decode(
      new Uint8Array(txtBytes.buffer, txtBytes.byteOffset, txtBytes.byteLength)
    );
  }
  console.log(++TEST_ID, performance.now() - s, res === txtString);
}
const TIME2 = TIME;
{
  const s = performance.now();
  for (let i = 0; i < TIME2; i++) {
    res = decode(
      txtBytes,
      txtBytes.byteOffset,
      txtBytes.byteOffset + txtBytes.byteLength
    );
  }
  console.log(++TEST_ID, performance.now() - s, res === txtString);
}
{
  const s = performance.now();
  for (let i = 0; i < TIME2; i++) {
    res = decode2(
      txtBytes,
      txtBytes.byteOffset,
      txtBytes.byteOffset + txtBytes.byteLength
    );
  }
  console.log(++TEST_ID, performance.now() - s, res === txtString);
}
{
  const s = performance.now();
  for (let i = 0; i < TIME2; i++) {
    res = decode(
      txtBytes,
      txtBytes.byteOffset,
      txtBytes.byteOffset + txtBytes.byteLength
    );
  }
  console.log(++TEST_ID, performance.now() - s, res === txtString);
}
{
  const s = performance.now();
  for (let i = 0; i < TIME2; i++) {
    res = decode2(
      txtBytes,
      txtBytes.byteOffset,
      txtBytes.byteOffset + txtBytes.byteLength
    );
  }
  console.log(++TEST_ID, performance.now() - s, res === txtString);
}

// {
//   const s = performance.now();
//   for (let i = 0; i < TIME; i++) {
//     res = decoder.decode(
//       new DataView(txt.buffer, txt.byteOffset, txt.byteLength)
//     );
//   }
//   console.log(++TEST_ID, performance.now() - s, res === txtString);
// }

// {
//   const s = performance.now();
//   for (let i = 0; i < TIME; i++) {
//     res = decoder.decode(
//       txt.buffer.slice(txt.byteOffset, txt.byteOffset + txt.byteLength)
//     );
//   }
//   console.log(++TEST_ID, performance.now() - s, res === txtString);
// }

// {
//   const s = performance.now();
//   for (let i = 0; i < TIME; i++) {
//     res = Buffer.from(txt).toString("utf8");
//   }
//   console.log(++TEST_ID, performance.now() - s, res === txtString);
// }

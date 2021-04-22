import "./@types";
import "./@go";

export const GO_PKG_NAME = "gaubee.com/json-stream-reader";
export function JsonStreamParserFactory(go: GoWasm.Go) {
  const JSR = go.constructor[GO_PKG_NAME];
  if (JSR === undefined) {
    throw new TypeError(`no found go pkg "${GO_PKG_NAME}"`);
  }
  class JsonStreamParser implements JsonStream.Parser {
    //#region 常量
    static readonly WALK_OP = JSR.JsonStreamWalkOperator;
    static readonly DELIM = JSR.JsonStreamDelimEnum;
    static readonly PAUSE_SIGN = JSR.JsonStreamPauseSignEnum;
    //#endregion

    private _id: number;
    private _totalLength = 0;
    constructor(data?: string) {
      this._id = JSR.create(data);
    }
    get totalLength() {
      return this._totalLength;
    }
    private _walkLength?: number;
    get walkLength() {
      return (this._walkLength ??= JSR.walkedLength(this._id));
    }
    write(data: GoWasm.GaubeeCom_JsonStreamReader.Chunk) {
      this._totalLength = JSR.write(this._id, data, data.length);
    }
    read(op: GoWasm.GaubeeCom_JsonStreamReader.JsonStreamWalkOperator) {
      this._walkLength = undefined;
      return JSR.walk(this._id, op) as ReturnType<JsonStream.Parser["read"]>;
    }
    readSymbol() {
      return this.read(1) as ReturnType<JsonStream.Parser["readSymbol"]>;
    }
    readObject() {
      return this.read(2) as ReturnType<JsonStream.Parser["readObject"]>;
    }
    readArray() {
      return this.read(3) as ReturnType<JsonStream.Parser["readArray"]>;
    }
  }
  return JsonStreamParser as JsonStream.ParserCtor;
}

declare namespace GoWasm {
    interface GoConstructor {
        "gaubee.com/json-stream-reader": GaubeeCom_JsonStreamReader;
    }
    interface GaubeeCom_JsonStreamReader {
        JsonStreamDelimEnum: GaubeeCom_JsonStreamReader.JsonStreamDelimEnum;
        JsonStreamPauseSignEnum: GaubeeCom_JsonStreamReader.JsonStreamPauseSignEnum;
        JsonStreamWalkOperator: typeof GaubeeCom_JsonStreamReader.JsonStreamWalkOperator;
        create(data?: GaubeeCom_JsonStreamReader.Chunk): number;
        close(id: number): void;
        write(id: number, chunk: GaubeeCom_JsonStreamReader.Chunk, len: number): number;
        walk(id: number, op: GaubeeCom_JsonStreamReader.JsonStreamWalkOperator): GaubeeCom_JsonStreamReader.JsonStreamDelimEnum | GaubeeCom_JsonStreamReader.JsonStreamPauseSignEnum | unknown;
        isEndOfStream(id: number): number;
        walkedLength(id: number): number;
    }
    namespace GaubeeCom_JsonStreamReader {
        type Chunk = string | Uint8Array;
        interface JsonStreamDelimEnum {
            readonly ARRAY_CLOSE: unique symbol;
            readonly ARRAY_OPEN: unique symbol;
            readonly OBJECT_CLOSE: unique symbol;
            readonly OBJECT_OPEN: unique symbol;
        }
        interface JsonStreamPauseSignEnum {
            readonly NEED_CLOSE: unique symbol;
            readonly NEED_WRITE: unique symbol;
            readonly WRITE_OR_CLOSE: unique symbol;
        }
        enum JsonStreamWalkOperator {
            READ_TOKEN = 1,
            READ_OBJECT = 2,
            READ_ARRAY = 3
        }
    }
}
declare namespace JsonStream {
    type DelimEnum = GoWasm.GaubeeCom_JsonStreamReader.JsonStreamDelimEnum[keyof GoWasm.GaubeeCom_JsonStreamReader.JsonStreamDelimEnum];
    type PauseSignEnum = GoWasm.GaubeeCom_JsonStreamReader.JsonStreamPauseSignEnum[keyof GoWasm.GaubeeCom_JsonStreamReader.JsonStreamPauseSignEnum];
    interface Parser {
        readonly totalLength: number;
        readonly walkLength: number;
        write(data: GoWasm.GaubeeCom_JsonStreamReader.Chunk): void;
        readSymbol(): DelimEnum | PauseSignEnum | undefined | null | string | number | boolean;
        readArray(): unknown[] | PauseSignEnum;
        readObject(): {
            [key: string]: unknown;
        } | PauseSignEnum;
        read(op: GoWasm.GaubeeCom_JsonStreamReader.JsonStreamWalkOperator): DelimEnum | PauseSignEnum | undefined | null | string | number | boolean | unknown[] | {
            [key: string]: unknown;
        };
    }
    interface ParserCtor {
        readonly DELIM: GoWasm.GaubeeCom_JsonStreamReader.JsonStreamDelimEnum;
        readonly PAUSE_SIGN: GoWasm.GaubeeCom_JsonStreamReader.JsonStreamPauseSignEnum;
        readonly WALK_OP: typeof GoWasm.GaubeeCom_JsonStreamReader.JsonStreamWalkOperator;
        new (data?: string): Parser;
        prototype: Parser;
    }
}

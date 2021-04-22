/**
 * Go is the class as defined in the Golang `wasm_exec.js` distributable file required for WebAssembly.
 * Golang WebAssembly wiki: https://github.com/golang/go/wiki/WebAssembly
 */
declare namespace GoWasm {
    interface Go {
        constructor: GoConstructor;
        argv: string[];
        env: {
            [envKey: string]: string;
        };
        exit: (code: number) => void;
        importObject: WebAssembly.Imports;
        exited: boolean;
        mem: DataView;
        run(instance: WebAssembly.Instance): Promise<void>;
    }
    interface GoConstructor {
        new (): Go;
        prototype: Go;
        RuntimeError: GoRuntimeError;
    }
    interface GoRuntimeError extends Error {
    }
}
declare const Go: GoWasm.GoConstructor;

package main

import (
	"bytes"
	"encoding/json"
	"io"
	"strconv"
	"syscall/js"
)

var jsGlobal = js.Global()

func main() {

	GoNamespace := jsGlobal.Get("Go")
	jsonStreamModule := make(map[string]interface{})
	jsonStreamModule["create"] = js.FuncOf(createJsonStream)
	jsonStreamModule["write"] = js.FuncOf(writeJsonStream)
	jsonStreamModule["walk"] = js.FuncOf(walkJsonStream)
	jsonStreamModule["isEndOfStream"] = js.FuncOf(jsonStreamIsEndOfStream)
	jsonStreamModule["close"] = js.FuncOf(closeJsonStream)

	jsonStreamModule["walkedLength"] = js.FuncOf(getJsonStreamWalkedLength)

	var JsonStreamDelimEnum = make(map[string]interface{})
	JsonStreamDelimEnum["ARRAY_OPEN"] = json_Delim_1
	JsonStreamDelimEnum["ARRAY_CLOSE"] = json_Delim_2
	JsonStreamDelimEnum["OBJECT_OPEN"] = json_Delim_3
	JsonStreamDelimEnum["OBJECT_CLOSE"] = json_Delim_4
	jsonStreamModule["JsonStreamDelimEnum"] = JsonStreamDelimEnum

	var JsonStreamPauseSignEnum = make(map[string]interface{})
	JsonStreamPauseSignEnum["NEED_WRITE"] = json_PauseSign_NEED_DATA
	JsonStreamPauseSignEnum["NEED_CLOSE"] = json_PauseSign_NEED_CLOSE
	JsonStreamPauseSignEnum["WRITE_OR_CLOSE"] = json_PauseSign_MAYBE
	jsonStreamModule["JsonStreamPauseSignEnum"] = JsonStreamPauseSignEnum

	var JsonStreamWalkOperator = make(map[string]interface{})
	JsonStreamWalkOperator["READ_TOKEN"] = WALK_OP_READ_TOKEN
	JsonStreamWalkOperator["READ_ARRAY"] = WALK_OP_READ_ARRAY
	JsonStreamWalkOperator["READ_OBJECT"] = WALK_OP_READ_OBJECT
	jsonStreamModule["JsonStreamWalkOperator"] = JsonStreamWalkOperator

	GoNamespace.Set("gaubee.com/json-stream-reader", jsonStreamModule)

	// jsonStreamModule["testRuntimeError"] = js.FuncOf(testRuntimeError)

	/// 持久化服务，不要关闭这个实例
	c := make(chan struct{})
	<-c
}

type JsonDecoderMapValue struct {
	dec     *json.Decoder
	buf     *bytes.Buffer
	jsonLen int64
}

var JsonDecoderMap = make(map[int]*JsonDecoderMapValue)
var JsonDecoderMapAccId = 0

func _getJsonStream(arg js.Value) (*JsonDecoderMapValue, js.Value) {
	id := arg.Int()
	item := JsonDecoderMap[id]
	if item == nil {
		return nil, js.RuntimeError("NoFoundError: id " + strconv.Itoa(id) + " not an jsonStreamReader ptr.")
	}
	return item, js.Null()
}
func _pushData(buf *bytes.Buffer, chunkArg js.Value, lenArg js.Value) int {
	if chunkArg.Type() == js.TypeString {
		maybyStr := chunkArg.String()

		// println("arg is string:", maybyStr)
		if len(maybyStr) > 0 {
			buf.Write([]byte(maybyStr))
			return len(maybyStr)
		}
	} else if chunkArg.Type() == js.TypeObject {
		argBytes := make([]byte, lenArg.Int())
		js.CopyBytesToGo(argBytes, chunkArg)
		buf.Write(argBytes)
		return len(argBytes)
	} else {
		println("arg not an string")
	}
	return 0
}

func createJsonStream(this js.Value, args []js.Value) interface{} {
	buf := &bytes.Buffer{}
	jsonLen := 0

	if len(args) > 1 {
		jsonLen = _pushData(buf, args[0], args[1])
	}

	dec := json.NewDecoder(buf)
	id := JsonDecoderMapAccId + 1
	JsonDecoderMapAccId = id
	JsonDecoderMap[id] = &JsonDecoderMapValue{dec, buf, int64(jsonLen)}
	// sum := p[0].Int() + p[1].Int()
	return js.ValueOf(id)
}
func closeJsonStream(this js.Value, args []js.Value) interface{} {
	id := args[0].Int()
	delete(JsonDecoderMap, id)
	return nil
}

func writeJsonStream(this js.Value, args []js.Value) interface{} {
	item, runtimeErr := _getJsonStream(args[0])
	if runtimeErr.Type() != js.TypeNull {
		return runtimeErr
	}

	if len(args) > 2 {
		jsonLen := _pushData(item.buf, args[1], args[2])
		item.jsonLen += int64(jsonLen)
	}

	// 尝试重新填充数据
	if err := item.dec.Refill(); err != nil {
		return js.RuntimeError(err.Error())
	}

	return item.jsonLen
}

type Block struct {
	height int //`json:"height"`
}

var jsSymbol = jsGlobal.Get("Symbol")
var json_Delim_1 = jsSymbol.Call("for", "[")
var json_Delim_2 = jsSymbol.Call("for", "]")
var json_Delim_3 = jsSymbol.Call("for", "{")
var json_Delim_4 = jsSymbol.Call("for", "}")
var json_PauseSign_NEED_DATA = jsSymbol.Call("for", "need append json data")
var json_PauseSign_NEED_CLOSE = jsSymbol.Call("for", "need close current deep")
var json_PauseSign_MAYBE = jsSymbol.Call("for", "maybe append json data or close")

const (
	WALK_OP_READ_TOKEN  = 1
	WALK_OP_READ_OBJECT = 2
	WALK_OP_READ_ARRAY  = 3
)

func walkJsonStream(this js.Value, args []js.Value) interface{} {
	item, runErr := _getJsonStream(args[0])
	if runErr.Type() != js.TypeNull {
		return runErr
	}
	if len(args) < 2 {
		return js.RuntimeError("no found operator arg.")
	}
	if args[1].Type() != js.TypeNumber {
		return js.RuntimeError("operator type error.")
	}

	op := args[1].Int()
	if op == WALK_OP_READ_TOKEN {
		// read open bracket
		t, err := item.dec.Token()
		if err != nil {
			if err == io.EOF {
				return json_PauseSign_NEED_DATA
			}
			return js.RuntimeError(err.Error())
		}
		switch t.(type) {
		/**
		 * @todo 加入对状态机的支持，从而规避 ["[","}"] 这类的特殊情况
		 */
		case json.Delim:
			if t == json.Delim('[') {
				return json_Delim_1
			}
			if t == json.Delim(']') {
				return json_Delim_2
			}
			if t == json.Delim('{') {
				return json_Delim_3
			}
			if t == json.Delim('}') {
				return json_Delim_4
			}
		}
		return js.ValueOf(t)
	}
	if op == WALK_OP_READ_OBJECT {
		if item.dec.More() {
			var jsObj = Block{}
			err := item.dec.Decode(&jsObj)
			if err != nil {
				return json_PauseSign_NEED_DATA
			}
			return js.Null() // jsObj
		}
		if item.jsonLen > item.dec.InputOffset() {
			return json_PauseSign_NEED_CLOSE
		}
		return json_PauseSign_MAYBE
	}
	/// need close?
	if op == WALK_OP_READ_ARRAY {
		if item.dec.More() {
			jsArr := make([]interface{}, 0)
			err := item.dec.Decode(&jsArr)
			if err != nil {
				return json_PauseSign_NEED_DATA
			}
			return js.Null() // jsArr
		}
		if item.jsonLen > item.dec.InputOffset() {
			return json_PauseSign_NEED_CLOSE
		}
		return json_PauseSign_MAYBE
	}

	return js.RuntimeError("unkonw walk operator " + strconv.Itoa(op))
}
func jsonStreamIsEndOfStream(this js.Value, args []js.Value) interface{} {
	item, runErr := _getJsonStream(args[0])
	if runErr.Type() != js.TypeNull {
		return runErr
	}
	return item.dec.InputOffset() >= item.jsonLen
}

func getJsonStreamWalkedLength(this js.Value, args []js.Value) interface{} {
	item, ok := _getJsonStream(args[0])
	if ok.Type() != js.TypeNull {
		return ok
	}
	return item.dec.InputOffset()
}

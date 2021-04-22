package main

import (
	"bytes"
	"encoding/json"
	"testing"
)

func TestJsonStream(t *testing.T) {
	buf := &bytes.Buffer{}
	dec := json.NewDecoder(buf)
	buf.Write([]byte("[{\"a\":1},{\"b\":2},{\"c\":[3]},"))

	/// Array-Start
	token, err := dec.Token()
	if err != nil {
		t.Error(err)
	}
	t.Log(token)
	item := make(map[string]interface{})

	/// a:1
	if !dec.More() {
		t.Error("Should has More")
	}
	err = dec.Decode(&item)
	if err != nil {
		t.Error(err)
	}
	t.Log(item)

	/// b:2
	if !dec.More() {
		t.Error("Should has More")
	}
	err = dec.Decode(&item)
	if err != nil {
		t.Error(err)
	}
	t.Log(item)

	/// c:3
	if !dec.More() {
		t.Error("Should has More")
	}
	err = dec.Decode(&item)
	if err != nil {
		t.Error(err)
	}
	t.Log(item)

	/// ,
	if !dec.More() {
		t.Error("Should has More")
	}
	err = dec.Decode(&item)
	if err == nil {
		t.Error("Should has error")
	}

	/// x:false
	buf.Write([]byte(`{"x":false}]`))
	// dec.ResetError()
	err = dec.Decode(&item)
	if err != nil {
		t.Error(err)
	}

	/// Array-End
	if dec.More() {
		t.Error("should not has More")
	}
	token, err = dec.Token()
	if err != nil {
		t.Error(err)
	}
	t.Log(token)
}

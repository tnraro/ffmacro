import {
  autocompletion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import CodeMirror, { type ViewUpdate } from "@uiw/react-codemirror";
import { useCallback, useState } from "react";

function macroCompletion(context: CompletionContext): CompletionResult | null {
  const prefix = context.matchBefore(/(?:^\/|\b<)/);
  if (prefix == null || (prefix.from === prefix.to && !context.explicit))
    return null;
  return {
    from: prefix.from,
    options: [{ label: "/?", type: "keyword", detail: "" }],
  };
}

function App() {
  const [code, setCode] = useState("/?");
  const onChange = useCallback((value: string, viewUpdate: ViewUpdate) => {
    console.log(value, viewUpdate);
    setCode(value);
  }, []);
  return (
    <CodeMirror
      value={code}
      height="280px"
      onChange={onChange}
      basicSetup
      extensions={[autocompletion({ override: [macroCompletion] })]}
    />
  );
}

export default App;

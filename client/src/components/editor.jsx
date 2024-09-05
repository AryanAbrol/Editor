import { useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';

export default function CodeEditor({ language, code, setCode, isSuggestionVisible, suggestion }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, [language]);

  useEffect(() => {
    if (editorRef.current && isSuggestionVisible && suggestion) {
      const model = editorRef.current.getModel();
      const position = model.getPositionAt(model.getValue().length); // Place suggestion at the end

      editorRef.current.executeEdits('', [
        {
          range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
          text: suggestion,
          forceMoveMarkers: true
        }
      ]);
    }
  }, [isSuggestionVisible, suggestion]);

  return (
    <Editor
      height="75vh"
      language={language}
      value={code}
      onChange={(newValue) => setCode(newValue)}
      theme="vs-dark"
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        wrappingIndent: 'indent',
      }}
      onMount={(editor) => {
        editorRef.current = editor;
      }}
    />
  );
}
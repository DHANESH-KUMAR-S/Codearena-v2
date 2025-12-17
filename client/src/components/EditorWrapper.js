import React, { useRef, useCallback } from 'react';
import Editor from "@monaco-editor/react";

const EditorWrapper = ({ value, onChange, language, ...props }) => {
  const editorRef = useRef(null);

  const handleEditorMount = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  const handleEditorWillMount = useCallback((monaco) => {
    // Configure Monaco to be more stable
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {}
    });
  }, []);

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Editor
        value={value}
        onChange={onChange}
        language={language === 'cpp' ? 'cpp' : language}
        onMount={handleEditorMount}
        beforeMount={handleEditorWillMount}
        theme="custom-dark"
        options={{
          ...props.options,
          automaticLayout: true, // Let Monaco handle its own layout
          scrollBeyondLastLine: false,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          tabSize: 4,
          wordWrap: 'on',
          overviewRulerBorder: false,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10
          }
        }}
        {...props}
      />
    </div>
  );
};

export default EditorWrapper; 
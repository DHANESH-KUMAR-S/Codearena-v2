import React, { useEffect, useRef } from 'react';
import Editor from "@monaco-editor/react";

const EditorWrapper = ({ value, onChange, language, ...props }) => {
  const wrapperRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (editorRef.current) {
        // Debounce the layout call
        const timeoutId = setTimeout(() => {
          editorRef.current.layout();
        }, 0);
        return () => clearTimeout(timeoutId);
      }
    });

    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '400px' }}>
      <Editor
        value={value}
        onChange={onChange}
        language={language === 'cpp' ? 'cpp' : language}
        onMount={(editor) => {
          editorRef.current = editor;
        }}
        {...props}
      />
    </div>
  );
};

export default EditorWrapper; 
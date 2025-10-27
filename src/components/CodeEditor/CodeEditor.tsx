import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  language?: string;
  height?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  language = 'typescript',
  height = '400px',
  onChange,
  readOnly = false
}) => {
  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={(value) => onChange?.(value || '')}
      theme="vs-dark"
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        automaticLayout: true,
        scrollBeyondLastLine: false,
        padding: { top: 16, bottom: 16 },
        renderLineHighlight: 'none',
      }}
    />
  );
};

export default CodeEditor;
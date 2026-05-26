import { Input } from '@/components/ui';
import { useEffect, useRef } from 'react';
import AceEditor from 'react-ace';

// Dynamically import ACE editor modes as needed
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/mode-text';
import 'ace-builds/src-noconflict/mode-xml';
import 'ace-builds/src-noconflict/theme-github';

const { TextArea } = Input;

const TextEditor = ({ content, setContent, fileType }) => {
  const aceRef = useRef(null);

  // Map file extensions to ACE editor modes
  const getEditorMode = () => {
    const typeMap = {
      txt: 'text',
      html: 'html',
      json: 'json',
      md: 'markdown',
      css: 'css',
      js: 'javascript',
      xml: 'xml',
      csv: 'text',
    };

    return typeMap[fileType] || 'text';
  };

  // Resize editor to fit content when component mounts
  useEffect(() => {
    if (aceRef.current && aceRef.current.editor) {
      aceRef.current.editor.resize();
    }
  }, []);

  // For simple text files, use TextArea
  if (fileType === 'txt' || fileType === 'csv') {
    return (
      <TextArea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={20}
        placeholder="Enter document content..."
        style={{ width: '100%', fontFamily: 'monospace' }}
      />
    );
  }

  // For other file types, use ACE editor
  return (
    <AceEditor
      ref={aceRef}
      mode={getEditorMode()}
      theme="github"
      name="document-editor"
      onChange={setContent}
      value={content}
      width="100%"
      height="500px"
      fontSize={14}
      showPrintMargin={true}
      showGutter={true}
      highlightActiveLine={true}
      setOptions={{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
        showLineNumbers: true,
        tabSize: 2,
      }}
    />
  );
};

export default TextEditor;

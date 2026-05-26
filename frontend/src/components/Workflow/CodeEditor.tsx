import { Input } from '@/components/ui';

const CodeEditor = ({ value, onChange, height = '200px' }) => {
  // For a real app, consider using a library like react-codemirror or monaco-editor
  // This is a simplified version for the example

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <Input.TextArea
      value={value}
      onChange={handleChange}
      style={{
        fontFamily: 'monospace',
        fontSize: '14px',
        backgroundColor: '#f5f5f5',
        height,
      }}
      placeholder="Enter your code or expression here..."
    />
  );
};

export default CodeEditor;

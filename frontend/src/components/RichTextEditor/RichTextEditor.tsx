import React, { useState, useEffect } from 'react';
import { Card } from 'antd';

// Import these with try/catch to handle potential errors
let Editor = null;
let EditorState = null;
let RichUtils = null;
let convertToRaw = null;
let convertFromRaw = null;
let createWithContent = null;
let createEmpty = null;

try {
  const draftJs = require('draft-js');
  EditorState = draftJs.EditorState;
  RichUtils = draftJs.RichUtils;
  convertToRaw = draftJs.convertToRaw;
  convertFromRaw = draftJs.convertFromRaw;
  
  // Get the Editor component
  Editor = draftJs.Editor;
  
  // Helper methods for creating editor state
  createWithContent = (contentState) => EditorState.createWithContent(contentState);
  createEmpty = () => EditorState.createEmpty();
} catch (error) {
  console.error('Error loading Draft.js:', error);
}

const RichTextEditor = ({ value, onChange, placeholder, readOnly = false }) => {
  // Bail out early if the draft-js library couldn't be loaded
  if (!Editor || !EditorState) {
    return (
      <div className="rich-text-editor-error">
        The rich text editor could not be loaded.
      </div>
    );
  }

  const [editorState, setEditorState] = useState(() => {
    if (value) {
      try {
        // Try to parse the value as JSON
        const contentState = convertFromRaw(
          typeof value === 'string' ? JSON.parse(value) : value
        );
        return createWithContent(contentState);
      } catch (e) {
        console.error('Error parsing editor content:', e);
        return createEmpty();
      }
    }
    return createEmpty();
  });

  // Update the editor state when the value prop changes
  useEffect(() => {
    if (value && typeof value === 'string' && value !== JSON.stringify(convertToRaw(editorState.getCurrentContent()))) {
      try {
        const contentState = convertFromRaw(JSON.parse(value));
        setEditorState(createWithContent(contentState));
      } catch (e) {
        console.error('Error updating editor content:', e);
      }
    }
  }, [value]);

  const handleChange = (state) => {
    setEditorState(state);
    
    if (onChange) {
      const contentState = state.getCurrentContent();
      const rawContent = convertToRaw(contentState);
      onChange(JSON.stringify(rawContent));
    }
  };

  const handleKeyCommand = (command, state) => {
    const newState = RichUtils.handleKeyCommand(state, command);
    if (newState) {
      handleChange(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  return (
    <Card variant="borderless" className="rich-text-editor">
      <Editor
        editorState={editorState}
        onChange={handleChange}
        handleKeyCommand={handleKeyCommand}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </Card>
  );
};

export default RichTextEditor;

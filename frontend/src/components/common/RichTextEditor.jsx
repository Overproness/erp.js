import React, { useState, useEffect } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { Typography } from 'antd';
import useLanguage from '@/locale/useLanguage';

const { Text } = Typography;

export const RichTextEditor = ({ initialContent = '', onChange, placeholder, readOnly = false }) => {
  const translate = useLanguage();
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [loaded, setLoaded] = useState(false);

  // Initialize with HTML content if provided
  useEffect(() => {
    if (!loaded && initialContent) {
      try {
        const contentBlock = htmlToDraft(initialContent);
        if (contentBlock) {
          const contentState = ContentState.createFromBlockArray(
            contentBlock.contentBlocks,
            contentBlock.entityMap
          );
          const newEditorState = EditorState.createWithContent(contentState);
          setEditorState(newEditorState);
        }
      } catch (error) {
        console.error('Error converting HTML to Draft.js content:', error);
      }
    }
    setLoaded(true);
  }, [initialContent, loaded]);

  // Handle editor state changes
  const handleEditorStateChange = (newEditorState) => {
    setEditorState(newEditorState);
    
    // Convert content to HTML and call onChange callback
    if (onChange) {
      const htmlContent = draftToHtml(convertToRaw(newEditorState.getCurrentContent()));
      onChange(htmlContent);
    }
  };

  // Toolbar options
  const toolbarOptions = {
    options: ['inline', 'blockType', 'fontSize', 'fontFamily', 'list', 'textAlign', 'colorPicker', 'link', 'embedded', 'emoji', 'image', 'remove', 'history'],
    inline: {
      options: ['bold', 'italic', 'underline', 'strikethrough', 'monospace', 'superscript', 'subscript'],
    },
    blockType: {
      options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Blockquote', 'Code'],
    },
    textAlign: {
      options: ['left', 'center', 'right', 'justify'],
    },
    image: {
      urlEnabled: true,
      uploadEnabled: true,
      alignmentEnabled: true,
      previewImage: true,
      inputAccept: 'image/gif,image/jpeg,image/jpg,image/png,image/svg',
      alt: { present: true, mandatory: false },
      defaultSize: {
        height: 'auto',
        width: 'auto',
      },
    }
  };

  return (
    <div className="rich-text-editor">
      <Editor
        editorState={editorState}
        wrapperClassName="editor-wrapper"
        editorClassName="editor"
        onEditorStateChange={handleEditorStateChange}
        toolbar={toolbarOptions}
        placeholder={placeholder || translate('Start typing...')}
        readOnly={readOnly}
        localization={{
          locale: 'en',
        }}
      />
      {readOnly && (
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          {translate('This content is read-only')}
        </Text>
      )}
    </div>
  );
};

// Default CSS for the editor
const style = `
  .rich-text-editor .editor-wrapper {
    border: 1px solid #d9d9d9;
    border-radius: 4px;
  }
  
  .rich-text-editor .editor {
    min-height: 200px;
    padding: 0 16px;
  }
  
  .rich-text-editor .rdw-editor-toolbar {
    border-bottom: 1px solid #d9d9d9;
    margin-bottom: 0;
    border-top: none;
    border-left: none;
    border-right: none;
    padding: 8px;
  }
`;

// Add editor styles to document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = style;
  document.head.appendChild(styleElement);
}

export default RichTextEditor;

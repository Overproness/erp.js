import React, { lazy, Suspense } from 'react';
import { Spin, Input } from '@/components/ui';
import RichTextErrorBoundary from '../ErrorBoundary/RichTextErrorBoundary';

// Use dynamic import to load the rich text editor
const DynamicEditor = lazy(() => import('./RichTextEditor'));

const FallbackEditor = ({ value, onChange, placeholder }) => {
  return (
    <Input.TextArea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || 'Enter text here...'}
      rows={6}
    />
  );
};

const SafeRichTextEditor = (props) => {
  return (
    <RichTextErrorBoundary
      fallback={(error, resetError) => <FallbackEditor {...props} />}
    >
      <Suspense fallback={<Spin />}>
        <DynamicEditor {...props} />
      </Suspense>
    </RichTextErrorBoundary>
  );
};

export default SafeRichTextEditor;

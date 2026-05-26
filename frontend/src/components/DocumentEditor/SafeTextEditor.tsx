import { Input, Spin } from '@/components/ui';
import React, { lazy, Suspense } from 'react';

const TextEditorFallback = ({
  content,
  setContent,
}: {
  content: string;
  setContent: (v: string) => void;
}) => (
  <Input.TextArea
    value={content}
    onChange={(e) => setContent(e.target.value)}
    rows={20}
    placeholder="Enter document content..."
    style={{ width: '100%', fontFamily: 'monospace' }}
  />
);

const DynamicTextEditor = lazy(() =>
  import('./TextEditor').catch((err) => {
    console.error('Ace editor failed to load, using textarea fallback:', err);
    return { default: TextEditorFallback };
  })
);

class AceEditorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Ace editor failed to load:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const SafeTextEditor = ({
  content,
  setContent,
  fileType,
}: {
  content: string;
  setContent: (v: string) => void;
  fileType: string;
}) => {
  const fallback = <TextEditorFallback content={content} setContent={setContent} fileType={fileType} />;

  return (
    <AceEditorBoundary fallback={fallback}>
      <Suspense fallback={<Spin />}>
        <DynamicTextEditor content={content} setContent={setContent} fileType={fileType} />
      </Suspense>
    </AceEditorBoundary>
  );
};

export default SafeTextEditor;

import React from 'react';
import { Alert, Button, Card, Typography } from '@/components/ui';
import useLanguage from '@/locale/useLanguage';

const { Title, Text } = Typography;

class RichTextErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error('Rich text editor error caught:', error, errorInfo);
  }

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback(error, this.resetError);
      }

      // Otherwise show the default error UI
      return (
        <Card className="error-boundary-card">
          <Alert
            message="Rich Text Editor Error"
            description={
              <div>
                <p>There was a problem loading the rich text editor component.</p>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Error: {error?.message || 'Unknown error'}
                </Text>
              </div>
            }
            type="error"
            showIcon
          />
          <div style={{ marginTop: '16px' }}>
            <Button type="primary" onClick={() => this.setState({ hasError: false, error: null })}>
              Try Again
            </Button>
          </div>
        </Card>
      );
    }

    return children;
  }
}

export default function RichTextErrorBoundaryWithHooks(props) {
  const translate = useLanguage();
  
  return <RichTextErrorBoundary {...props} translate={translate} />;
}

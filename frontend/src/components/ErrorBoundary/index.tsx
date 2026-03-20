import React from 'react';
import { Button, Result } from 'antd';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 20px' }}>
          <Result
            status="error"
            title="Something went wrong"
            subTitle={`${
              this.state.error?.message || 'An error occurred while loading the application'
            }`}
            extra={[
              <Button type="primary" key="console" onClick={this.handleReset}>
                Reload Application
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

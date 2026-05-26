import React from 'react';
import { Layout } from '@/components/ui';

const { Content } = Layout;

export default function DashboardLayout({ children }) {
  return (
    <Content
      style={{
        margin: '20px auto',
        width: '100%',
        maxWidth: '1400px',
        minHeight: '600px',
        padding: '0 20px',
        background: 'transparent',
      }}
    >
      {children}
    </Content>
  );
}

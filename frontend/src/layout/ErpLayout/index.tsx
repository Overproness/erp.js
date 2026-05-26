import { Layout } from '@/components/ui';
import { ErpContextProvider } from '@/context/erp';

const { Content } = Layout;

export default function ErpLayout({ children }) {
  return (
    <ErpContextProvider>
      <Content
        className="content-card"
        style={{
          margin: '20px auto',
          width: '100%',
          maxWidth: '1200px',
          padding: '32px',
        }}
      >
        {children}
      </Content>
    </ErpContextProvider>
  );
}

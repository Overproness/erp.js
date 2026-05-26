import { useState } from 'react';
import { Row, Col } from '@/components/ui';

export default function TabsContent({ content, defaultActiveKey, pageTitle }) {
  const firstKey = content[0]?.key ?? '0_' + content[0]?.label?.replace(/ /g, '_');
  const getKey = (item, index) =>
    item.key ? item.key : index + '_' + item.label.replace(/ /g, '_');

  const [activeKey, setActiveKey] = useState(defaultActiveKey ?? firstKey);

  const activeItem = content.find((item, index) => getKey(item, index) === activeKey) ?? content[0];

  return (
    <Row gutter={[24, 24]} className="tabContent" align="top">
      {/* Sidebar */}
      <Col xs={24} sm={24} md={7} lg={6}>
        <div className="content-card" style={{ marginBottom: '20px' }}>
          <div className="content-card-header">{pageTitle}</div>
        </div>
        <div className="content-card">
          <div className="content-card-body" style={{ padding: '8px 0', paddingBottom: 0 }}>
            {content.map((item, index) => {
              const key = getKey(item, index);
              const isActive = key === activeKey;
              return (
                <div
                  key={key}
                  onClick={() => setActiveKey(key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    borderLeft: isActive ? '3px solid #5b8def' : '3px solid transparent',
                    background: isActive ? 'rgba(91, 141, 239, 0.06)' : 'transparent',
                    color: isActive ? '#5b8def' : 'inherit',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {item.icon && <span style={{ fontSize: '14px' }}>{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Col>

      {/* Content */}
      <Col xs={24} sm={24} md={17} lg={18}>
        <div className="content-card" style={{ minHeight: '480px' }}>
          <div className="content-card-body" style={{ padding: '32px' }}>
            {activeItem?.children}
          </div>
        </div>
      </Col>
    </Row>
  );
}

import React from 'react';
import { Space, Button } from '@/components/ui';
import { BulbOutlined } from '@ant-design/icons';

const SuggestionChips = ({ suggestions, onSuggestionClick }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div style={{ marginTop: '16px' }}>
      <Space wrap size={[8, 8]}>
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            size="middle"
            type="default"
            icon={<BulbOutlined />}
            onClick={() => onSuggestionClick(suggestion)}
            style={{
              borderRadius: '20px',
              height: 'auto',
              padding: '8px 16px',
              fontSize: '13px',
              color: '#1890ff',
              borderColor: '#1890ff',
              backgroundColor: '#f0f7ff',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1890ff';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f7ff';
              e.currentTarget.style.color = '#1890ff';
            }}
          >
            {suggestion}
          </Button>
        ))}
      </Space>
    </div>
  );
};

export default SuggestionChips;

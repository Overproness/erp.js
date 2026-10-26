import React from 'react';

export interface TabItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

export interface MasterUnderlineTabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export const MasterUnderlineTabs: React.FC<MasterUnderlineTabsProps> = ({
  items,
  activeKey,
  onChange,
  className = '',
}) => {
  return (
    <div className={`m-tabs-underline ${className}`} role="tablist">
      {items.map((tab) => {
        const isActive = activeKey === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            className={`m-tab-underline-item ${isActive ? 'active' : ''}`}
            onClick={() => !tab.disabled && onChange(tab.key)}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: isActive ? '#0058c3' : '#f3f4f6',
                  color: isActive ? '#ffffff' : '#71767f',
                  lineHeight: 1,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ── Segmented Pill Tabs ────────────────────────────────────────────────────
export interface MasterPillTabsProps {
  items: Array<{ key: string; label: string; icon?: React.ReactNode }>;
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export const MasterPillTabs: React.FC<MasterPillTabsProps> = ({
  items,
  activeKey,
  onChange,
  className = '',
}) => {
  return (
    <div className={`etched-segmented ${className}`} role="tablist">
      {items.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`etched-segmented-item ${isActive ? 'active' : ''}`}
            onClick={() => onChange(item.key)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

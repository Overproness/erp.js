import React from 'react';
import { ArrowDownOutlined, ArrowUpOutlined } from '@/components/icons';

export interface MasterMetricCardProps {
  id?: string;
  label: string;
  value: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: string; // hex or rgb accent
  description?: string;
  onClick?: () => void;
  loading?: boolean;
}

export const MasterMetricCard: React.FC<MasterMetricCardProps> = ({
  label,
  value,
  prefix,
  suffix,
  change,
  trend = 'neutral',
  icon,
  color = '#0058c3',
  description,
  onClick,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="master-stat-card" style={{ minHeight: '115px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ width: '80px', height: '12px', background: '#f3f4f6', borderRadius: '4px' }} />
          <div style={{ width: '28px', height: '28px', background: '#f3f4f6', borderRadius: '6px' }} />
        </div>
        <div style={{ width: '120px', height: '28px', background: '#f3f4f6', borderRadius: '6px', marginBottom: '8px' }} />
        <div style={{ width: '60px', height: '10px', background: '#f3f4f6', borderRadius: '4px' }} />
      </div>
    );
  }

  const iconBg = `${color}14`; // 8% opacity tint

  return (
    <div
      className="master-stat-card"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div className="master-stat-header">
        <span className="master-stat-label">{label}</span>
        {icon && (
          <div
            className="master-stat-icon"
            style={{
              background: iconBg,
              color: color,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="master-stat-body">
        <div className="master-stat-value">
          {prefix && <span style={{ fontSize: '0.8em', marginRight: '2px', opacity: 0.85 }}>{prefix}</span>}
          {value}
          {suffix && <span style={{ fontSize: '0.7em', marginLeft: '4px', opacity: 0.75 }}>{suffix}</span>}
        </div>

        {change && (
          <span className={`master-stat-trend ${trend}`}>
            {trend === 'up' && <ArrowUpOutlined style={{ fontSize: '10px' }} />}
            {trend === 'down' && <ArrowDownOutlined style={{ fontSize: '10px' }} />}
            {change}
          </span>
        )}
      </div>

      {description && <div className="master-stat-desc">{description}</div>}
    </div>
  );
};

export default MasterMetricCard;

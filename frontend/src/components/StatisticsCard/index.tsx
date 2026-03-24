import { InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Spin, Statistic, Tooltip } from 'antd';
import PropTypes from 'prop-types';

/**
 * Reusable statistics card component
 */
const StatisticsCard = ({
  title,
  value,
  prefix,
  suffix,
  precision,
  loading,
  error,
  icon,
  color,
  gradient,
  description,
  tooltip,
  onRefresh,
  showRefresh = false,
  style = {},
  cardStyle = {},
  valueStyle = {},
  ...props
}) => {
  const defaultColors = {
    purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    green: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    blue: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    orange: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    red: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    pink: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
  };

  const getCardStyle = () => {
    const baseStyle = {
      borderRadius: '12px',
      border: '1px solid #e8e8e8',
      background:
        gradient ||
        (color && defaultColors[color]) ||
        'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      boxShadow: '0 2px 8px rgba(139, 92, 246, 0.15)',
      height: '100px',
      transition: 'all 0.3s ease',
      cursor: onRefresh ? 'pointer' : 'default',
      ...cardStyle,
    };

    return baseStyle;
  };

  const getValueStyle = () => ({
    color: '#fff',
    fontSize: '18px',
    fontWeight: '700',
    textAlign: 'center',
    ...valueStyle,
  });

  const getTitleStyle = () => ({
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  });

  const getDescriptionStyle = () => ({
    color: 'rgba(255,255,255,0.7)',
    fontSize: '9px',
    marginTop: '2px',
  });

  const handleCardClick = () => {
    if (onRefresh && !loading) {
      onRefresh();
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <Spin style={{ color: '#fff' }} size="small" />
        </div>
      );
    }

    if (error) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: 'rgba(255,255,255,0.8)',
          }}
        >
          <InfoCircleOutlined style={{ fontSize: '16px', marginBottom: '4px' }} />
          <span style={{ fontSize: '10px', textAlign: 'center' }}>{error}</span>
          {showRefresh && (
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              style={{ color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}
              onClick={(e) => {
                e.stopPropagation();
                onRefresh && onRefresh();
              }}
            />
          )}
        </div>
      );
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          padding: '12px',
        }}
      >
        <div>
          <div style={getTitleStyle()}>
            {title}
            {tooltip && (
              <Tooltip title={tooltip}>
                <InfoCircleOutlined style={{ marginLeft: '4px' }} />
              </Tooltip>
            )}
          </div>
          {description && <div style={getDescriptionStyle()}>{description}</div>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Statistic
            value={value}
            prefix={prefix || icon}
            suffix={suffix}
            precision={precision}
            valueStyle={getValueStyle()}
          />
          {showRefresh && !loading && (
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              style={{ color: 'rgba(255,255,255,0.8)' }}
              onClick={(e) => {
                e.stopPropagation();
                onRefresh && onRefresh();
              }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <Card
      style={{ ...getCardStyle(), ...style }}
      styles={{
        body: {
          padding: 0,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
      hoverable={!!onRefresh}
      onClick={handleCardClick}
      {...props}
    >
      {renderContent()}
    </Card>
  );
};

StatisticsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  prefix: PropTypes.node,
  suffix: PropTypes.string,
  precision: PropTypes.number,
  loading: PropTypes.bool,
  error: PropTypes.string,
  icon: PropTypes.node,
  color: PropTypes.oneOf(['purple', 'green', 'blue', 'orange', 'red', 'pink']),
  gradient: PropTypes.string,
  description: PropTypes.string,
  tooltip: PropTypes.string,
  onRefresh: PropTypes.func,
  showRefresh: PropTypes.bool,
  style: PropTypes.object,
  cardStyle: PropTypes.object,
  valueStyle: PropTypes.object,
};

export default StatisticsCard;

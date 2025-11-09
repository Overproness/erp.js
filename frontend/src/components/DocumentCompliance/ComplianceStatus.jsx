import useLanguage from '@/locale/useLanguage';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Tag, Tooltip } from 'antd';

export default function ComplianceStatus({ status, size = 'default' }) {
  const translate = useLanguage();

  // Define status colors and icons
  const statusConfig = {
    compliant: {
      color: 'success',
      icon: <CheckCircleOutlined />,
      text: translate('Compliant'),
    },
    non_compliant: {
      color: 'error',
      icon: <CloseCircleOutlined />,
      text: translate('Non-Compliant'),
    },
    review_required: {
      color: 'warning',
      icon: <ExclamationCircleOutlined />,
      text: translate('Review Required'),
    },
    exempt: {
      color: 'default',
      icon: <QuestionCircleOutlined />,
      text: translate('Exempt'),
    },
  };

  const config = statusConfig[status] || statusConfig.review_required;

  return (
    <Tooltip title={translate('Compliance Status')}>
      <Tag
        color={config.color}
        icon={config.icon}
        style={{ fontSize: size === 'large' ? '14px' : '12px' }}
      >
        {config.text}
      </Tag>
    </Tooltip>
  );
}

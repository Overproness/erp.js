import useLanguage from '@/locale/useLanguage';
import {
  LockOutlined,
  QuestionOutlined,
  SafetyOutlined,
  SecurityScanOutlined,
  UnlockOutlined,
} from '@/components/icons';
import { Tag, Tooltip } from '@/components/ui';

export default function DataClassificationBadge({ classification }) {
  const translate = useLanguage();

  // Define classification colors and icons
  const classificationConfig = {
    public: {
      color: 'green',
      icon: <UnlockOutlined />,
      text: translate('Public'),
      description: translate('Information that can be freely shared with the public'),
    },
    internal: {
      color: 'blue',
      icon: <SafetyOutlined />,
      text: translate('Internal'),
      description: translate('Information intended for use within the organization'),
    },
    confidential: {
      color: 'orange',
      icon: <SecurityScanOutlined />,
      text: translate('Confidential'),
      description: translate('Sensitive information that requires controlled access'),
    },
    restricted: {
      color: 'red',
      icon: <LockOutlined />,
      text: translate('Restricted'),
      description: translate('Highly sensitive information with strictly limited access'),
    },
    unclassified: {
      color: 'default',
      icon: <QuestionOutlined />,
      text: translate('Unclassified'),
      description: translate('Information that has not been classified'),
    },
  };

  const config = classificationConfig[classification] || classificationConfig.unclassified;

  return (
    <Tooltip title={config.description}>
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    </Tooltip>
  );
}

import {
  CreditCardOutlined,
  DollarOutlined,
  FileImageOutlined,
  RobotOutlined,
  SettingOutlined,
  TrophyOutlined,
} from '@ant-design/icons';

import TabsContent from '@/components/TabsContent/TabsContent';

import AiSettings from './AiSettings';
import CompanyLogoSettings from './CompanyLogoSettings';
import CompanySettings from './CompanySettings';
import FinanceSettings from './FinanceSettings';
import GeneralSettings from './GeneralSettings';
import MoneyFormatSettings from './MoneyFormatSettings';
import SocialMediaIntegrationSettings from './SocialMediaIntegrationSettings';

import useLanguage from '@/locale/useLanguage';
import { useParams } from 'react-router-dom';

export default function Settings() {
  const translate = useLanguage();
  const { settingsKey } = useParams();
  const content = [
    {
      key: 'general_settings',
      label: translate('General Settings'),
      icon: <SettingOutlined />,
      children: <GeneralSettings />,
    },
    {
      key: 'company_settings',
      label: translate('Company Settings'),
      icon: <TrophyOutlined />,
      children: <CompanySettings />,
    },
    {
      key: 'company_logo',
      label: translate('Company Logo'),
      icon: <FileImageOutlined />,
      children: <CompanyLogoSettings />,
    },
    {
      key: 'currency_settings',
      label: translate('Currency Settings'),
      icon: <DollarOutlined />,
      children: <MoneyFormatSettings />,
    },
    {
      key: 'finance_settings',
      label: translate('Finance Settings'),
      icon: <CreditCardOutlined />,
      children: <FinanceSettings />,
    },
    {
      key: 'ai_settings',
      label: translate('AI Settings'),
      icon: <RobotOutlined />,
      children: <AiSettings />,
    },
    {
      key: 'social_media_settings',
      label: translate('Social Media Settings'),
      icon: <SettingOutlined />,
      children: <SocialMediaIntegrationSettings />,
    },
  ];

  const pageTitle = translate('Settings');

  return <TabsContent defaultActiveKey={settingsKey} content={content} pageTitle={pageTitle} />;
}

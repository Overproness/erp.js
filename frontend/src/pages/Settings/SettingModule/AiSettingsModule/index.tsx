import React from 'react';
import SetingsSection from '../components/SetingsSection';
import UpdateSettingModule from '../components/UpdateSettingModule';
import AiSettingForm from './forms/AiSettingForm';
import useLanguage from '@/locale/useLanguage';

export default function AiSettingsModule({ config }) {
  const translate = useLanguage();
  return (
    <UpdateSettingModule config={config}>
      <SetingsSection
        title={translate('AI Settings')}
        description={translate('Configure AI document analysis and other AI features')}
      >
        <AiSettingForm />
      </SetingsSection>
    </UpdateSettingModule>
  );
}

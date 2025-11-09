import useLanguage from '@/locale/useLanguage';
import AiSettingsModule from './SettingModule/AiSettingsModule';

export default function AiSettings() {
  const translate = useLanguage();

  const entity = 'setting';

  const Labels = {
    PANEL_TITLE: translate('AI Settings'),
    DATATABLE_TITLE: translate('AI Settings'),
    ADD_NEW_ENTITY: translate('Add AI Settings'),
    ENTITY_NAME: translate('AI Settings'),
    SETTINGS_TITLE: translate('AI Settings'),
  };

  const configPage = {
    entity,
    settingsCategory: 'ai_settings',
    ...Labels,
  };

  return <AiSettingsModule config={configPage} />;
}
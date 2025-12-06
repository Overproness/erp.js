import { DataImportButton } from '@/components/DataEntry';
import useLanguage from '@/locale/useLanguage';
import UrlDataTableModule from './UrlModule/UrlDataTableModule';

export default function UrlManager() {
  const translate = useLanguage();

  const config = {
    entity: 'url',
    panelTitle: translate('URL Management'),
    dataTableTitle: translate('Your Shortened URLs'),
    searchConfig: {
      displayLabels: ['shortCode', 'originalUrl', 'title'],
      searchFields: 'shortCode,originalUrl,title,description',
    },
    deleteModalLabels: ['shortCode', 'originalUrl'],
  };

  const extra = (
    <DataImportButton
      moduleName="url"
      onImportComplete={(result) => {
        window.location.reload();
      }}
    />
  );

  return (
    <div style={{ padding: '0' }}>
      <UrlDataTableModule config={config} extra={extra} />
    </div>
  );
}

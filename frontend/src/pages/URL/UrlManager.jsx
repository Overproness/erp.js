import React from 'react';
import UrlDataTableModule from './UrlModule/UrlDataTableModule';
import useLanguage from '@/locale/useLanguage';

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

  return (
    <div style={{ padding: '0' }}>
      <UrlDataTableModule config={config} />
    </div>
  );
}

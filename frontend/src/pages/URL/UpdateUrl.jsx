import React from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/layout';
import UpdateUrlModule from './UrlModule/UpdateUrlModule';
import useLanguage from '@/locale/useLanguage';

export default function UpdateUrl() {
  const translate = useLanguage();
  const { id } = useParams();

  return (
    <PageHeader
      title={translate('Edit URL')}
      subTitle={translate('Update URL settings and configuration')}
    >
      <UpdateUrlModule urlId={id} />
    </PageHeader>
  );
}

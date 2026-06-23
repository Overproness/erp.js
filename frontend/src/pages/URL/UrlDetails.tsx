import React from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui';
import ReadUrlModule from './UrlModule/ReadUrlModule';
import useLanguage from '@/locale/useLanguage';

export default function UrlDetails() {
  const translate = useLanguage();
  const { id } = useParams();

  return (
    <PageHeader
      title={translate('URL Details')}
      subTitle={translate('View URL information and analytics')}
    >
      <ReadUrlModule urlId={id} />
    </PageHeader>
  );
}

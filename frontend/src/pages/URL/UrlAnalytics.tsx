import React from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@ant-design/pro-layout';
import UrlAnalyticsModule from './UrlModule/UrlAnalyticsModule';
import useLanguage from '@/locale/useLanguage';

export default function UrlAnalytics() {
  const translate = useLanguage();
  const { id } = useParams();

  return (

      <UrlAnalyticsModule urlId={id} />
  );
}

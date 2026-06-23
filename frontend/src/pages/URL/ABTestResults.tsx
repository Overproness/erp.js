import React from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui';
import ABTestResultsModule from './UrlModule/ABTestModule/ABTestResults';
import useLanguage from '@/locale/useLanguage';

export default function ABTestResults() {
  const translate = useLanguage();
  const { id } = useParams();

  return (
    <PageHeader
      title={translate('A/B Test Results')}
      subTitle={translate('View test performance and statistical analysis')}
    >
      <ABTestResultsModule testId={id} />
    </PageHeader>
  );
}

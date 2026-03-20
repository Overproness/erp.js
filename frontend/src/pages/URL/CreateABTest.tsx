import React from 'react';
import { PageHeader } from '@ant-design/pro-layout';
import CreateABTestModule from './UrlModule/ABTestModule/CreateABTest';
import useLanguage from '@/locale/useLanguage';

export default function CreateABTest() {
  const translate = useLanguage();

  return (
    <PageHeader
      title={translate('Create A/B Test')}
      subTitle={translate('Set up a new A/B testing campaign')}
    >
      <CreateABTestModule />
    </PageHeader>
  );
}
